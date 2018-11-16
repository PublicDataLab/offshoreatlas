// get container

//
d3.tsv("./assets/data/China-Offshore-FDI-simplified.tsv").then(function(data) {
	//console.log(data);
	var container = d3.select("#container")

	data.sort(function(a, b) {
		return d3.descending(a['Extimate 01']*1 + a['Extimate 02']*1, b['Extimate 01']*1 +b['Extimate 02']*1)
	});
	console.log(data);

	var divs = container.selectAll('div')
		.data(data).enter()
		.append('div')
		.attr('class', 'card')

	divs.append('div')
		.attr('class', 'source name')
		.text(function(d) {
			return d.Source;
		})

	//define scale
	var extensions = d3.extent(data, function(d) {
		return +d['Extimate 01']
	}).concat(d3.extent(data, function(d) {
		return +d['Extimate 02']
	}));
	var ext = d3.extent(extensions);
	var scale = d3.scaleLinear()
		.domain([0, ext[1]]) // input
		.range([0, 1]); // output

	function createArrow(_value, w, h) {
		console.log(_value)
		// var w = 100;
		// var h = 50;
		var x1 = 1;
		var x2 = w - h / 2 * _value;
		var x3 = w;

		var y1 = -0.1 + h / 2 - h / 2 * _value;
		var y2 = h / 2;
		var y3 = 0.1 + 1 + h / 2 + h / 2 * _value;

		var lineFunction = d3.line()
			//.curve(d3.curveLinearClosed())
			.x(function(d) {
				return d.x;
			})
			.y(function(d) {
				return d.y;
			});

		var lineData = [{
				"x": x1,
				"y": y1
			},
			{
				"x": x2,
				"y": y1
			},
			{
				"x": x3,
				"y": y2
			},
			{
				"x": x2,
				"y": y3
			},
			{
				"x": x1,
				"y": y3
			}
		];
		return lineFunction(lineData);
	}

	var svg1 = divs.append('div')
		.attr('class', 'arrows')
		.append('svg')
		.attr("width", 50)
		.attr("height", 50)

	svg1.append("path") //append first path
		.attr("d", function(d) {
			var value = scale(+d["Extimate 02"]);
			return createArrow(value, 50, 50);
		})
		.style("stroke-width", 0)
		.style("fill", "blue")
		.style("fill-opacity", 0.5);

	svg1.append("path") //append second path
		.attr("d", function(d) {
			var value = scale(+d["Extimate 01"]);
			return createArrow(value, 50, 50);
		})
		.style("stroke-width", 0)
		.style("fill", "red")
		.style("fill-opacity", 0.5);

	divs.append('div')
		.attr('class', 'inter1 name')
		.text(function(d) {
			return d['Inter 1'];
		})

	var svg2 = divs.append('div')
		.attr('class', 'arrows')
		.append('svg')
		.attr("width", 50)
		.attr("height", 50)

	svg2.append("path") //append first path
		.attr("d", function(d) {
			var value = scale(d["Extimate 02"]);
			return createArrow(value, 50, 50);
		})
		.style("stroke-width", 0)
		.style("fill", "blue")
		.style("fill-opacity", 0.5);

	svg2.append("path") //append second path
		.attr("d", function(d) {
			var value = scale(d["Extimate 01"]);
			return createArrow(value, 50, 50);
		})
		.style("stroke-width", 0)
		.style("fill", "red")
		.style("fill-opacity", 0.5);

	divs.append('div')
		.attr('class', 'target name')
		.text(function(d) {
			return d.Target;
		})
})
