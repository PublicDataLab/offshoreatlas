var margin = {
	top: 100,
	right: 100,
	bottom: 20,
	left: 100
};

//variables will be updated when the page is loaded
var width, height;

//minimum size, in pixels, for links with gradient.
var minimumLinkSize = 2;

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

document.addEventListener("DOMContentLoaded", function() {

	// populate the sources menu
	initializeSources()

	//update size according to viewport
	width = d3.select("#chart").node().getBoundingClientRect().width;
	height = d3.select("#chart").node().getBoundingClientRect().height;
})

//run the Sankey + circular over the data
function drawEverything(_data, _threshold, _filter) {

	//clear
	d3.select("#chart").html("");

	var svg = d3.select("#chart").append("svg")
		.attr("id", "viz")
		.attr("width", width)
		.attr("height", height);

	var defs = svg.append("defs");

	// create the two gradients, one that goes forward, the other that is backward
	createAnimatedGradient(defs, "gradient-conduit-front", ["#c300ff", "#f7931e", "#f7931e", "#c300ff"], true);
	createAnimatedGradient(defs, "gradient-conduit-back", ["#c300ff", "#f7931e", "#f7931e", "#c300ff"], false);
	createAnimatedGradient(defs, "gradient-direct-front", ["#00adff", "#99ff66", "#99ff66", "#00adff"], true);
	createAnimatedGradient(defs, "gradient-direct-back", ["#00adff", "#99ff66", "#99ff66", "#00adff"], false);

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


	let sankeyData = sankey(_data);
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
		.attr("width", width + 100)
		.attr("height", height + 100)
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
		.attr("title",function(d){return d.key})
		.style("cursor", d => d.key.length === 2 ? "pointer" : "default");

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
			if(d.mainType != "target"){
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
			let event = d3.event;
			
			let countryName = countriesId.get(d.key)[1];
			let tooltip = d3.select('#chart')
				.append('div')
				.classed('chart-tooltip', true)
				.style('left', event.pageX + 10 + 'px')
				.style('top', event.pageY + 'px');
			
			tooltip.append('p')
				.classed('tooltip-name', true)
				.text(countryName);
			
			tooltip.selectAll('.tooltip-list')
				.data(d.values)
				.enter()
				.append('p')
				.classed('tooltip-list', true)
				.text(function(v) {return `as ${v.type.replace(/step/,'conduit ')}: $ ${d3.format(",.0f")(v[v.type])} M`});

			let thisName = d.key;

			d3.selectAll(".link")
				.style("opacity", function(l) {
					return l.source.countryCode == thisName || l.target.countryCode == thisName ? 1 : 0.1;
				})
		})
		.on("mouseout", function() {
			d3.selectAll(".link").style("opacity", 1);
			d3.select('.chart-tooltip').remove();
		})
		.on("click", function(d) {
			if (d.key.length === 2) {
				d3.select('#countries-geo')
					.classed('open', true);

				updateMap(d);
			}
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
				let gradientType = d.source.type == "source" && d.target.type == "target" ? "direct" : "conduit";

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
				let gradientType = d.source.type == "source" && d.target.type == "target" ? "direct" : "conduit";

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
}

//pass a unique id and an array of colors
function createAnimatedGradient(_defs, _id, _colors, _toRight) {

	let _gradient = _defs.append("linearGradient")
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
		.attr("values", _toRight ? "0%;100%" : "0%; -100%")
		.attr("dur","3s")
		.attr("repeatCount","indefinite");

	_gradient.append("animate")
		.attr("attributeName","x2")
		.attr("values", _toRight ? "100%;200%" : "100%;0%")
		.attr("dur","3s")
		.attr("repeatCount","indefinite");

	return _gradient;
}
