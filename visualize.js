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
 * Utility Functions
 *********************************************/
function clearContainer(id) {
  d3.select(id).selectAll("*").remove();
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/*********************************************
 * Visualization 1: Bar Chart (Top 10 Schools)
 *********************************************/
function drawBarChart(q) {
  clearContainer("#viz1");
  const col = `Quarterly Total_${q}`;

  const data = [...globalData]
    .sort((a, b) => d3.descending(+a[col], +b[col]))
    .slice(0, 10);

  const margin = { top: 30, right: 30, bottom: 100, left: 80 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#viz1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // X axis
  const x = d3.scaleBand()
    .range([0, width])
    .domain(data.map(d => d.School))
    .padding(0.2);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,10)rotate(-45)")
    .style("text-anchor", "end");

  // Y axis
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => +d[col])])
    .range([height, 0]);

  svg.append("g")
    .call(d3.axisLeft(y));

  // Bars
  svg.selectAll("mybar")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.School))
    .attr("y", d => y(+d[col]))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(+d[col]))
    .attr("fill", quarterColor[q])
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
             .html(`<strong>${d.School}</strong><br>Total: ${formatNumber(d[col])}`);
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
    .style("font-size", "16px")
    .text(`Top 10 Schools (${q})`);
}

/*********************************************
 * Visualization 2: Stacked Bar Chart
 * Dependent vs Independent for Q1-Q5
 *********************************************/
function drawStackedBarChart() {
  clearContainer("#viz2");
  
  // Prepare data
  const quarters = ["Q1", "Q2", "Q3", "Q4", "Q5"];
  const data = quarters.map(q => {
    return {
      quarter: q,
      dependent: d3.sum(globalData, d => +d[`Dependent Students_${q}`] || 0),
      independent: d3.sum(globalData, d => +d[`Independent Students_${q}`] || 0)
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
    .order(d3.stackOrderNone);

  const stackedData = stack(data);

  // Scales
  const x = d3.scaleBand()
    .domain(quarters)
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])])
    .range([height, 0]);

  // Color scale
  const color = d3.scaleOrdinal()
    .domain(["dependent", "independent"])
    .range(["#1f77b4", "#ff7f0e"]);

  // Create groups
  const groups = svg.selectAll("g.layer")
    .data(stackedData)
    .enter()
    .append("g")
    .attr("class", "layer")
    .attr("fill", d => color(d.key));

  // Add bars
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

  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Dependent vs Independent Students by Quarter");
}

/*********************************************
 * Visualization 3: Map (Total by State)
 *********************************************/
function drawMap() {
  clearContainer("#viz3");
  
  // Aggregate data by state
  const stateData = {};
  globalData.forEach(d => {
    const state = d.State || "Unknown";
    const value = +d[`Quarterly Total_${selectedQuarter}`] || 0;
    stateData[state] = (stateData[state] || 0) + value;
  });

  const margin = { top: 30, right: 30, bottom: 30, left: 30 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#viz3")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Color scale
  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, d3.max(Object.values(stateData))]);

  // For a real implementation, you would load actual US GeoJSON data
  // Here's a simplified version with state abbreviations
  const states = Object.keys(stateData).map(state => ({
    id: state,
    name: state,
    value: stateData[state]
  }));

  // Draw state representations (simplified)
  svg.selectAll(".state")
    .data(states)
    .enter()
    .append("circle")
    .attr("cx", (d, i) => 50 + (i % 10) * 50)
    .attr("cy", (d, i) => 50 + Math.floor(i / 10) * 50)
    .attr("r", d => Math.sqrt(d.value) / 10)
    .attr("fill", d => colorScale(d.value))
    .attr("stroke", "#fff")
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
             .html(`State: ${d.name}<br>Total: ${formatNumber(d.value)}`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // Add state labels
  svg.selectAll(".state-label")
    .data(states)
    .enter()
    .append("text")
    .attr("x", (d, i) => 50 + (i % 10) * 50)
    .attr("y", (d, i) => 50 + Math.floor(i / 10) * 50 - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .text(d => d.id);

  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text(`Student Distribution by State (${selectedQuarter})`);
}

/*********************************************
 * Update All Visualizations
 *********************************************/
function updateAllVisualizations() {
  drawBarChart(selectedQuarter);
  drawStackedBarChart();
  drawMap();
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
function drawAltairScatterPlot() {
  console.log("Attempting to draw Altair scatter plot..."); 
  
  clearContainer("#viz5");
  

  if (!globalData || globalData.length === 0) {
    console.error("No data available for Altair chart");
    return;
  }


  const altairData = globalData.map(d => ({
    School: d.School,
    Q1: +d["Quarterly Total_Q1"] || 0,
    Q2: +d["Quarterly Total_Q2"] || 0,
    Q3: +d["Quarterly Total_Q3"] || 0,
    Q4: +d["Quarterly Total_Q4"] || 0,
    Q5: +d["Quarterly Total_Q5"] || 0,
    State: d.State || "Unknown"
  }));

  console.log("Sample data for Altair:", altairData.slice(0, 3)); 

  
  altairData.forEach(d => {
    d.Growth = d.Q5 - d.Q1;
    d.GrowthRate = d.Q1 > 0 ? (d.Q5 - d.Q1) / d.Q1 : 0;
  });


  const spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "width": "container",
    "height": 400,
    "data": { "values": altairData },
    "mark": "circle",
    "encoding": {
      "x": {
        "field": "Q1", 
        "type": "quantitative",
        "title": "Q1 Enrollment",
        "scale": {"type": "log"}
      },
      "y": {
        "field": "GrowthRate",
        "type": "quantitative",
        "title": "Growth Rate (Q1 to Q5)"
      },
      "size": {
        "field": "Q5",
        "type": "quantitative",
        "title": "Q5 Enrollment"
      },
      "color": {
        "field": "Growth",
        "type": "quantitative",
        "scale": {"scheme": "redblue", "reverse": true},
        "title": "Growth (Q5 - Q1)"
      },
      "tooltip": [
        {"field": "School", "title": "School"},
        {"field": "State", "title": "State"},
        {"field": "Q1", "title": "Q1", "format": ","},
        {"field": "Q5", "title": "Q5", "format": ","},
        {"field": "Growth", "title": "Growth", "format": ","},
        {"field": "GrowthRate", "title": "Growth Rate", "format": ".2%"}
      ]
    }
  };

  console.log("Vega-Lite spec:", spec); 

  vegaEmbed('#viz5', spec, {
    actions: false,
    renderer: "canvas"
  })
  .then(result => {
    console.log("Altair chart rendered successfully");
    result.view.addEventListener('click', (event, item) => {
      if (item && item.datum) {
        console.log("Clicked item:", item.datum);
      }
    });
  })
  .catch(error => {
    console.error("Error rendering Altair chart:", error);
    d3.select("#viz5").html(`<div class="error">Failed to load chart: ${error.message}</div>`);
  });
}
