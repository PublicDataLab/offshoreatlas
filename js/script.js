var margin = {
	top: 0,
	right: 10,
	bottom: 0,
	left: 10
};

//variables will be updated when the page is loaded
var width, height;

//minimum size, in pixels, for links with gradient.
var minimumLinkSize = 3;

//minimum size of the flow, in dollars
var minimumAmount = 1000

const nodePadding = 40;

const circularLinkGap = 2;

var nodeWidth = 4;



//define a dictionary for headers
var headers = {
	'source': 'Real Ultimate Origin',
	'step1': 'Reported Ultimate Origin (conduit 1)',
	'step2': 'Immediate origin (conduit 2)',
	'target': 'Destination'
}
var headersID = {
	'Real Ultimate Origin': 0,
	'Reported Ultimate Origin (conduit 1)': 1,
	'Immediate origin (conduit 2)': 2,
	'Destination': 3
}
var valueNames = {
	'value1': 'Estimate 1 (millions USD)',
	'value2': 'Estimate 2 (millions USD)',
}




//call the update
document.addEventListener("DOMContentLoaded", function() {
	//update size according to viewport
	width = d3.select("#chart").node().getBoundingClientRect().width - margin.right - margin.left;
	height = d3.select("#chart").node().getBoundingClientRect().height - margin.top - margin.bottom;
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

	d3.select("#download").on("click", function(){
		var svg = document.getElementById("viz");
		//get svg source.
		var serializer = new XMLSerializer();
		var source = serializer.serializeToString(svg);

		//add name spaces.
		if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
		source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
		}
		if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
		source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
		}

		//add xml declaration
		source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

		//convert svg source to URI data scheme.
		var svgUrl = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);

		//set url value to a element's href attribute.
		var downloadLink = document.createElement("a");
		downloadLink.href = svgUrl;
		downloadLink.download = name;
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
		//you can download svg file by right click menu.
		})

	function update() {
		var menuValue = sourceMenu.options[sourceMenu.selectedIndex].value
		var sliderValue = slider.value
		var targetCountryName = sourceMenu.options[sourceMenu.selectedIndex].text
		d3.select('#title').text(function(){
			if(sliderValue == 1){
				return "Aggregated money flows to " + targetCountryName
			} else if(sliderValue == 2) {
				return "Top country with the biggest flow of money to " + targetCountryName
			} else {
				return "Top " + (sliderValue-1) + " countries with the biggest flow of money to " + targetCountryName
			}
		})
		drawEverything('data/dataset-' + menuValue + '.tsv', sliderValue, null)
	}

	update();

	//run the Sankey + circular over the data
	function drawEverything(_datasource, _threshold, _filter) {

		console.log(_datasource, _threshold, _filter)
		//clear
		d3.select("#chart").html("");

		var svg = d3.select("#chart").append("svg")
			.attr("id", "viz")
			.attr("width", width)
			.attr("height", height);

		var defs = svg.append("defs");

		//pass a unique id and an array of colors
		function createAnimatedGradient(_id, _colors) {

			let _gradient = defs.append("linearGradient")
				.attr("id", _id)
				.attr("x1","0%")
				.attr("y1","0%")
				.attr("x2","100%")
				.attr("y2","0%")
				.attr("gradientUnits","userSpaceOnUse")
				.attr("spreadMethod", "reflect");

			_gradient.selectAll(".stop")
				.data(_colors)
				.enter().append("stop")
				.attr("offset", function(d,i) { return i/(_colors.length-1); })
				.attr("stop-color", function(d) { return d; });

			_gradient.append("animate")
				.attr("attributeName","x1")
				.attr("values","0%;100%")
				.attr("dur","3s")
				.attr("repeatCount","indefinite");

			_gradient.append("animate")
				.attr("attributeName","x2")
				.attr("values","100%;200%")
				.attr("dur","3s")
				.attr("repeatCount","indefinite");

			return _gradient;
		}

		// create the two gradients, one that goes forward, the other that is backward
		createAnimatedGradient("gradient-conduit-front", ["#c300ff", "#f7931e", "#f7931e", "#c300ff"]);
		createAnimatedGradient("gradient-conduit-back", ["#f7931e", "#c300ff", "#c300ff", "#f7931e"]);
		createAnimatedGradient("gradient-direct-front", ["#00adff", "#99ff66", "#99ff66", "#00adff"]);
		createAnimatedGradient("gradient-direct-back", ["#99ff66", "#00adff", "#00adff", "#99ff66"]);

		var g = svg.append("g")

		var linkG = g.append("g")
			.attr("class", "links")
			.attr("fill", "none")
			.attr("stroke-opacity", 0.2)
			.selectAll("path");

		var nodeG = g.append("g");

		var sankey = d3.sankeyCircular()
			.nodeWidth(nodeWidth)
			.nodePadding(nodePadding)
			.margin(margin)
			.size([width, height])
			.nodeId(function(d) {
				return d.name;
			})
			.nodeAlign(function(node){
				return node.typeId;
			})
			.groupBy('countryCode')
			.iterations(32);


		d3.tsv(_datasource)
			.then(function(data){
				data.forEach(function(d){
					//parse values
					d[valueNames.value1] = d[valueNames.value1]*1;
					d[valueNames.value2] = d[valueNames.value2]*1;
				})
				return data
			})
			.then(function(data) {
				//filter all the flows smaller than the minimum threshold
				var data = data.filter(function(d){ return d[valueNames.value1]*1 > minimumAmount || d[valueNames.value2]*1 > minimumAmount});

				//if an edge is selected, filter the data
				if(_filter != null){
					console.log('filter', _filter)
					if(_filter.filterType == 'node') {
							var data = data.filter(function(d){
								//get the overall target country
								var main = d[headers.target]
								//if value not set, if the value of corresponding type is not stopped, return true
								if(_filter.value == null){
									var v = d[_filter.type];

									if(!_filter.exclude.has(v) && v != main && v!=""){
										console.log(v)
										return true
									}
								} else {
									for (header in headers) {
										console.log(header)
										if (d[headers[header]] != "") {
											var v = d[headers[header]];
											var t = headers[header];

											console.log(_filter.type, t)
											// if(_filter.exclude.has(v) && v != main) {
											// 	return false
											// } else
											if(_filter.type == null) {
												return _filter.value == v;
											} else {
												return _filter.type == t;
											};
										}
									}
								}
							})
							console.log(data)
						}
					//remove threshold
					_threshold = data.length;
					// d3.select('#range-selector')
					// 	.style("visibility", "hidden");

				} else {
					// no filter
					d3.select('#range-selector')
						.style("visibility", "visible");
				}

				//function to get nodes from the original data structure
				function getNodes(_data, keepType) {
					let _nodes = [];
					_data.forEach(function(d) {

						for (header in headers) {
							if (d[headers[header]] != '') {
								var n = {
									'name': keepType ? d[headers[header]] + "-" + header : d[headers[header]],
									'countryCode': d[headers[header]],
									'type': headers[header],
									'value': Math.max(d[valueNames.value1]*1, d[valueNames.value2]*1)
								}
								_nodes.push(n);
							}
						}
					})

					_nodes = d3.nest()
						.key(function(d){return d.name})
						.key(function(d) {
							return d.type;
						})
						.rollup(function(v){
							return d3.sum(v, function(w) {
								return w.value
							})

						}).entries(_nodes)
						.map(function(d){
							d.countryCode = keepType ? d.key.split("-")[0] : d.key
							d.name = d.key
							delete(d.key)
							d.values.forEach(function(e){
								d[e.key] = e.value;
							})
							d.values.sort(function(x, y) {
								return d3.descending(x.value, y.value);
							})
							d.totalFlow = d.values.reduce((total, item) => total + item.value, 0);
							d.mainType = d.values[0].key
							d.type = d.values[0].key
							// delete(d.values)
							return d
						})
						//if keeptype is enabled, the maintype must be recalculated

						if(keepType){
							var _uniqueNodes = d3.nest()
								.key(function(d){return d.countryCode})
								.rollup(function(v){
									// return the type for the maximum node
									return max = v.sort(function(x, y) {
										return d3.descending(x.totalFlow, y.totalFlow);
									})[0].mainType
								}).entries(_nodes)
							_uniqueNodes = d3.map(_uniqueNodes, function(d){
								return d.key
							})
							//reassociate main type
							_nodes.forEach(function(d){
								d.mainType = _uniqueNodes.get(d.countryCode).value;
								d.typeId = headersID[d.mainType]
							})
						}
					return _nodes;
				}
				//get nodes, sort them, filter them
				let nodes = getNodes(data)
					.sort(function(a,b){
						return d3.descending(a.totalFlow, b.totalFlow);
					})
				//update slider
				slider.max = nodes.length;
				//fliter nodes
				nodes = nodes.slice(0, _threshold);
				//get unique names
				let uniqueNodes = d3.map(nodes, function(d){
					return d.name;
				})
				//create a copy of original data
				var originalData = JSON.parse(JSON.stringify(data))
				//now, for each flow aggregate the remaining ones
				data.forEach(function(d){
					for (header in headers) {
						if (d[headers[header]] != '' && !uniqueNodes.has(d[headers[header]])) {
							d[headers[header]] = 'other ' + headers[header];
						}
					}
				})
				//recalculate nodes
				nodes = getNodes(data, true);

				//get edges
				let edges = []
				//get all edges
				data.map(function(d) {
					var steps = []
					for (header in headers) {
						if (d[headers[header]] != "") {
							steps.push(d[headers[header]] + "-" + header)
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
									value2: Math.min(e.value.v1, e.value.v2),
									id: finalEdges.length
								}
								finalEdges.push(r);
							}
						})
					})

				results = {
					nodes: nodes,
					links: finalEdges
				}

				let sankeyData = sankey(results);
				let sankeyNodes = sankeyData.nodes;
				let sankeyLinks = sankeyData.links;

				let filters = defs.selectAll("filter")
					.data(sankeyLinks)
					.enter()
					.append("filter")
					.attr("filterUnits","userSpaceOnUse")
					.attr("id", (d) => `blur-${d.id}`)
					.attr("x", "-50px")
					.attr("y", "-50px")
					.attr("width", width)
					.attr("height", height)
					.append("feGaussianBlur")
						.attr("stdDeviation", d => (d.width - d.value2 * d.width / d.value) / 6);


				var nodeColor = d3.scaleOrdinal()
					.domain(["Real Ultimate Origin", "Reported Ultimate Origin (conduit 1)", "Immediate origin (conduit 2)", ])
					.range(['#000000', '#666666', '#cccccc']);

				var sourceNodeColor = d3.scaleOrdinal()
					.domain(["Real Ultimate Origin", "Reported Ultimate Origin (conduit 1)", "Destination"])
					.range(['#ff99ff', '#ff66ff', '#cc00cc'])

				//Adjust link Y coordinates based on target/source Y positions
				var node = nodeG.selectAll(".country")
					.data(sankeyData.groups)
					.enter()
					.append("g")
					.classed("country", true)
					.attr("title",function(d){return d.key});

				var nodeSection = node.selectAll('.type')
					.data(function(d){return d.values})
					.enter()
					.append("rect")
					.attr("title",function(d){ return d.name})
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
						if(d.mainType != "Destination"){
							return nodeColor(d.type)
						} else {
							return sourceNodeColor(d.type)
						}
					})

				node.append("text")
					.attr("x", function(d) {
						return (d.x0 + d.x1) / 2;
					})
					.attr("y", function(d) {
						return d.y0 - 5;
					})
					.attr("dy", "0.35em")
					.attr("text-anchor", "middle")
					.text(function(d) {
						return d.key;
					})
					.classed("nodes-names", true);

				// nodes interaction

				node.on("mouseover", function(d) {

						let thisName = d.key;

						d3.selectAll(".link")
							.style("opacity", function(l) {
								return l.source.countryCode == thisName || l.target.countryCode == thisName ? 1 : 0.1;
							})
					})
					.on("mouseout", function() {
						d3.selectAll(".link").style("opacity", 1);
					})

					//drag
				node.call(d3.drag()
					.subject(function(d) {
						return d;
					})
					.on("start", function(d) {
						// console.log(d)
					})
					.on("drag", function(d) {
						var w = d.x1 - d.x0;
						d.x0 = d3.event.x;
						d.x1 = d.x0 + w;

						var h = d.y1 - d.y0;
						d.y0 = d3.event.y;
						d.y1 = d.y0 + h;
						//update the sankey
						sankeyData = sankey.update(sankeyData);

						//TODO: check if this is useful
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
							.attr("d", function(link) {return link.path})
							.attr("filter", null)
					})
					.on("end", d => {
						link.selectAll('path.sankey-underlink')
							.attr("d", function(link) {return link.path})
							.attr("filter", (d) => `url(#blur-${d.id})`)
					}));

				var link = linkG.data(sankeyLinks)
					.enter()
					.append("g")
					.classed("link", true)

				var underLink = link.append("path")
					.attr("class", "sankey-underlink")
					.attr("d", function(link) {return link.path})
					//decide which gradient should be used
					.attr("stroke", d => {
						// check if the link should be colored
						if(d.width > minimumLinkSize) {
							let gradientDirection = d.source.x0 < d.target.x0 ? "front" : "back";
							let gradientType = d.source.type == "Real Ultimate Origin" && d.target.type == "Destination" ? "direct" : "conduit";

							return "url(#gradient-" + gradientType + "-" + gradientDirection + ")"

						} else {
							return "#aaa"
						}
					})
					.style("stroke-width", function(d) {
						return Math.max(1, d.width);
					})
					//apply svg blur
					.attr("filter", function(d){
						if(d.width > minimumLinkSize) {
							return `url(#blur-${d.id})`
						} else {
							return null
						}
					})
					// previous version of link styles
					// .style("opacity", 0.7)
					// .style("stroke", function(link, i) {
					// 	//return link.circular ? "red" : "black"
					// 	return "red"
					// })

				link.append("title")
					.text(function(d) {
						return d.source.name + " → " + d.target.name + "\n Index: " + (d.index);
					});

				var overLink = link.append("path")
					// .attr("class", "link-over")
					.attr("class", "sankey-overlink")
					.attr("d", function(link) {return link.path})
					.attr("stroke", d => {
						// check if the link should be colored
						if(d.width > minimumLinkSize) {
							let gradientDirection = d.source.x0 < d.target.x0 ? "front" : "back";
							let gradientType = d.source.type == "Real Ultimate Origin" && d.target.type == "Destination" ? "direct" : "conduit";

							return "url(#gradient-" + gradientType + "-" + gradientDirection + ")"

						} else {
							return "#aaa"
						}
					})
					.style("stroke-width", function(d) {
						d.width2 = d.value2 * d.width / d.value
						return d.width2;
					})
					.style("opacity", 1)

				function highlightNodes(node, name) {

					let opacity = 0.3

					if (node.countryCode == name) {
						opacity = 1;
					}
					node.sourceLinks.forEach(function(link) {
						if (link.target.countryCode == name) {
							opacity = 1;
						};
					})
					node.targetLinks.forEach(function(link) {
						if (link.source.countryCode == name) {
							opacity = 1;
						};
					})

					return opacity;

				}
				//interactions
				// node.on("click", function(d){
				//
				// 	var _nodeFilter = {
				// 		'filterType': 'node',
				// 		'type': d.name.includes('other') ? d.name.replace('other ','') : null,
				// 		'value': d.name.includes('other') ? null : d.name,
				// 		'exclude': uniqueNodes
				// 	}
				// 	drawEverything(_datasource, 1, _nodeFilter);
				// })

				link.on("click", function(d) {
					console.log(d)
					//define the filter
					var s = {}
					var t = {}
					if(d.source.name.includes('other')) {
						s.type = d.source.name.replace('other ','')
						s.value = null
					} else {
						s.type = null;
						s.value = d.source.name
					}

					if(d.target.name.includes('other')) {
						t.type = d.target.name.replace('other ','')
						t.value = null
					} else {
						t.type = null;
						t.value = d.target.name
					}

					let _filter = {
						'source': s,
						'target': t
					}
					console.log(_filter)
					//filter the dataset
					var _results = [];

					originalData.forEach(function(d){
						//collapse the steps
						var steps = []
						for (header in headers) {
							if (d[headers[header]] != "") {
								steps.push({
									'type': headers[header],
									'value': d[headers[header]]
								})
							}
						}
						// console.log(steps)
						//check if the flow pass throught
						for(var i = 0; i < steps.length-1; i++){
							//check if source is ok
							//if _filter.source.type is null, it' true
							//if not, if it is the same of first step type, check value
							var stest = false
							if(_filter.source.type == null) {
								stest = _filter.source.value == steps[i].value
							} else if (_filter.source.value == null) {
								stest = _filter.source.type == steps[i].type
							} else {
								stest = _filter.source.type == steps[i].type && _filter.source.value == steps[i].value
							}

							var ttest = false
							if(_filter.target.type == null) {
								ttest = _filter.target.value == steps[i+1].value
							} else if (_filter.target.value == null) {
								ttest = _filter.target.type == steps[i+1].type
							} else {
								ttest = _filter.target.type == steps[i+1].type && _filter.target.value == steps[i+1].value
							}
							//if passed, add it
							if(stest && ttest) {
								var result = {
									'steps': steps,
									'index': i,
									'valueMin': Math.min(+d[valueNames.value1],+d[valueNames.value2]),
									'valueMax': Math.max(+d[valueNames.value1],+d[valueNames.value2])
								};
								_results.push(result)
							}
						}
					})
					_results.sort(function(a,b){return b.valueMax - a.valueMax})
					console.log(_results)
				})

			})
	}
});
