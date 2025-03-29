/*********************************************
 * Global Variables & Tooltip
 *********************************************/
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

let globalData = [];
let selectedQuarter = "Q1";
let selectedSchool = null;

const quarterColor = {
  Q1: "#69b3a2",
  Q2: "#ff7f0e",
  Q3: "#1f77b4",
  Q4: "#2ca02c",
  Q5: "#d62728"
};

/*********************************************
 * Utility Functions
 *********************************************/
function clearContainer(id) {
  d3.select(id).selectAll("*").remove();
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/*********************************************
 * Visualization 1: Map (D3)
 * Shows school locations or regional distribution
 *********************************************/
function drawMap() {
  clearContainer("#viz1");
  
  // If we had geographic data, we would use actual map coordinates
  // For this example, we'll create a simulated regional distribution
  
  const margin = { top: 30, right: 30, bottom: 30, left: 30 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#viz1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Simulate regions (in a real app, we'd use actual geoJSON)
  const regions = [
    { name: "North", x: 100, y: 50, count: 0 },
    { name: "South", x: 100, y: 200, count: 0 },
    { name: "East", x: 300, y: 100, count: 0 },
    { name: "West", x: 400, y: 250, count: 0 },
    { name: "Central", x: 250, y: 180, count: 0 }
  ];

  // Count schools per region (simulated)
  regions.forEach(region => {
    region.count = Math.floor(Math.random() * 15) + 5; // Random count for demo
  });

  // Draw regions
  svg.selectAll(".region")
    .data(regions)
    .enter()
    .append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.count * 2)
    .attr("fill", "#1f77b4")
    .attr("opacity", 0.6)
    .attr("stroke", "#fff")
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
             .html(`Region: ${d.name}<br>Schools: ${d.count}`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    })
    .on("click", (event, d) => {
      // Highlight schools from this region in other charts
      highlightRegion(d.name);
    });

  // Add region labels
  svg.selectAll(".region-label")
    .data(regions)
    .enter()
    .append("text")
    .attr("x", d => d.x)
    .attr("y", d => d.y - 10)
    .attr("text-anchor", "middle")
    .text(d => d.name)
    .style("font-size", "12px")
    .style("fill", "#333");
}

// Function to highlight schools from a region
function highlightRegion(region) {
  // In a real implementation, we would filter data by region
  console.log(`Schools from ${region} region highlighted`);
  // This would update other visualizations to focus on this region
}

/*********************************************
 * Visualization 2: Histogram (D3)
 * Shows distribution of student counts
 *********************************************/
function drawHistogram(q) {
  clearContainer("#viz2");
  
  const col = "Quarterly Total_" + q;
  const values = globalData.map(d => +d[col]).filter(d => !isNaN(d));
  
  const margin = { top: 30, right: 30, bottom: 50, left: 60 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#viz2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create bins
  const maxVal = d3.max(values);
  const bins = d3.bin().thresholds(20)(values);

  // X scale
  const x = d3.scaleLinear()
    .domain([0, maxVal])
    .range([0, width]);
  
  // Y scale
  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])
    .range([height, 0]);

  // Add axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));
  
  svg.append("g")
    .call(d3.axisLeft(y));

  // Add bars
  svg.selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", d => x(d.x0) + 1)
    .attr("y", d => y(d.length))
    .attr("width", d => x(d.x1) - x(d.x0) - 1)
    .attr("height", d => height - y(d.length))
    .attr("fill", quarterColor[q])
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
             .html(`Range: ${formatNumber(d.x0)}-${formatNumber(d.x1)}<br>Schools: ${d.length}`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .text(`Distribution of Student Counts (${q})`)
    .style("font-size", "14px");
}

/*********************************************
 * Visualization 3: Bar Chart (D3)
 * Top schools by enrollment
 *********************************************/
function drawBarChart(q) {
  clearContainer("#viz3");
  const col = "Quarterly Total_" + q;

  const data = [...globalData]
    .sort((a, b) => d3.descending(+a[col], +b[col]))
    .slice(0, 10);

  const margin = { top: 30, right: 30, bottom: 100, left: 80 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#viz3")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(data.map(d => d.School))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => +d[col]) || 0])
    .range([height, 0]);

  svg.append("g")
     .attr("transform", `translate(0,${height})`)
     .call(d3.axisBottom(x))
     .selectAll("text")
     .attr("transform", "translate(0,10)rotate(-45)")
     .style("text-anchor", "end");

  svg.append("g").call(d3.axisLeft(y));

  const bars = svg.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.School))
    .attr("y", height)
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", quarterColor[q]);

  bars.transition()
    .duration(800)
    .delay((d, i) => i * 50)
    .attr("y", d => y(+d[col]))
    .attr("height", d => height - y(+d[col]));

  // Enhanced interaction - highlight school across all visualizations
  bars.on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
             .html(`School: ${d.School}<br>${q} Total: ${formatNumber(d[col])}`);
      highlightSchool(d.School);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
      resetHighlight();
    })
    .on("click", (event, d) => {
      selectedSchool = d.School;
      updateAllVisualizations();
    });
}

