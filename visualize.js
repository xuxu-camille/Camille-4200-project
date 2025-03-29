let currentQuarter = "Q1";
let globalData = [];

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
  // future setup if needed
}

function updateCharts(quarter) {
  drawBarChart(quarter);
  drawMap(quarter);
  drawScatterPlot(quarter);
  embedAltairScatter(quarter);
  embedAltairHistogram(quarter);
}

function drawBarChart(quarter) {
  const col = "Quarterly Total_" + quarter;
  const data = globalData.filter(d => d[col]).sort((a, b) => +b[col] - +a[col]).slice(0, 10);

  d3.select("#bar-chart").html("");
  const svg = d3.select("#bar-chart").append("svg").attr("width", 800).attr("height", 400);

  const x = d3.scaleBand().domain(data.map(d => d.School)).range([60, 750]).padding(0.3);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => +d[col])]).range([350, 50]);

  svg.append("g").attr("transform", "translate(0,350)").call(d3.axisBottom(x)).selectAll("text")
    .attr("transform", "rotate(-40)").style("text-anchor", "end");
  svg.append("g").attr("transform", "translate(60,0)").call(d3.axisLeft(y));

  svg.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.School))
    .attr("y", d => y(+d[col]))
    .attr("width", x.bandwidth())
    .attr("height", d => 350 - y(+d[col]))
    .attr("fill", "#69b3a2");
}

function drawMap(quarter) {
  const col = "Quarterly Total_" + quarter;

  const stateTotals = {};
  globalData.forEach(d => {
    if (!stateTotals[d.State]) stateTotals[d.State] = 0;
    stateTotals[d.State] += +d[col];
  });

  d3.select("#map").html("");
  const svg = d3.select("#map").append("svg").attr("width", 960).attr("height", 600);
  const projection = d3.geoAlbersUsa().translate([480, 300]).scale(1000);
  const path = d3.geoPath().projection(projection);

  const color = d3.scaleQuantize()
    .domain([0, d3.max(Object.values(stateTotals))])
    .range(d3.schemeBlues[9]);

  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(us => {
    const idToState = {
      "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
      "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
      "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
      "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
      "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
      "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
      "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
      "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
      "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
      "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
      "56": "WY"
    };

    svg.selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
      .join("path")
      .attr("d", path)
      .attr("fill", d => {
        const state = idToState[d.id.toString().padStart(2, "0")];
        return color(stateTotals[state] || 0);
      })
      .attr("stroke", "#fff");
  });
}

function drawScatterPlot(quarter) {
  const depCol = "Dependent Students_" + quarter;
  const indCol = "Independent Students_" + quarter;
  const data = globalData.filter(d => d[depCol] && d[indCol]);

  d3.select("#scatter-plot").html("");
  const svg = d3.select("#scatter-plot").append("svg").attr("width", 800).attr("height", 400);

  const x = d3.scaleLinear().domain([0, d3.max(data, d => +d[depCol])]).range([60, 750]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => +d[indCol])]).range([350, 50]);

  svg.append("g").attr("transform", "translate(0,350)").call(d3.axisBottom(x));
  svg.append("g").attr("transform", "translate(60,0)").call(d3.axisLeft(y));

  svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(+d[depCol]))
    .attr("cy", d => y(+d[indCol]))
    .attr("r", 4)
    .attr("fill", "#1f77b4");
}

function embedAltairScatter(quarter) {
  const chart = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Altair Scatter Plot",
    data: { url: "cleaned.csv" },
    transform: [{ filter: "datum.State === 'CA'" }],
    mark: "point",
    encoding: {
      x: { field: `Dependent Students_${quarter}`, type: "quantitative" },
      y: { field: `Independent Students_${quarter}`, type: "quantitative" },
      tooltip: [{ field: "School", type: "nominal" }]
    }
  };
  vegaEmbed("#altair-scatter", chart, { actions: false });
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
