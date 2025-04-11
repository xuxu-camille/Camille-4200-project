let currentQuarter = "Q1";
let globalData = [];
let selectedState = "ALL";

document.addEventListener("DOMContentLoaded", function () {
  d3.csv("cleaned.csv").then(data => {
    if (!data || data.length === 0) {
      console.error("No data loaded or empty dataset");
      return;
    }
    globalData = data;
    populateStateDropdown();
    init();
    updateCharts(currentQuarter);
  }).catch(error => {
    console.error("Error loading CSV:", error);
  });

  document.getElementById("cutoffRange").addEventListener("input", function () {
    document.getElementById("cutoffValue").textContent = this.value;
    embedAltairScatter(currentQuarter);
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
  const stateDropdown = document.getElementById("stateDropdown");
  const uniqueStates = Array.from(new Set(globalData.map(d => d.State.trim()).filter(d => d !== "")));

  // Clear existing options
  stateDropdown.innerHTML = "";

  // Add 'ALL' option
  const allOption = document.createElement("option");
  allOption.value = "ALL";
  allOption.textContent = "ALL";
  stateDropdown.appendChild(allOption);

  // Add state options
  uniqueStates.sort().forEach(state => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    stateDropdown.appendChild(option);
  });
}

function init() {
  // 确保所有图表容器都存在
  if (!document.getElementById("bar-chart") || 
      !document.getElementById("map") ||
      !document.getElementById("scatter-plot") ||
      !document.getElementById("state-bar-chart") ||
      !document.getElementById("altair-scatter") ||
      !document.getElementById("altair-histogram")) {
    console.error("Missing chart containers");
    return;
  }
  
  // 初始化第一个标签页
  currentQuarter = "Q1";
  updateCharts(currentQuarter);
}

function updateCharts(quarter) {
  drawBarChart(quarter);
  drawMapPlotly(quarter);
  drawScatterPlot(quarter);
  drawStateSideBySideBarChart(quarter);
  embedAltairScatter(quarter);
  embedAltairHistogram(quarter);
}

function drawBarChart(quarter) {
  const col = "Quarterly Total_" + quarter;
  const data = globalData
    .filter(d => d[col] && !isNaN(parseInt(d[col].replace(/,/g, ''))))
    .sort((a, b) => parseInt(b[col].replace(/,/g, '')) - parseInt(a[col].replace(/,/g, '')))
    .slice(0, 10);

  d3.select("#bar-chart").html("");
  const svg = d3.select("#bar-chart").append("svg").attr("width", 800).attr("height", 400);

  const x = d3.scaleBand().domain(data.map(d => d.School)).range([60, 750]).padding(0.3);
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => parseInt(d[col].replace(/,/g, '')))])
    .range([350, 50]);

  svg.append("g")
    .attr("transform", "translate(0,350)")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  svg.append("g")
    .attr("transform", "translate(60,0)")
    .call(d3.axisLeft(y));

  const tooltip = d3.select("#bar-chart").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  svg.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.School))
    .attr("y", d => y(parseInt(d[col].replace(/,/g, ''))))
    .attr("width", x.bandwidth())
    .attr("height", d => 350 - y(parseInt(d[col].replace(/,/g, ''))))
    .attr("fill", "#69b3a2")
    .on("mouseover", function (event, d) {
      d3.select(this
