/**
 * Add enter button trigger to input fields
 */
document.getElementById("input-load-file").addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    document.getElementById("button-load-file").click();
  }
});
document.getElementById("input-search-tree").addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    document.getElementById("button-search-tree").click();
  }
});

/**
 * Reset Zoom
 */
function resetZoom() {
  const main = d3.select("#chart-main");
  main.attr("transform", "translate(0, 10) scale(1)");
}

/**
 * Search String/Regex in tree leaves
 */
function searchTree() {

  const _search = document.getElementById("input-search-tree").value;
  const search = new RegExp(_search, "i");

  if (window.data === undefined) {
    return;
  }

  if (_search === "") {
    d3.selectAll(".link").classed("link-selected", false);
    return;
  }

  d3.selectAll(".link")
    .classed("link-selected", d => {
      let leaves = d.target.leaves();
      if (leaves.find(d => d.data.name.match(search))) {
        return true;
      } else
        return false;
    });
}

/**
 * Load file from data path and start rendering.
 * @param {path} arg path to prepend to the filename.
 */
function loadFile(path = "/data/") {

  const filename = document.getElementById("input-load-file").value ? document.getElementById("input-load-file").value : "example.json";

  d3.json(path + filename)
    .then(data => {
      document.getElementById("load-file-error").classList.add("d-none");
      document.getElementById("stack-selection").classList.add("d-none");
      document.getElementById("visualisation-options").classList.remove("d-none");
      window.data = data;
      window.hiera = d3.hierarchy(data);
      resetZoom();
      initialiseUI(data);
    })
    .catch(message => {
      document.getElementById("load-file-error").classList.remove("d-none");
      document.getElementById("stack-selection").classList.add("d-none");
      document.getElementById("visualisation-options").classList.add("d-none");
    });
}

/**
 * Initialise UI after loading a file
 * @param {data}
 */
function initialiseUI(data) {

  // Initialise tree cutoff values
  let cutoffMin = Number.MAX_VALUE;
  let cutoffMax = Number.MIN_VALUE;

  d3.hierarchy(data).descendants().forEach(node => {
    if (node.data.distance) {
      if (node.data.distance > cutoffMax) cutoffMax = node.data.distance;
      if (node.data.distance < cutoffMin) cutoffMin = node.data.distance;
    }
  });

  document.getElementById("range-graph-cutoff").min = cutoffMin;
  document.getElementById("range-graph-cutoff").max = cutoffMax;
  document.getElementById("range-graph-cutoff").step = 0.1;
  document.getElementById("value-graph-cutoff").value = document.getElementById("range-graph-cutoff").value;

  renderGraph();
}

/**
 * Show selected stack data
 * @param {event}
 * @param {data}
 */
function showStackSelection(event, data) {

  document.getElementById("stack-selection").classList.remove("d-none");

  const leaves = data.leaves();
  const selection = d3.select("#stack-selection-list").selectAll("li").data(leaves);

  d3.selectAll(".node")
    .classed("node-selected", d => { return data === d ? true : false; });

  selection.enter().append("li")
    .merge(selection)
    .attr("class", "nav-item nav-link list-group-item")
    .html(d => d.data.name);

  selection.exit().remove();
}

/**
 * Calculates the links to render, reducing the child links to the farthers Node
 * @param {node}
 */
function reduceLinks(node) {
  const root = node;
  let _links = [];

  root.each(function(node) {
    if (node !== root) {
      if (node.children) {
        let farthestChild = node.children.reduce(function(prev, current) {
          return (prev.y > current.y) ? prev : current;
        });
        _links.push({source: node.parent, target: node});
        _links.push({source: node, target: farthestChild});
      }
    }
  });
  return _links;
}

/**
 * Rendering links between nodes (vertical layout)
 * @param {data}
 */
function elbow_v(data) {
  return "M" + data.source.y + "," + data.source.x + "V" + data.target.x + "H" + data.target.y;
}

/**
 * Rendering links between nodes (horizontal layout)
 * @param {data}
 */
