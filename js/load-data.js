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
			})
