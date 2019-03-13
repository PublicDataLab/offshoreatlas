var stato = {
	'dataSource': '',
	'threshold': 1,
	'hideSmallFlows': true,
	'minimumFlowsSize': 1000,
	'filters': ''
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
			name: 'United Kingdom',
			code: 'UK',
			file: 'dataset-uk.tsv'
		}
	]
	// add interaction
	var sourceSelector = d3.select('#source-selector');

	sourceSelector.on("click", function() {
		sourceSelector.classed("open", !sourceSelector.classed("open"));
	})

	// populate the menu with items
	var menuItem = sourceSelector.select('#dropdown-content').selectAll('.dropdown-item')
		.data(sources).enter()
		.append('div')
		.attr('class', 'dropdown-item')
		.text(d => d.name)
		.on('click', function(d) {
			stato.dataSource = d;
			stato.threshold = 1;
			d3.select('#selected-item').text(stato.dataSource.name);
			d3.select('#selected-countryCode').text(stato.dataSource.code)
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
	'source': 'Aggregated\rorigins',
	'step1': 'Aggregated\rCONDUIT',
	'step2': 'Aggregated\rCONDUIT 2'
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
				'value1': d[valueNames.value1] * 1,
				'value2': d[valueNames.value2] * 1
			}
		})

		var selectedFlows;
		// If the option is selected, filter by the minimum amount
		if(stato.hideSmallFlows == true) {
			selectedFlows = flows.filter(function(d) {
				return d.value1 > stato.minimumFlowsSize || d.value2 > stato.minimumFlowsSize
			});
		} else {
			selectedFlows = flows;
		}

		var nodes = getNodes(selectedFlows);

		// Now we have the unique list of nodes and we can update the rest of interface.
		var countrySlider = d3.select('#links-amount')
			.attr('max', nodes.length)
			.attr('value', stato.threshold);

		countrySlider.on('input', function() {
			stato.threshold = +this.value;
			d3.select('#countries-amount').text(stato.threshold)
			loadDataset();
		})

		// add interaction to toggle for smaller flows
		var flowsToggle = d3.select('#myonoffswitch')
			.on('change', function(d){
				stato.hideSmallFlows = flowsToggle.property('checked');
				loadDataset()
			})

		//populate the filter list
		var filterSelector = d3.select('#search-dropdown');

		// Populate the list
		var listItems = filterSelector.select('#dropdown-content')
			.selectAll('.dropdown-item')
			.data(nodes, d => d.countryCode);

		listItems = listItems.enter()
			.append('div')
			.attr('class', 'dropdown-item')
			.text(d => countries.get(d.countryCode)['name']);

		//create the list of selected ones
		listSelected = d3.select('#selected-countries')
			.selectAll('.selected-countries')
			.data(nodes, d => d.countryCode);

		listSelected = listSelected.enter()
			.append('div')
			.attr('class','selected-countries')
			.classed('hide', true)
			.text(d => countries.get(d.countryCode)['name']);

		//get the input field
		var searchBox = d3.select('#countries-menu');

		searchBox.on('click', function() {
			//when selected, open the dropdown menu
			filterSelector.classed("open", !filterSelector.classed("open"));

		})
		// add visual properties to nodes
		nodes.forEach(function(d){
			d.show = true;
			d.selected = false;
		})
		// if a text is typed, filter values
		searchBox.on("keyup", function() {

			var searchString = searchBox.node().value

			// console.log(listItems)
			//
			nodes.forEach(function(d){
				d.show = countries.get(d.countryCode)['name'].toUpperCase().includes(searchString.toUpperCase());
				// d3.select(this).classed('hide', !d.show)
				updateFilters()
			})

		});

		// if a value is clicked, select it
		listItems.on('click', function(d){
			d.selected = !d.selected;
			updateFilters();
		})

		listSelected.on('click', function(d){
			d.selected = false;
			updateFilters();
		})

		function updateFilters(){
			listItems.data(nodes);
			listItems.each(function(d){
				d3.select(this).classed('hide', !d.show)
				d3.select(this).classed('selected', d.selected)
			})
			//draw the selected ones
			listSelected.each(function(d){
				console.log(d)
				d3.select(this).classed('hide', !d.selected)
			})
		}

		// now parse the data and create a network
		let parsedData = parseData(selectedFlows, stato.threshold);
		//now, draw everything
		drawEverything(parsedData, stato.threshold, stato.filters);
	})
}

function parseData(_flows, _threshold) {
	let nodes = getNodes(_flows)
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
	_flows.forEach(function(d) {
		headers.forEach(function(header) {
			if (d[header] != '' && !uniqueNodes.has(d[header])) {
				d[header] = aggregatedLabels[header]
			}
		})
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
		//Create edges
		for (var i = 1; i < steps.length; i++) {
			let e = {
				source: steps[i - 1],
				target: steps[i],
				value: d.value1,
				value2: d.value2
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
					'value': Math.max(d.value1, d.value2)
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
			return d3.sum(v, function(w) {
				return w.value
			})

		}).entries(_nodes)
		.map(function(d) {
			d.countryCode = keepType ? d.key.split("-")[0] : d.key
			d.name = d.key
			delete(d.key)
			d.values.forEach(function(e) {
				d[e.key] = e.value;
			})
			d.values.sort(function(x, y) {
				return d3.descending(x.value, y.value);
			})
			d.totalFlow = d.values.reduce((total, item) => total + item.value, 0);
			d.mainType = d.values[0].key
			d.type = d.values[0].key
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
