var stato = {
	'dataSource': '',
	'threshold': 6,
	'hideSmallFlows': true,
	'minimumFlowsSize': 1000,
	'filters': []
}

// first, initialize the sources menu
function initializeSources() {
	var sources = [{
		name: 'Brazil',
		code: 'BR',
		file: 'dataset-br.tsv'
	},
	{
		name: 'China',
		code: 'CN',
		file: 'dataset-cn.tsv'
	},
	{
		name: 'France',
		code: 'FR',
		file: 'dataset-fr.tsv'
	},
	{
		name: 'Germany',
		code: 'DE',
		file: 'dataset-de.tsv'
	},
	{
		name: 'India',
		code: 'IN',
		file: 'dataset-in.tsv'
	},
	{
		name: 'Italy',
		code: 'IT',
		file: 'dataset-it.tsv'
	},
	{
		name: 'Russia',
		code: 'RU',
		file: 'dataset-ru.tsv'
	},
	{
		name: 'United States',
		code: 'US',
		file: 'dataset-us.tsv'
	},
	{
		name: 'United Kingdom',
		code: 'GB',
		file: 'dataset-gb.tsv'
	}
]
// add interaction
var sourceSelector = d3.select('#source-selector');

sourceSelector.on("click", function() {
	d3.event.stopPropagation();
	sourceSelector.classed("open", !sourceSelector.classed("open"));
	d3.select('#search-dropdown').classed("open", false);
})

// populate the menu with items
var menuItem = sourceSelector.select('#dropdown-content').selectAll('.dropdown-item')
.data(sources).enter()
.append('div')
.attr('class', 'dropdown-item')
.text(d => d.name)
.on('click', function(d) {
	stato.dataSource = d;
	stato.threshold = 6;
	d3.select('#selected-item').text(stato.dataSource.name);
	d3.select('#selected-countryCode').text(stato.dataSource.code);

	document.getElementById('links-amount').value = stato.threshold;
	d3.select('#countries-amount').text(stato.threshold - 1);
	//clear filters
	stato.filters = []
	loadDataset();
})
// load the first one
stato.dataSource = sources[0];
d3.select('#selected-item').text(stato.dataSource.name);
d3.select('#selected-countryCode').text(stato.dataSource.code)
loadDataset()
}

//define a dictionary for headers
var headers = {
	'source': 'Real Ultimate Origin',
	'step1': 'Reported Ultimate Origin (conduit 1)',
	'step2': 'Immediate origin (conduit 2)',
	'target': 'Destination'
}

var headersID = {
	'source': 0,
	'step1': 1,
	'step2': 2,
	'target': 3
}
var valueNames = {
	'value1': 'Estimate 1 (millions USD)',
	'value2': 'Estimate 2 (millions USD)',
}

var aggregatedLabels = {
	'source': 'Aggregated origins',
	'step1': 'Aggregated conduit',
	'step2': 'aggregated secondary conduit'
}