/*********************************************
 * Visualization 4: Scatter Plot (D3)
 * Dependent vs Independent Students
 *********************************************/
function drawScatterChart(q) {
  clearContainer("#viz4");
  const depCol = "Dependent Students_" + q;
  const indCol = "Independent Students_" + q;

  const data = globalData.map(d => ({
    school: d.School,
    dep: +d[depCol],
    ind: +d[indCol],
    total: +d["Quarterly Total_" + q]
  })).filter(d => !isNaN(d.dep) && !isNaN(d.ind));

  const margin = { top: 30, right: 30, bottom: 50, left: 60 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#viz4")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.dep)])
    .range([0, width]);
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.ind)])
    .range([height, 0]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format(".2s")));
  
  svg.append("g")
    .call(d3.axisLeft(y).tickFormat(d3.format(".2s")));

  // Add circles
  const circles = svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.dep))
    .attr("cy", d => y(d.ind))
    .attr("r", d => Math.sqrt(d.total) / 10) // Size by total students
    .attr("fill", quarterColor[q])
    .attr("opacity", 0.7)
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5);

  // Add interaction
  circles.on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
             .html(`School: ${d.school}<br>Dependent: ${formatNumber(d.dep)}<br>Independent: ${formatNumber(d.ind)}`);
      highlightSchool(d.school);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
      resetHighlight();
    })
    .on("click", (event, d) => {
      selectedSchool = d.school;
      updateAllVisualizations();
    });

  // Add labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("Dependent Students");
  
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .text("Independent Students");
}

/*********************************************
 * Visualization 5: Scatter Plot (Altair)
 * Quarter-over-quarter growth comparison
 *********************************************/
function drawAltairScatterPlot() {
  clearContainer("#viz5");
  
  // Prepare data for Altair
  const altairData = globalData.map(d => ({
    School: d.School,
    Q1: +d["Quarterly Total_Q1"],
    Q2: +d["Quarterly Total_Q2"],
    Q3: +d["Quarterly Total_Q3"],
    Q4: +d["Quarterly Total_Q4"],
    Q5: +d["Quarterly Total_Q5"]
  })).filter(d => !isNaN(d.Q1) && !isNaN(d.Q5));
  
  // Calculate growth from Q1 to Q5
  altairData.forEach(d => {
    d.Growth = d.Q5 - d.Q1;
    d.GrowthRate = (d.Q5 - d.Q1) / d.Q1;
  });
  
  // Create Vega-Lite spec
  const spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "width": 600,
    "height": 400,
    "data": { "values": altairData },
    "mark": {
      "type": "circle",
      "opacity": 0.7,
      "stroke": "#fff",
      "strokeWidth": 0.5
    },
    "encoding": {
      "x": {
        "field": "Q1",
        "type": "quantitative",
        "title": "Q1 Enrollment",
        "scale": { "type": "log" }
      },
      "y": {
        "field": "GrowthRate",
        "type": "quantitative",
        "title": "Growth Rate (Q1 to Q5)",
        "scale": { "domain": [-1, 1] }
      },
      "size": {
        "field": "Q5",
        "type": "quantitative",
        "title": "Q5 Enrollment"
      },
      "color": {
        "field": "Growth",
        "type": "quantitative",
        "scale": { "scheme": "redblue", "reverse": true },
        "title": "Growth (Q5 - Q1)"
      },
      "tooltip": [
        {"field": "School", "type": "nominal", "title": "School"},
        {"field": "Q1", "type": "quantitative", "title": "Q1", "format": ","},
        {"field": "Q5", "type": "quantitative", "title": "Q5", "format": ","},
        {"field": "Growth", "type": "quantitative", "title": "Growth", "format": ","},
        {"field": "GrowthRate", "type": "quantitative", "title": "Growth Rate", "format": ".2%"}
      ]
    },
    "selection": {
      "highlight": {
        "type": "single",
        "on": "mouseover",
        "empty": "none"
      }
    },
    "config": {
      "view": { "stroke": "transparent" }
    }
  };
  
  // Embed the visualization
  vegaEmbed('#viz5', spec, { actions: false })
    .then(result => {
      // Add interaction handler
      result.view.addEventListener('click', (event, item) => {
        if (item && item.datum && item.datum.School) {
          selectedSchool = item.datum.School;
          updateAllVisualizations();
        }
      });
    })
    .catch(console.error);
}

/*********************************************
 * Highlight Functions
 *********************************************/
function highlightSchool(school) {
  // In a real implementation, we would highlight this school across all charts
  console.log(`Highlighting ${school} across visualizations`);
}

function resetHighlight() {
  // Reset highlights across all charts
  console.log("Resetting highlights");
}

/*********************************************
 * Update All Visualizations
 *********************************************/
function updateAllVisualizations() {
  drawMap();
  drawHistogram(selectedQuarter);
  drawBarChart(selectedQuarter);
  drawScatterChart(selectedQuarter);
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
