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
  // Add filter
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
  embedAltairScatter(quarter);
  embedAltairHistogram(quarter);
  
  d3.select("#state-selector").style("display", "block");
}

function drawBarChart(quarter) {
  const col = "Quarterly Total_" + quarter;
  const data = globalData
    .filter(d => d[col])
    .sort((a, b) => +b[col] - +a[col])
    .slice(0, 10);

  d3.select("#bar-chart").html("");
  const svg = d3.select("#bar-chart")
    .append("svg")
    .attr("width", 800)
    .attr("height", 400);


  svg.append("text")
    .attr("x", 400)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .text(`Top 10 Institutions (${quarter})`);

  const x = d3.scaleBand()
    .domain(data.map(d => d.School))
    .range([60, 750])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => +d[col])])
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


  svg.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.School))
    .attr("y", d => y(+d[col]))
    .attr("width", x.bandwidth())
    .attr("height", d => 350 - y(+d[col]))
    .attr("fill", d => selectedBar === d.School ? "#e74c3c" : "#69b3a2")
    .on("mouseover", function(event, d) {
      d3.select(this).attr("fill", "#3498db");
      // show Tooltip
      svg.append("text")
        .attr("class", "tooltip")
        .attr("x", x(d.School) + x.bandwidth() / 2)
        .attr("y", y(+d[col]) - 10)
        .attr("text-anchor", "middle")
        .text(`${d.School}: ${d[col]}`);
    })
    .on("mouseout", function(event, d) {
      d3.select(this).attr("fill", 
        selectedBar === d.School ? "#e74c3c" : "#69b3a2");
      svg.selectAll(".tooltip").remove();
    })
    .on("click", function(event, d) {
      selectedBar = selectedBar === d.School ? null : d.School;
      updateCharts(currentQuarter);
    });
}

function drawScatterPlot(quarter) {
  const depCol = "Dependent Students_" + quarter;
  const indCol = "Independent Students_" + quarter;
  
  const filteredData = selectedState === "All" 
    ? globalData.filter(d => d[depCol] && d[indCol])
    : globalData.filter(d => d[depCol] && d[indCol] && d.State === selectedState);

  d3.select("#scatter-plot").select("svg").remove(); 

  const svg = d3.select("#scatter-plot")
    .insert("svg", ":first-child") 
    .attr("width", 800)
    .attr("height", 400);

  // Add title
  svg.append("text")
    .attr("x", 400)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .text(`Dependent vs Independent (${quarter}${selectedState === "All" ? "" : ` - ${selectedState}`})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(filteredData, d => +d[depCol])])
    .range([60, 750]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(filteredData, d => +d[indCol])])
    .range([350, 50]);

  svg.append("g")
    .attr("transform", "translate(0,350)")
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", "translate(60,0)")
    .call(d3.axisLeft(y));

  // Add ineractive scatter plot
  svg.selectAll("circle")
    .data(filteredData)
    .join("circle")
    .attr("cx", d => x(+d[depCol]))
    .attr("cy", d => y(+d[indCol]))
    .attr("r", 4)
    .attr("fill", "#1f77b4")
    .on("mouseover", function(event, d) {
      d3.select(this).attr("r", 8);
      // Show Tooltip
      svg.append("text")
        .attr("class", "tooltip")
        .attr("x", x(+d[depCol]) + 10)
        .attr("y", y(+d[indCol]) - 10)
        .text(`${d.School}\nDependent: ${d[depCol]}\nIndependent: ${d[indCol]}`);
    })
    .on("mouseout", function() {
      d3.select(this).attr("r", 4);
      svg.selectAll(".tooltip").remove();
    });
}

function drawMapPlotly(quarter) { /* original code */ }
function embedAltairScatter(quarter) { /* original code */ }
function embedAltairHistogram(quarter) { /* original code */ }