function loadDataset() {
	Promise.all([d3.tsv('data/country-codes.tsv'), d3.tsv('data/' + stato.dataSource.file)]).then(function(datasets) {

		//load country codes, make a collection
		var countries = datasets[0];

		countries = d3.map(countries, function(d) {
			return d['code']
		})

		var flows = datasets[1];

		flows = flows.map(function(d) {
			return {
				'source': d[headers.source],
				'step1': d[headers.step1],
				'step2': d[headers.step2],
				'target': d[headers.target],
				'value1': Math.min(d[valueNames.value1] * 1, d[valueNames.value2] * 1),
				'value2': Math.max(d[valueNames.value1] * 1, d[valueNames.value2] * 1)
			}
		})

		var selectedFlows;
		// If the option is selected, filter by the minimum amount
		if(stato.hideSmallFlows == true) {
			selectedFlows = flows.filter(function(d) {
				return d.value1 > stato.minimumFlowsSize //|| d.value2 > stato.minimumFlowsSize
			});
		} else {
			selectedFlows = flows;
		}

		var nodes = getNodes(selectedFlows);
		// add visual properties to nodes
		// and apply the saved filters TODO: do it better
		nodes.forEach(function(d){
			d.show = true;
			d.selected = false;
			d.fullName = countries.get(d.countryCode)['name']
			// if filters are present, update nodes
			if(stato.filters.length > 0){
				stato.filters.forEach(function(f){
					if(d.countryCode == f){
						d.selected = true;
					}
				})
			} else {
				d.selected = false;
			}

		})
		nodes.sort(function(a,b){return d3.ascending(a.fullName,b.fullName)})

		// Now we have the unique list of nodes and we can update the rest of interface.
		var countrySlider = d3.select('#links-amount')
		.attr('max', nodes.length)
		.attr('value', stato.threshold);

		d3.select('#countries-amount').text(stato.threshold - 1);

		countrySlider.on('input', function() {
			stato.threshold = +this.value;
			d3.select('#countries-amount').text(stato.threshold - 1)
			loadDataset();
		})

		// add interaction to toggle for smaller flows
		var flowsToggle = d3.select('#myonoffswitch')
		.on('change', function(){
			stato.hideSmallFlows = flowsToggle.property('checked');
			loadDataset()
		})

		//clear previously generated items
		d3.select('#search-dropdown').selectAll('.dropdown-item').remove();
		d3.select('#selected-countries').selectAll('.selected-countries').remove();

		//populate the filter list
		var filterSelector = d3.select('#search-dropdown');

		// Populate the list
		var listItems = filterSelector.select('#dropdown-content')
		.selectAll('.dropdown-item')
		.data(nodes.filter(function(d){ return d.countryCode != stato.dataSource.code; }), d => d.countryCode);

		listItems = listItems.enter()
		.append('div')
		.attr('class', 'dropdown-item')
		.classed('selected', d => d.selected)
		.classed('hide', d => !d.show)
		.text(d => countries.get(d.countryCode)['name']);

		//create the list of selected ones
		listSelected = d3.select('#selected-countries')
		.selectAll('.selected-countries')
		.data(nodes, d => d.countryCode);

		listSelected = listSelected.enter()
		.append('div')
		.attr('class','selected-countries')
		.classed('hide', d => !d.selected)
		.text(d => countries.get(d.countryCode)['name']);

		//get the input field
		var searchBox = d3.select('#countries-menu');

		searchBox.on('click', function() {
			//when selected, open the dropdown menu
			d3.event.stopPropagation();
			filterSelector.classed("open", !filterSelector.classed("open"));
			d3.select('#source-selector').classed("open", false);

		})
		// if a text is typed, filter values
		searchBox.on("keyup", function() {

			var searchString = searchBox.node().value

			nodes.forEach(function(d){
				d.show = countries.get(d.countryCode)['name'].toUpperCase().includes(searchString.toUpperCase());
				updateFilters()
			})
		});

		// if a value is clicked, select it
		listItems.on('click', function(d){
			d3.event.stopPropagation();
			d3.select('#countries-geo').classed('open', false);
			d3.select('#countries-flows').classed('open', false);
			d.selected = !d.selected;
			updateFilters();
		})

		listSelected.on('click', function(d){
			d3.event.stopPropagation();
			d3.select('#countries-geo').classed('open', false);
			d3.select('#countries-flows').classed('open', false);
			d.selected = false;
			updateFilters();
		})

		function drawFilters(){
			// listItems.data(nodes);
			listItems.each(function(d){
				d3.select(this).classed('hide', !d.show)
				d3.select(this).classed('selected', d.selected)
			})
			//draw the selected ones
			listSelected.each(function(d){
				d3.select(this).classed('hide', !d.selected)
			})

		}
		function updateFilters(){

			//update menu
			drawFilters()

			stato.filters = nodes.filter(d => d.selected).map(d => d.countryCode)
			var countriesContainer = document.getElementById("selected-countries");
			countriesContainer.scrollTop = countriesContainer.scrollHeight;


			if(stato.filters.length > 0){
				var filtered = applyFilters(selectedFlows)
				// parse the filtered flows
				let parsedData = parseData(filtered, stato.threshold);
				//now, draw everything
				drawEverything(parsedData, stato.threshold, stato.filters);
			} else {
				let parsedData = parseData(selectedFlows, stato.threshold);
				//now, draw everything
				drawEverything(parsedData, stato.threshold, stato.filters);
			}

		}
		updateFilters()

	})
}

function applyFilters(_flows) {

	var f1 = []

	_flows.forEach(function(d){
		// check all the values in 'filter' object
		stato.filters.forEach(function(f){
			// if any of the steps is equal to the value in filters, thank keep the flow.
			let test = d.source == f | d.step1 == f | d.step2 == f | d.target == f;
			// console.log(f+">"+d.source+"|"+d.step1+"|"+d.step2+"|"+d.target+" = "+test)
			if(test == true) {
				f1.push(d)
			}
		})
	})
	return f1
}

