let currentQuarter = "Q1";
let globalData = [];
let selectedState = "ALL";

document.addEventListener("DOMContentLoaded", function () {
  d3.csv("cleaned.csv").then(data => {
    globalData = data.map(d => {
      // Clean all numeric fields by removing commas
      Object.keys(d).forEach(key => {
        if (key.includes("Quarterly") || key.includes("Students")) {
          d[key] = d[key] ? d[key].replace(/,/g, '') : '0';
        }
      });
      return d;
    });
    
    populateStateDropdown();
    init();
    updateCharts(currentQuarter);
  });

  document.getElementById("stateDropdown").addEventListener("change", function () {
    selectedState = this.value;
    drawScatterPlot(currentQuarter);
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

function populateStateDropdown() {
  const dropdown = document.getElementById("stateDropdown");
  const states = Array.from(new Set(globalData.map(d => d.State))).sort();
  dropdown.innerHTML = '<option value="ALL">ALL</option>';
  states.forEach(state => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    dropdown.appendChild(option);
  });
}

function init() {}

function updateCharts(quarter) {
  drawBarChart(quarter);
  drawMapPlotly(quarter);
  drawScatterPlot(quarter);
  embedAltairScatter(quarter); // This now has the improved cutoff
  embedAltairHistogram(quarter);
}

// [Keep all your existing drawBarChart, drawMapPlotly, drawScatterPlot functions exactly as they are]

function embedAltairScatter(quarter) {
  const field = `Quarterly Total_${quarter}`;
  
  // Calculate max value from the data
  const maxValue = d3.max(globalData, d => +d[field] || 0);
  const stepSize = Math.max(1, Math.floor(maxValue / 100));

  const chart = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Altair Scatter Plot with Cutoff",
    data: { values: globalData },
    params: [{
      name: "cutoff",
      value: 0, // Default value
      bind: {
        input: "range",
        min: 0,
        max: maxValue,
        step: stepSize,
        name: "Minimum Applications: ",
        element: document.getElementById('altair-scatter') // Attach to our div
      }
    }],
    transform: [
      { 
        filter: {
          and: [
            { field: field, valid: true },
            { field: `Dependent Students_${quarter}`, valid: true },
            { field: `Independent Students_${quarter}`, valid: true },
            { expr: `datum["${field}"] >= cutoff` }
          ]
        }
      }
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
          test: `datum["${field}"] >= cutoff`,
          value: "#1f77b4" // Blue for points above cutoff
        },
        value: "#d3d3d3" // Light gray for points below cutoff
      },
      opacity: {
        condition: {
          test: `datum["${field}"] >= cutoff`,
          value: 0.8
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

  vegaEmbed("#altair-scatter", chart, {
    actions: false,
    config: {
      view: {
        continuousHeight: 300,
        continuousWidth: 400
      }
    }
  }).then(result => {
    // Optional: Style the Vega slider
    const slider = document.querySelector('#altair-scatter input[type="range"]');
    if (slider) {
      slider.style.width = "100%";
      slider.style.margin = "10px 0";
    }
  });
}

// [Keep your existing embedAltairHistogram function exactly as is]
