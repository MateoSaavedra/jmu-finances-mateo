import * as d3 from 'd3';
import * as d3Sankey from "d3-sankey";

const width = 928;
const height = 600;
const format = d3.format(",.0f");
const linkColor = "source-target"; // source, target, source-target, or a color string.

function createSankeySVG() {

  // Create a SVG container.
  const svg = d3.create("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [0, 0, width, height])
  .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Constructs and configures a Sankey generator.
  const sankey = d3Sankey.sankey()
  .nodeId(d => d.name)
  .nodeAlign(d3Sankey.sankeyJustify) // d3.sankeyLeft, etc.
  .nodeWidth(15)
  .nodePadding(10)
  .extent([[1, 5], [width - 1, height - 5]]);

  return { svg, sankey };
}


function drawSankey(svg, sankey, data) {
  const { nodes, links } = sankey({
    nodes: data.nodes.map(d => Object.assign({}, d)),
    links: data.links.map(d => Object.assign({}, d))
  });

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Draw nodes
  const rect = svg.append("g")
    .attr("stroke", "#000")
    .selectAll("rect")
    .data(nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", d => color(d.category || d.name));

  rect.append("title")
    .text(d => `${d.name}\n${format(d.value)}`);

  // Draw links
  const link = svg.append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5)
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("d", d3Sankey.sankeyLinkHorizontal())
    .attr("stroke", d => color(d.source.category || d.source.name))
    .attr("stroke-width", d => Math.max(1, d.width));

  link.append("title")
    .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);

  // Add node labels
  svg.append("g")
    .attr("font-size", 10)
    .attr("fill", "black")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    .text(d => d.name);

  document.body.appendChild(svg.node());
}