function elbow_h(data) {
  return "M" + data.source.x + "," + data.source.y + "H" + data.target.x + "V" + data.target.y;
}

/**
 * Render the d3 links
 * @param {root} Hierarchy root
 */
function renderLinks(root) {

  const main = d3.select("#chart-main");
  const links = main.selectAll(".link").data(reduceLinks(root));

  let linksEnter = links.enter()
      .append("path")
      .attr("class", "link");

  linksEnter.merge(links)
    .attr("d", elbow_h);

  links.exit().remove();
}

/**
 * Render the d3 nodes
 * @param {root} Hierarchy root
 */
function renderNodes(root) {

  const main = d3.select("#chart-main");
  const nodes = main.selectAll(".node").data(root.descendants());
  const texts = main.selectAll(".node-text").data(root.descendants());

  const nodeAttr = {
    "width": 10,
    "height": 10
  };

  let nodesEnter = nodes.enter()
      .append("g")
      .attr("class", "node")
      .on("click", showStackSelection);

  nodesEnter.append("rect")
    .attr("width", nodeAttr.width)
    .attr("height", nodeAttr.height);

  nodesEnter.merge(nodes)
    .attr("transform", d => { return "translate(" + (d.x - nodeAttr.width / 2) + "," + (d.y - nodeAttr.height / 2) + ")"; })
    .classed("node-child", d => { return d.children ? false : true; });

  let textsEnter = texts.enter()
      .append("text")
      .attr("class", "node-text");

  textsEnter.merge(texts)
    .attr("x", d => {return d.x + 5;})
    .attr("y", d => {return d.y;})
    .text(d => { return d.children ? d.leaves().length : ""; });

  texts.exit().remove();
  nodes.exit().remove();
}

/**
 * Rendering Wrapper
 */
function renderGraph() {

  const root = window.hiera;

  const height = document.getElementById("chart-container").clientWidth;
  const width = document.getElementById("chart-container").clientHeight * 0.90;
  const ratio = 1;

  window.container = d3.select("#chart-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-height / 4, -width / 4, width, height]);
  const tree = d3.stackedtree().nodeSize([40, 40]).ratio(ratio)(root);

  const main = d3.select("#chart-main");
  const zoom = d3.zoom().on("zoom", e => {
    main.attr("transform", (transform = e.transform));
  });

  window.container.call(zoom);

  renderLinks(root);
  renderNodes(root);
}

/**
 * Return all leaves from a subtree
 * @param {node}
 */
function getAllLeaves(node) {
  let leaves = [];
  function _getLeaves(node) {
    if (node.children.length === 0) {
      leaves.push({
        "name": node.name,
        "distance": node.distance,
        "children": []
      });
      return;
    }
    for (let child in node.children) {
      _getLeaves(node.children[child]);
    }
  }
  _getLeaves(node);

  return leaves;
}

/**
 * Restructure tree using the distance.
 * @param {node} Hierarchy root
 * @param {threshold} Threshold for tree cutoff
 */
function cutTree(node, threshold) {
  function _cut(node) {
    if (node.distance <= threshold && node.children) {
      node.children = getAllLeaves(node);
      return;
    }
    for (let child in node.children) {
      _cut(node.children[child]);
    }
  }
  _cut(node);

  return node;
}

/**
 * Update tree cutoff value
 * @param {value} New cutoff value
 */
function updateTreeCutoff(value) {

  let _value;

  const valueMax = document.getElementById("range-graph-cutoff").max;
  const valueMin = document.getElementById("range-graph-cutoff").min;
  _value = value >= valueMax ? valueMax : value;
  _value = value <= valueMin ? valueMin : value;

  document.getElementById("value-graph-cutoff").value = _value;
  document.getElementById("range-graph-cutoff").value = _value;

  // Copy Graph data into new object, since the cut function rearanges the tree
  let _data = JSON.parse(JSON.stringify(window.data));
  let data = cutTree(_data, _value);

  window.hiera = d3.hierarchy(data);

  renderGraph();
}
