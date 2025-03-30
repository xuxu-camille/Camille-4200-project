let currentQuarter = "Q1";
let globalData = [];
let selectedBar = null;
let selectedState = "All";

document.addEventListener("DOMContentLoaded", function () {
  d3.csv("cleaned.csv").then(data => {
    globalData = data;
    init();
    updateCharts(currentQuarter);
  });

  document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", function () {
      document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      currentQuarter = this.getAttribute("data-quarter");
      updateCharts(currentQuarter);
    });
  });
});

function init() {
  // Initialize state selector
  const states = [...new Set(globalData.map(d => d.State))].sort();
  d3.select("#scatter-plot")
    .append("select")
    .attr("id", "state-selector")
    .style("display", "none")
    .on("change", function() {
      selectedState = this.value;
      updateCharts(currentQuarter);
    })
    .selectAll("option")
    .data(["All", ...states])
    .join("option")
    .attr("value", d => d)
    .text(d => d);
}

function updateCharts(quarter) {
  drawBarChart(quarter);
  drawScatterPlot(quarter);
  drawMapPlotly(quarter);
  embedAltairScatter(quarter); // Now with interactive cutoff
  embedAltairHistogram(quarter);
  d3.select("#state-selector").style("display", "block");
}

function drawMapPlotly(quarter) {
  const col = "Quarterly Total_" + quarter;

  const stateData = {};
  globalData.forEach(d => {
    const state = d.State;
    if (!stateData[state]) stateData[state] = 0;
    stateData[state] += +d[col] || 0;
  });

  const states = Object.keys(stateData);
  const values = states.map(s => stateData[s]);

  const data = [{
    type: 'choropleth',
    locationmode: 'USA-states',
    locations: states,
    z: values,
    colorscale: 'Blues',
    colorbar: {
      title: `${quarter} Total`,
    },
  }];

  const layout = {
    geo: {
      scope: 'usa',
    },
    margin: { t: 0, b: 0 },
  };

  Plotly.newPlot('map', data, layout);
}

function embedAltairScatter(quarter) {
  // Initialize cutoff controls
  const cutoffRange = document.getElementById("cutoffRange");
  const cutoffValue = document.getElementById("cutoffValue");
  const field = `Quarterly Total_${quarter}`;
  
  // Set dynamic max value based on current quarter data
  const maxValue = d3.max(globalData, d => +d[field] || 0);
  cutoffRange.max = Math.ceil(maxValue / 1000) * 1000;
  cutoffRange.step = Math.max(1, Math.floor(maxValue / 100));

  // Update chart function
  const updateChart = () => {
    const cutoff = +cutoffRange.value;
    cutoffValue.textContent = cutoff;

    const chart = {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      description: "Altair Scatter Plot with Cutoff",
      data: { values: globalData },
      transform: [
        { filter: `datum.State == 'CA'` },
        { filter: `datum["${field}"] >= ${cutoff}` }
      ],
      mark: { 
        type: "point",
        tooltip: true 
      },
      encoding: {
        x: { 
          field: `Dependent Students_${quarter}`, 
          type: "quantitative",
          title: "Dependent Students"
        },
        y: { 
          field: `Independent Students_${quarter}`, 
          type: "quantitative",
          title: "Independent Students"
        },
        color: {
          condition: {
            test: `datum["${field}"] >= ${cutoff}`,
            value: "#1f77b4"
          },
          value: "lightgray"
        },
        opacity: {
          condition: {
            test: `datum["${field}"] >= ${cutoff}`,
            value: 0.7
          },
          value: 0.2
        },
        tooltip: [
          { field: "School", type: "nominal", title: "Institution" },
          { field: field, type: "quantitative", title: "Total Applications" },
          { field: `Dependent Students_${quarter}`, type: "quantitative" },
          { field: `Independent Students_${quarter}`, type: "quantitative" }
        ]
      }
    };

    vegaEmbed("#altair-scatter", chart, { actions: false });
  };

  // Initial render
  updateChart();
  
  // Add event listener
  cutoffRange.addEventListener("input", updateChart);
}

function embedAltairHistogram(quarter) {
  const chart = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Altair Histogram",
    data: { url: "cleaned.csv" },
    mark: "bar",
    encoding: {
      x: {
        field: `Quarterly Total_${quarter}`,
        bin: true,
        type: "quantitative",
        title: `FAFSA Total Applications (${quarter})`
      },
      y: { aggregate: "count", type: "quantitative" }
    }
  };
  vegaEmbed("#altair-histogram", chart, { actions: false });
}
