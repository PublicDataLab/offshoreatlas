// function initializeNodeSize(id) {
// //override py if nodePadding has been set
// if (paddingRatio) {
// 	//TODO: understand what should be done
// }
//
// // find maximum padding, according to nodes
// var maxPadding = d3Array.max(columnSize, function(d){
// 	console.log(d)
// 	return (d.totNodes - d.totGroups)*nodePadding + (d.totGroups-1)*groupPadding;
// })
// // find the column with the highest value
// var maxValue = d3Array.max(columnSize, function(d){
// 	return d.totValue;
// })
// // calculate padding for circular links
// var totalLinkPadding = d3Array.max(graph.links, function(d){
// 	return d.circular ? circularLinkGap : 0
// }) - circularLinkGap;
// // calculate total size for circular links
// var totalLinkValue = d3Array.max(graph.links, function(d){
// 	return d.circular ? d.value : 0
// })
//
// //define a scale covering the vertical space without padding
// d3.scaleLinear()
// 	.domain([0, maxValue + totalLinkValue])
// 	.range([0, y1 - y0 - maxPadding - totalLinkPadding])
//
// console.log([y1 - y0, maxPadding, totalLinkPadding])