async function init() {
  const data = await d3.json("data/jmu.json");
  // Applies it to the data. We make a copy of the nodes and links objects
  // so as to avoid mutating the original.

  // Sankey 1
  const sankey1Data = {
    nodes: [
      { name: "JMU Student" },
      { name: "Fall" },
      { name: "Spring" },
      ...data["student-costs"]
        .filter(d => d.type === "student itemized")
        .map(d => ({ name: d.name }))
    ],
    links: [
      { source: "JMU Student", target: "Fall", value: 1 },
      { source: "JMU Student", target: "Spring", value: 1 },
      ...data["student-costs"]
        .filter(d => d.type === "student itemized")
        .map(d => ({
          source: d.semester,
          target: d.name,
          value: d["in-state"] + d["out-state"]
        }))
    ]
  };
  
  const { svg: svg1, sankey: sankey1 } = createSankeySVG();
  drawSankey(svg1, sankey1, sankey1Data);

  // Sankey 2
  const sankey2Data = {
    nodes: [
      { name: "Comprehensive Fee" },
      ...data["student-costs"]
        .filter(d => d.type === "Auxiliary Comprehensive Fee Component")
        .map(d => ({ name: d.name }))
    ],
    links: data["student-costs"]
      .filter(d => d.type === "Auxiliary Comprehensive Fee Component")
      .map(d => ({
        source: "Comprehensive Fee",
        target: d.name,
        value: d.amount
      }))
  };

  sankey2Data.links.sort((a, b) => b.value - a.value);
  const { svg: svg2, sankey: sankey2 } = createSankeySVG();
  drawSankey(svg2, sankey2, sankey2Data);

  const sankey3Data = {
    nodes: [
      // Items 
      { name: "Tuition and Fees" },
      { name: "State Appropriations" },
      { name: "Grants and Contracts" },
      { name: "Investment Income" },
  
      // Revenue categories
      { name: "Operating Revenues" },
      { name: "Nonoperating Revenues" },
  
      // Center node
      { name: "JMU" },
  
      // Expenses 
      { name: "Operating Expenses" },
  
      // Expense items
      { name: "Instruction" },
      { name: "Research" },
      { name: "Public Service" },
      { name: "Academic Support" }
    ],
    links: [
      // Items to revenue
      { source: "Tuition and Fees", target: "Operating Revenues", value: 200000 },
      { source: "State Appropriations", target: "Nonoperating Revenues", value: 150000 },
      { source: "Grants and Contracts", target: "Nonoperating Revenues", value: 100000 },
      { source: "Investment Income", target: "Nonoperating Revenues", value: 50000 },
  
      // Revenue to center node
      { source: "Operating Revenues", target: "JMU", value: 200000 },
      { source: "Nonoperating Revenues", target: "JMU", value: 300000 },
  
      // Center node to expenses
      { source: "JMU", target: "Operating Expenses", value: 400000 },
  
      // Expenses to specific expense items
      { source: "Operating Expenses", target: "Instruction", value: 150000 },
      { source: "Operating Expenses", target: "Research", value: 100000 },
      { source: "Operating Expenses", target: "Public Service", value: 80000 },
      { source: "Operating Expenses", target: "Academic Support", value: 70000 }
    ]
  };
  
  const { svg: svg3, sankey: sankey3 } = createSankeySVG();
  drawSankey(svg3, sankey3, sankey3Data);

  const sankey4Data = {
    nodes: [
      // Sports
      { name: "Football" },
      { name: "Men's Basketball" },
      { name: "Women's Basketball" },
      { name: "Other Sports" },
      { name: "Non-Program Specific" },

      // Items 
      { name: "Ticket Sales" },
      { name: "Concessions" },
      { name: "Sponsorships" },

      // Center node
      { name: "JMU Athletics" },

      // Expenses 
      { name: "Athletic Student Aid" },
      { name: "Travel" },
      { name: "Medical Expenses" },

      // Sports expenses
      { name: "Football (Expenses)" },
      { name: "Men's Basketball (Expenses)" },
      { name: "Women's Basketball (Expenses)" },
      { name: "Other Sports (Expenses)" },
      { name: "Non-Program Specific (Expenses)" }
    ],
    links: [
      // Leftmost to second-to-leftmost
      { source: "Football", target: "Ticket Sales", value: 200000 },
      { source: "Men's Basketball", target: "Concessions", value: 150000 },
      { source: "Women's Basketball", target: "Sponsorships", value: 150000 },
      { source: "Other Sports", target: "Ticket Sales", value: 100000 },
      { source: "Non-Program Specific", target: "Sponsorships", value: 300000 },

      // Items to athletics
      { source: "Ticket Sales", target: "JMU Athletics", value: 500000 },
      { source: "Concessions", target: "JMU Athletics", value: 200000 },
      { source: "Sponsorships", target: "JMU Athletics", value: 300000 },

      // Athletics to expenses
      { source: "JMU Athletics", target: "Athletic Student Aid", value: 600000 },
      { source: "JMU Athletics", target: "Travel", value: 300000 },
      { source: "JMU Athletics", target: "Medical Expenses", value: 100000 },

      // Expenses to sports 
      { source: "Athletic Student Aid", target: "Football (Expenses)", value: 200000 },
      { source: "Athletic Student Aid", target: "Men's Basketball (Expenses)", value: 150000 },
      { source: "Athletic Student Aid", target: "Women's Basketball (Expenses)", value: 150000 },
      { source: "Athletic Student Aid", target: "Other Sports (Expenses)", value: 100000 },
      { source: "Travel", target: "Non-Program Specific (Expenses)", value: 300000 },
      { source: "Medical Expenses", target: "Non-Program Specific (Expenses)", value: 100000 }
    ]
  };

  const { svg: svg4, sankey: sankey4 } = createSankeySVG();
  drawSankey(svg4, sankey4, sankey4Data);

  console.log('tmp', tmp);
  console.log('nodes', nodes);
  console.log('links', links);

  // Creates the rects that represent the nodes.
  const rect = svg.append("g")
    .attr("stroke", "#000")
    .selectAll()
    .data(nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", d => color(d.category));

  // Adds a title on the nodes.
  rect.append("title")
    .text(d => {
      console.log('d', d);
      return `${d.name}\n${format(d.value)}`});

  // Creates the paths that represent the links.
  const link = svg.append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5)
    .selectAll()
    .data(links)
    .join("g")
    .style("mix-blend-mode", "multiply");

  // Creates a gradient, if necessary, for the source-target color option.
  if (linkColor === "source-target") {
    const gradient = link.append("linearGradient")
      .attr("id", d => (d.uid = `link-${d.index}`))
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", d => d.source.x1)
      .attr("x2", d => d.target.x0);
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", d => color(d.source.category));
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", d => color(d.target.category));
  }

  link.append("path")
    .attr("d", d3Sankey.sankeyLinkHorizontal())
    .attr("stroke", linkColor === "source-target" ? (d) => `url(#${d.uid})`
      : linkColor === "source" ? (d) => color(d.source.category)
        : linkColor === "target" ? (d) => color(d.target.category)
          : linkColor)
    .attr("stroke-width", d => Math.max(1, d.width));

  link.append("title")
    .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);

  // Adds labels on the nodes.
  svg.append("g")
    .selectAll()
    .data(nodes)
    .join("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    .text(d => d.title);

    // Adds labels on the links.
  svg.append("g")
    .selectAll()
    .data(links)
    .join("text")
    .attr("x", d => {
      console.log('linkd', d)
      const midX = (d.source.x1 + d.target.x0) / 2;
      return midX < width / 2 ? midX + 6 : midX - 6
    })
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    .text(d => {
      console.log('linkd', d);
      return `${d.source.title} → ${d.value} → ${d.target.title}`
    });

  const svgNode = svg.node();
    document.body.appendChild(svgNode);
  return svgNode;
}

init();