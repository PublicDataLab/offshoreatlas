var margin = {
	top: 150,
	right: 100,
	bottom: 130,
	left: 120
};
var width = 1000;
var height = 400;

// let data = data2;

const nodePadding = 40;

const circularLinkGap = 2;

var sankey = d3.sankey()
	.nodeWidth(10)
	.nodePadding(nodePadding)
	.nodePaddingRatio(0.5)
	.scale(0.5)
	.size([width, height])
	.nodeId(function(d) {
		return d.name;
	})
	.nodeAlign(d3.sankeyJustify)
	.iterations(32);

var svg = d3.select("#chart").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom);

var g = svg.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

var linkG = g.append("g")
	.attr("class", "links")
	.attr("fill", "none")
	.attr("stroke-opacity", 0.2)
	.selectAll("path");

var nodeG = g.append("g")
	.attr("class", "nodes")
	.attr("font-family", "sans-serif")
	.attr("font-size", 10)
	.selectAll("g");

//run the Sankey + circular over the data
d3.tsv('data/China-Offshore-FDI-simplified.tsv')
	.then(function(data) {

		data.sort(function(x, y) {
			return d3.descending(+x['Extimate 01'], +y['Extimate 01']);
		})
		data.forEach(function(d){
			if(d['Source'] == 'China, P.R.: Mainland'){
				d['Source'] += " (source)"
			}
		})
		//get biggest 20 nodes
		data = data.slice(0,100)
		console.log(data)
		//get nodes
		let nodes = [];

		data.forEach(function(d) {
			nodes.push(d['Source']);
			nodes.push(d['Inter 1']);
			nodes.push(d['Target']);
		})

		nodes = d3.set(nodes)
			.values()
			.map(function(d) {
				return {
					'name': d
				}
			})
		//get edges
		let edges = []
		//get all edges
		data.map(function(d) {
			let e1 = {
				source: d['Source'],
				target: d['Inter 1'],
				value: +d['Extimate 01'],
				value2: +d['Extimate 02']
			}
			let e2 = {
				source: d['Inter 1'],
				target: d['Target'],
				value: +d['Extimate 01'],
				value2: +d['Extimate 02']
			}
			edges.push(e1);
			edges.push(e2);
		})
		//sum and reduce
		let finalEdges = []
		d3.nest()
			.key(function(d) {
				return d.source;
			})
			.key(function(d) {
				return d.target;
			})
			.rollup(function(v) {
				let v1 = d3.sum(v, function(w) {
					return w.value
				})
				let v2 = d3.sum(v, function(w) {
					return w.value2
				})
				return {
					'v1': v1,
					'v2': v2
				};
			})
			.entries(edges)
			.map(function(d) {
				d.values.forEach(function(e) {
					if (d.key != e.key) {
						let r = {
							source: d.key,
							target: e.key,
							value: e.value.v1,
							value2: e.value.v2
						}
						finalEdges.push(r);
					}
				})
			})

		results = {
			nodes: nodes,
			links: finalEdges
		}
		console.log(results)
		// console.log(data2)

		let sankeyData = sankey(results);
		let sankeyNodes = sankeyData.nodes;
		let sankeyLinks = sankeyData.links;

		let depthExtent = d3.extent(sankeyNodes, function(d) {
			return d.depth;
		});

		var nodeColour = d3.scaleSequential(d3.interpolateCool)
			.domain([0, width]);

		//Adjust link Y coordinates based on target/source Y positions

		var node = nodeG.data(sankeyNodes)
			.enter()
			.append("g");

		node.append("rect")
			.attr("x", function(d) {
				return d.x0;
			})
			.attr("y", function(d) {
				return d.y0;
			})
			.attr("height", function(d) {
				return d.y1 - d.y0;
			})
			.attr("width", function(d) {
				return d.x1 - d.x0;
			})
			.style("fill", function(d) {
				return nodeColour(d.x0);
			})
			.style("opacity", 0.5)
			.on("mouseover", function(d) {

				let thisName = d.name;

				node.selectAll("rect")
					.style("opacity", function(d) {
						return highlightNodes(d, thisName)
					})

				d3.selectAll(".sankey-link")
					.style("opacity", function(l) {
						return l.source.name == thisName || l.target.name == thisName ? 1 : 0.3;
					})

				node.selectAll("text")
					.style("opacity", function(d) {
						return highlightNodes(d, thisName)
					})
			})
			.on("mouseout", function(d) {
				d3.selectAll("rect").style("opacity", 0.5);
				d3.selectAll(".sankey-link").style("opacity", 0.7);
				d3.selectAll("text").style("opacity", 1);
			})

		node.append("text")
			.attr("x", function(d) {
				return (d.x0 + d.x1) / 2;
			})
			.attr("y", function(d) {
				return d.y0 - 12;
			})
			.attr("dy", "0.35em")
			.attr("text-anchor", "middle")
			.text(function(d) {
				return d.name;
			});

		node.append("title")
			.text(function(d) {
				return d.name + "\n" + (d.value);
			});

		var link = linkG.data(sankeyLinks)
			.enter()
			.append("g")

		link.append("path")
			.attr("class", "sankey-link")
			.attr("d", sankeyPath)
			.style("stroke-width", function(d) {
				return Math.max(1, d.width);
			})
			.style("opacity", 0.7)
			.style("stroke", function(link, i) {
				return link.circular ? "red" : "black"
			})



		link.append("title")
			.text(function(d) {
				return d.source.name + " → " + d.target.name + "\n Index: " + (d.index);
			});


		//ARROWS
		var arrowsG = linkG.data(sankeyLinks)
			.enter()
			.append("g")
			.attr("class", "g-arrow")
			.call(appendArrows, 10, 10, 4) //arrow length, gap, arrow head size

		arrowsG.selectAll("path")
			.style("stroke-width", function(d) {
				return Math.min(10, d.width/2);
			})
		//.style("stroke-dasharray", "10,10")

		arrowsG.selectAll(".arrow-head").remove()

		let duration = 5
		let maxOffset = 10;
		let percentageOffset = 1;

		var animateDash = setInterval(updateDash, duration);

		function updateDash() {

			arrowsG.selectAll("path")
				.style("stroke-dashoffset", percentageOffset * maxOffset)

			percentageOffset = percentageOffset == 0 ? 1 : percentageOffset - 0.01

		}

		function highlightNodes(node, name) {

			let opacity = 0.3

			if (node.name == name) {
				opacity = 1;
			}
			node.sourceLinks.forEach(function(link) {
				if (link.target.name == name) {
					opacity = 1;
				};
			})
			node.targetLinks.forEach(function(link) {
				if (link.source.name == name) {
					opacity = 1;
				};
			})

			return opacity;

		}
	})
