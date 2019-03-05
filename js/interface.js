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
			d3.select('#selected-item').text(d.name);
			d3.select('#selected-countryCode').text(d.code)
			loadDataset(d.file, 0, 0, {});
		})
}

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

function loadDataset(_datasource, _threshold, _minimumAmount, _filter) {
	Promise.all([d3.tsv('data/country-codes.tsv'), d3.tsv('data/' + _datasource)]).then(function(datasets) {

		//load country codes, make a collection
		var countries = datasets[0];
		console.log(countries)
		countries = d3.map(countries, function(d){ return d['code']})
		console.log(countries)

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

		// filter by the minimum amount
		var selectedFlows = flows.filter(function(d) {
			return d.value1 > _minimumAmount || d.value2 > _minimumAmount
		});
		var nodes = getNodes(selectedFlows);

		// Now we have the unique list of nodes and we can update the rest of interface.
		var countrySlider = d3.select('#links-amount')
			.attr('max', nodes.length)
			.attr('value', 1);

		//populate the filter list
		var filterSelector = d3.select('#search-dropdown');


		// Populate the list
		var listItems = filterSelector.select('#dropdown-content')
			.selectAll('.dropdown-item')


		listItems.data(nodes).enter()
			.append('div')
			.attr('class', 'dropdown-item')
			.text(d => countries.get(d.countryCode)['name']);

		//get the input field
		var searchBox = d3.select('#countries-menu');

		searchBox.on('click', function(){
				//when selected, open the dropdown menu
				filterSelector.classed("open", !filterSelector.classed("open"));

			})
		searchBox.on("keyup",function(){

			var searchString = searchBox.node().value

			// update patter: exit
			listItems.exit().remove();

			var filterNodes = nodes.filter(n => countries.get(n.countryCode)['name'].toUpperCase().includes(searchString.toUpperCase()))

			listItems.data(filterNodes).enter()
				.append('div')
				.attr('class', 'dropdown-item')
				.text(d => countries.get(d.countryCode)['name']);
		});
	})
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

function updateInterface() {

}
