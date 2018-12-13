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



//define a dictionary for headers
var headers = {
	'source': 'Real Ultimate Origin',
	'step1': 'Reported Ultimate Origin (conduit 1)',
	'step2': 'Immediate origin (conduit 2)',
	'target': 'Destination'
}
var valueNames = {
	'value1': 'Estimate 1 (millions USD)',
	'value2': 'Estimate 2 (millions USD)',
}


//call the update
document.addEventListener("DOMContentLoaded", function(event) {
	//get slider
	var slider = document.getElementById("links-amount");
	var sourceMenu = document.getElementById("source-menu");


	sourceMenu.onchange = function() {
		update()
	}

	slider.oninput = function() {
		//call the function
		update()

	}

	function update() {
		var menuValue = sourceMenu.options[sourceMenu.selectedIndex].value
		var sliderValue = slider.value
		d3.select('#title').text('Biggest ' + sliderValue + ' flows to ' + sourceMenu.options[sourceMenu.selectedIndex].text)
		drawEverything('data/dataset-' + menuValue + '.tsv', sliderValue)
	}

	update();

	//run the Sankey + circular over the data
	function drawEverything(_datasource, _threshold) {
		//clear
		d3.select("#chart").html("");

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


		d3.tsv(_datasource)
			.then(function(data) {
				data.sort(function(x, y) {
					return d3.descending(+x[valueNames.value1], +y[valueNames.value1]);
				})

				//update slider
				slider.max = data.length;
				// console.log("new max", slider.max)

				//get biggest flows
				data = data.slice(0, _threshold)
				//get nodes
				let nodes = [];

				data.forEach(function(d) {

					for (header in headers) {
						if (d[headers[header]] != '') {
							var n = {
								'name': d[headers[header]],
								'type': headers[header],
								'value': (d[valueNames.value1]*1 + d[valueNames.value2]*1)/2
							}
							nodes.push(n);
						}
					}
				})

				nodes = d3.nest()
					.key(function(d){return d.name})
					.key(function(d) {
						return d.type;
					})
					.rollup(function(v){
						return d3.sum(v, function(w) {
							return w.value
						})

					}).entries(nodes)
					.map(function(d){
						d.name = d.key
						delete(d.key)
						d.values.forEach(function(e){
							d[e.key] = e.value;
						})
						d.values.sort(function(x, y) {
							return d3.descending(x.value, y.value);
						})
						d.mainType = d.values[0].key
						delete(d.values)
						return d
					})

				// console.log(nodes);

				//get edges
				let edges = []
				//get all edges
				data.map(function(d) {
					var steps = []
					for (header in headers) {
						if (d[headers[header]] != "") {
							steps.push(d[headers[header]])
						}
					}
					//Create edges
					for (var i = 1; i < steps.length; i++) {
						let e = {
							source: steps[i - 1],
							target: steps[i],
							value: +d[valueNames.value1],
							value2: +d[valueNames.value2]
						}

						edges.push(e);
					}

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
									value: Math.max(e.value.v1, e.value.v2),
									value2: Math.min(e.value.v1, e.value.v2)
								}
								finalEdges.push(r);
							}
						})
					})

				results = {
					nodes: nodes,
					links: finalEdges
				}
				// console.log(data2)

				let sankeyData = sankey(results);
				let sankeyNodes = sankeyData.nodes;
				let sankeyLinks = sankeyData.links;

				let depthExtent = d3.extent(sankeyNodes, function(d) {
					return d.depth;
				});

				var colDomain = []
				for(var i in headers){
					colDomain.push(headers[i])
				}

				var nodeColour = d3.scaleOrdinal()
					.domain(colDomain)
					.range(d3.schemeCategory10)

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
						return nodeColour(d.mainType);
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
						return d.name + "\nMain type: " + d.mainType + "\nTotal flows: " + (Math.round(d.value));
					});

				var link = linkG.data(sankeyLinks)
					.enter()
					.append("g")

				link.append("path")
					.attr("class", "sankey-link")
					.attr("d", sankeyPath)
					.style("stroke-width", function(d) {
						// console.log(d)
						return Math.max(1, d.width);
					})
					.style("opacity", 0.7)
					.style("stroke", function(link, i) {
						//return link.circular ? "red" : "black"
						return "red"
					})

				link.append("title")
					.text(function(d) {
						return d.source.name + " → " + d.target.name + "\n Index: " + (d.index);
					});

				var overLink = linkG.data(sankeyLinks)
					.enter()
					.append("g")

				overLink.append("path")
					.attr("class", "sankey-link")
					.attr("d", sankeyPath)
					.style("stroke-width", function(d) {
						d.width2 = d.value2 * d.width / d.value
						return d.width2;
					})
					.style("opacity", 1)
					.style("stroke", function(link, i) {
						return "red"
					})


				//ARROWS
				var arrowsG = linkG.data(sankeyLinks)
					.enter()
					.append("g")
					.attr("class", "g-arrow")
					.call(appendArrows, 10, 10, 4) //arrow length, gap, arrow head size

				arrowsG.selectAll("path")
					.style("stroke-width", function(d) {
						return d.width2;
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
				//
				link.on("click", function(d) {
					console.log(d)
					d.circular = !d.circular;
					sankeyData = sankey.update(sankeyData);
					link.selectAll('path')
						.attr("d", sankeyPath)
				})

				//drag
				node.call(d3.drag()
					.subject(function(d) {
						return d;
					})
					.on("start", function(d) {
						console.log(d)
					})
					.on("drag", function(d) {
						var w = d.x1 - d.x0;
						d.x0 = d3.event.x;
						d.x1 = d.x0 + w;

						var h = d.y1 - d.y0;
						// console.log(d.y1, d.y0, h)
						d.y0 = d3.event.y;
						d.y1 = d.y0 + h;
						sankeyData = sankey.update(sankeyData);

						link.data(sankeyData.links);

						//update nodes
						node.selectAll("rect")
							.attr("x", function(d) {
								return d.x0;
							})
							.attr("y", function(d) {
								return d.y0;
							})
						node.selectAll("text")
							.attr("x", function(d) {
								return (d.x0 + d.x1) / 2;
							})
							.attr("y", function(d) {
								return d.y0 - 12;
							})
						link.selectAll('path')
							.attr("d", sankeyPath)
						overLink.selectAll('path')
							.attr("d", sankeyPath)
						arrowsG.selectAll("path")
							.attr("d", sankeyPath)
					}));
			})
	}
});
