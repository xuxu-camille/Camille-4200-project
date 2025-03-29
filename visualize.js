/*********************************************
 * Global Variables & Tooltip
 *********************************************/
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

let globalData = [];
let selectedQuarter = "Q1";
let selectedState = null;

const quarterColor = {
  Q1: "#69b3a2",
  Q2: "#ff7f0e",
  Q3: "#1f77b4",
  Q4: "#2ca02c",
  Q5: "#d62728"
};

/*********************************************
 * Visualization 1: Map (D3) - Total by State
 *********************************************/
function drawMap() {
  clearContainer("#viz1");
  
  // First aggregate data by state for the selected quarter
  const stateData = {};
  globalData.forEach(d => {
    const state = d.State || "Unknown";
    const value = +d[`Quarterly Total_${selectedQuarter}`] || 0;
    if (!stateData[state]) {
      stateData[state] = 0;
    }
    stateData[state] += value;
  });

  const margin = { top: 30, right: 30, bottom: 30, left: 30 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#viz1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Load US states GeoJSON (would need to be included in your project)
  // This is a simplified example - in practice you'd load actual GeoJSON
  const states = [
    { id: "CA", name: "California", value: stateData["CA"] || 0 },
    { id: "TX", name: "Texas", value: stateData["TX"] || 0 },
    { id: "NY", name: "New York", value: stateData["NY"] || 0 },
    // Add more states as needed
  ];

  // Create a color scale
  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, d3.max(Object.values(stateData))]);

  // Draw state rectangles (simplified - would use actual paths from GeoJSON)
  svg.selectAll(".state")
    .data(states)
    .enter()
    .append("rect")
    .attr("x", (d, i) => (i % 4) * 120)
    .attr("y", (d, i) => Math.floor(i / 4) * 80)
    .attr("width", 100)
    .attr("height", 60)
    .attr("fill", d => colorScale(d.value))
    .attr("stroke", "#fff")
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
             .html(`State: ${d.name}<br>Total Students: ${formatNumber(d.value)}`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    })
    .on("click", (event, d) => {
      selectedState = d.id;
      updateAllVisualizations();
    });

  // Add state labels
  svg.selectAll(".state-label")
    .data(states)
    .enter()
    .append("text")
    .attr("x", (d, i) => (i % 4) * 120 + 50)
    .attr("y", (d, i) => Math.floor(i / 4) * 80 + 30)
    .attr("text-anchor", "middle")
    .text(d => d.id)
    .style("font-size", "12px")
    .style("fill", "#333");
}

/*********************************************
 * Visualization 2: Stacked Bar Chart (D3)
 * Dependent vs Independent for Q1-Q5
 *********************************************/
function drawStackedBarChart() {
  clearContainer("#viz2");
  
  // Prepare data - sum dependent and independent students per quarter
  const quarters = ["Q1", "Q2", "Q3", "Q4", "Q5"];
  const data = quarters.map(q => {
    const dep = d3.sum(globalData, d => +d[`Dependent Students_${q}`] || 0);
    const ind = d3.sum(globalData, d => +d[`Independent Students_${q}`] || 0);
    return {
      quarter: q,
      dependent: dep,
      independent: ind,
      total: dep + ind
    };
  });

  const margin = { top: 30, right: 30, bottom: 50, left: 60 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#viz2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Stack the data
  const stack = d3.stack()
    .keys(["dependent", "independent"])
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);

  const stackedData = stack(data);

  // Scales
  const x = d3.scaleBand()
    .domain(quarters)
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.total)])
    .range([height, 0]);

  // Color scale
  const color = d3.scaleOrdinal()
    .domain(["dependent", "independent"])
    .range(["#1f77b4", "#ff7f0e"]);

  // Create groups for each series
  const groups = svg.selectAll("g.layer")
    .data(stackedData)
    .enter()
    .append("g")
    .attr("class", "layer")
    .attr("fill", d => color(d.key));

  // Add rectangles
  groups.selectAll("rect")
    .data(d => d)
    .enter()
    .append("rect")
    .attr("x", d => x(d.data.quarter))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .on("mouseover", (event, d) => {
      const type = d3.select(event.currentTarget.parentNode).datum().key;
      tooltip.style("opacity", 1)
             .html(`Quarter: ${d.data.quarter}<br>${type}: ${formatNumber(d.data[type])}`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // Add axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Add legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - 100},0)`);

  ["dependent", "independent"].forEach((key, i) => {
    legend.append("rect")
      .attr("x", 0)
      .attr("y", i * 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(key));

    legend.append("text")
      .attr("x", 20)
      .attr("y", i * 20 + 12)
      .text(key)
      .style("font-size", "12px");
  });
}

/*********************************************
 * Update All Visualizations
 *********************************************/
function updateAllVisualizations() {
  drawMap();
  drawStackedBarChart();
  drawHistogram(selectedQuarter);
  drawBarChart(selectedQuarter);
  drawAltairScatterPlot();
}

/*********************************************
 * MAIN: Load Data and Initialize
 *********************************************/
d3.csv("cleaned.csv").then(data => {
  globalData = data;
  
  // Initialize with Q1 selected
  d3.select("#tab-Q1").classed("active", true);
  
  // Draw all visualizations
  updateAllVisualizations();

  // Set up quarter selection
  d3.selectAll(".tab-button").on("click", function() {
    d3.selectAll(".tab-button").classed("active", false);
    d3.select(this).classed("active", true);
    selectedQuarter = d3.select(this).attr("data-quarter");
    updateAllVisualizations();
  });
});