function parseData(_originalFlows, _threshold, _filters) {

	// create scale
	var scaleUncertainty = d3.scaleQuantize()
	.domain([0, 1])
	.range(['low', 'medium', 'high']);

	let nodes = getNodes(_originalFlows)
	.sort(function(a, b) {
		return d3.descending(a.totalFlow, b.totalFlow);
	})

	//get the biggest nodes according to the threshold defined by the user
	nodes = nodes.slice(0, _threshold);

	let uniqueNodes = d3.map(nodes, function(d) {
		return d.name;
	})
	// assuming data has been alredy prepared with properties:
	// value1, value2, source, step1, step2, target
	var headers = ['source', 'step1', 'step2', 'target']
	// remap nodes aggregating the smallest ones
	_flows = _originalFlows.map(function(d){
		var r = {};
		r.original = {source:d.source, step1:d.step1, step2:d.step2, target:d.target}
		headers.forEach(function(header) {
			if (d[header] != '' && !uniqueNodes.has(d[header])) {
				r[header] = aggregatedLabels[header]
			} else {
				r[header] = d[header]
			}
		})
		r.value1 = d.value1;
		r.value2 = d.value2;
		return r
	})

	//recalculate nodes using aggregated data
	nodes = getNodes(_flows, true);

	//get edges
	let edges = []
	//get all edges
	_flows.map(function(d) {
		//keep only columns with a country
		var steps = []
		headers.forEach(function(header) {
			if (d[header] != "") {
				steps.push(d[header] + "-" + header)
			}
		});
		//keep also original data
		var originalSteps = []
		headers.forEach(function(header) {
			if (d.original[header] != "") {
				originalSteps.push(d.original[header])
			}
		});
		//Create edges
		for (var i = 1; i < steps.length; i++) {
			let min = Math.min(d.value1, d.value2);
			let max = Math.max(d.value1, d.value2);
			let uncertainty = (max - min)/max;
			let e = {
				source: steps[i - 1],
				target: steps[i],
				value: d.value1,
				value2: d.value2,
				flow: {
					steps: originalSteps,
					minValue: min,
					maxValue: max,
					uncertainty: uncertainty,
					uncertaintyLabel: scaleUncertainty(uncertainty)
				}
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
			'v2': v2,
			'flows': v.map(f => f.flow)
		};
	})
	.entries(edges)
	.map(function(d) {
		d.values.forEach(function(e) {
			if (d.key != e.key) {
				var min = Math.min(e.value.v1, e.value.v2);
				var max = Math.max(e.value.v1, e.value.v2)
				let r = {
					source: d.key,
					target: e.key,
					value: max,
					value2: min,
					uncertainty: (max-min)/max,
					uncertaintyLabel: scaleUncertainty((max-min)/max),
					id: finalEdges.length,
					flows: e.value.flows
				}
				finalEdges.push(r);
			}
		})
	})

	results = {
		nodes: nodes,
		links: finalEdges
	}

	// console.log(results)

	return results
}

// Function to get nodes from the original data structure

function getNodes(_data, keepType) {
	let _nodes = [];
	_data.forEach(function(d) {

		for (header in headers) {
			if (d[header] != '') {
				var n = {
					'name': keepType ? d[header] + "-" + header : d[header],
					'countryCode': d[header],
					'type': header,
					'minValue': Math.min(d.value1, d.value2),
					'maxValue': Math.max(d.value1, d.value2)
				}
				_nodes.push(n);
			}
		}
	})

	_nodes = d3.nest()
	.key(function(d) {
		return d.name
	})
	.key(function(d) {
		return d.type;
	})
	.rollup(function(v) {
		var minValue = d3.sum(v, function(w) {
			return w.minValue
		})
		var maxValue = d3.sum(v, function(w) {
			return w.maxValue
		})

		return {'minValue': minValue, 'maxValue':maxValue}

	}).entries(_nodes)
	.map(function(d) {

		d.countryCode = keepType ? d.key.split("-")[0] : d.key
		d.name = d.key
		delete(d.key)
		d.values.forEach(function(e) {
			d[e.key] = e.value;
		})
		d.values.sort(function(x, y) {
			return d3.descending(x.maxValue, y.maxValue);
		})
		var min = d3.sum(d.values, v => v.value.minValue);
		var max = d3.sum(d.values, v => v.value.maxValue);

		d.flow = {
			'min': min,
			'max': max,
			'uncertainty': (max-min)/max
		}

		d.totalFlow = d.flow.max;
		d.mainType = d.values[0].key;
		d.type = d.values[0].key;
		delete(d.values)
		return d
	})

	//if keeptype is enabled, the maintype must be recalculated

	if (keepType) {
		var _uniqueNodes = d3.nest()
		.key(function(d) {
			return d.countryCode
		})
		.rollup(function(v) {
			// return the type for the maximum node
			return max = v.sort(function(x, y) {
				return d3.descending(x.totalFlow, y.totalFlow);
			})[0].mainType
		}).entries(_nodes)
		_uniqueNodes = d3.map(_uniqueNodes, function(d) {
			return d.key
		})
		//reassociate main type
		_nodes.forEach(function(d) {
			d.mainType = _uniqueNodes.get(d.countryCode).value;
			d.typeId = headersID[d.mainType]
		})
	}
	return _nodes;
}

let guide = d3.select(".interaction-button");

guide.on('click', function(d){
	toggleGuide();
	d3.select(this).classed("active", d3.select(this).classed("active") ? false : true)
})

function toggleGuide() {
	d3.select('#interaction-guide').classed("visible", d3.select('#interaction-guide').classed("visible") ? false : true);
}
