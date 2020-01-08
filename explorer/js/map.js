let world, countryMetadata, countriesGeo, countriesId, mapDimensions;
let $geoMap = d3.select('#geo-map');
let projection = d3.geoOrthographic();
let geoGenerator = d3.geoPath().projection(projection);
let graticule = d3.geoGraticule();
let p0 = [0, 0];

// this script is inspired by various blocks from Mike Bostock and Peter Cook
Promise.all([d3.json('https://cdn.jsdelivr.net/npm/world-atlas@1/world/50m.json'), d3.tsv('https://cdn.jsdelivr.net/npm/world-atlas@1/world/50m.tsv', ({ iso_n3, iso_a2, name_long }) => [iso_a2, [iso_n3, name_long]])]).then(function (values) {
    world = values[0];
    countryMetadata = values[1];
    setupMap();
}).catch(function (error) {
    console.log(error);
});

function setupMap() {
    // console.log(world);
    const land = topojson.feature(world, world.objects.land);
    const borders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
    countriesGeo = new Map(topojson.feature(world, world.objects.countries).features.map(country => {
        return [country.id, country]
    }));
    const sphere = ({ type: 'Sphere' });
    // console.log(countryMetadata);
    countriesId = new Map(countryMetadata);
    // console.log(countries);
    // console.log(countriesId);
    mapDimensions = document.getElementById('geo-map').getBoundingClientRect();
    const width = mapDimensions.width - 4;
    const height = mapDimensions.height;
    projection.scale(200)
        .translate([width / 2, height / 2])
        .center([0, 0])
        .rotate([0, 0, 0]);

    let svg = $geoMap.append('svg')
        .attr('width', width)
        .attr('height', height);
    let mapLayer = svg.append('g')
        .classed('world-map', true);
    // draw graticule
    svg.append('g')
        .classed('graticule map-feature', true)
        .append('path')
        .datum(graticule())
        .attr('d', geoGenerator);

    // draw world and countries
    mapLayer.append('path')
        .classed('world map-feature', true)
        .datum(land)
        .attr('d', geoGenerator);

    mapLayer.append('path')
        .classed('map-borders map-feature', true)
        .datum(borders)
        .attr('d', geoGenerator);

}

function updateMap(countryData) {
    let id = countriesId.get(countryData.key)[0];
    let name = countriesId.get(countryData.key)[1];
    updateLegend(countryData, name);
    let country = countriesGeo.get(id);
    let p = d3.geoCentroid(country);
    let r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
    let distance = d3.geoDistance(p0, p);
    let area = d3.geoArea(country) * 1000;
    // console.log(country);
    // console.log(area);
    // console.log(p);
    p0 = p;

    d3.selectAll('.map-highlight').remove();
    d3.select('.world-map')
        .append('path')
        .classed('map-highlight map-country map-feature', true)
        .datum(country)
        .attr('d', geoGenerator);
    if (area < 1) {
        let geoCircle = d3.geoCircle()
            .center(p)
            .radius(function () { return Math.max(3, area * 3) })
            .precision(1);
        d3.select('.world-map')
            .append('path')
            .classed('map-highlight map-pointer map-feature', true)
            .datum(geoCircle)
            .attr('d', geoGenerator);
    }

    $geoMap.transition()
        .duration(function () { return 1000 * distance + 500 })
        .tween("rotate", function () {
            let $paths = d3.selectAll(".map-feature");
            return function (t) {
                projection.rotate(r(t));
                $paths.attr("d", geoGenerator);
            }
        });
}

function updateLegend(data, name) {
    // console.log(data);
    let $legend = d3.select('#geo-details');
    let countryData = {
        'code': data.key,
        'name': name
    };
    let radiusScale = d3.scaleSqrt().domain([0, data.value]).range([2, 50]);
    let margins = { 'top': 4, 'bottom': 4, 'left': 6, 'right': 0 };
    let widthSvg = mapDimensions.width - 30 - margins.left - margins.right;
    var nodeColor = d3.scaleOrdinal()
		.domain(["source", "step1", "step2"])
		.range(['#000000', '#666666', '#cccccc']);

	var sourceNodeColor = d3.scaleOrdinal()
		.domain(["source", "step1", "target"])
		.range(['#ff99ff', '#ff66ff', '#cc00cc'])

    let uTitle = $legend.selectAll('.details-title')
        .data([countryData]);

    uTitle.enter()
        .append('h2')
        .classed('details-title', true)
        .merge(uTitle)
        .text(function (d) { return `${d.name} (${d.code})` });

	let detailsTable = d3.select('#geo-kpi');

	// get data for selected country
	var selectedCountry = countries.get(data.key)

	//add the items
	var detailsData = [
		{'type':'first-column', 'text': 'Total Outward FDI Stock in Mill. USD, 2015'},
		{'type':'second-column', 'text': Math.round(selectedCountry['fdi-stock-2015']).toLocaleString() + ' M$'},
		{'type':'first-column', 'text': 'Nominal GDP in Mill. USD, 2015'},
		{'type':'second-column', 'text': selectedCountry['nominal-gdp-2015'].toLocaleString() + ' M$'},
		{'type':'first-column', 'text': 'FDI as % of GDP'},
		{'type':'second-column', 'text': selectedCountry['fdi-gdp-ratio'].toLocaleString()+"%"},
		{'type':'first-column', 'text': 'Secrecy Score, 2018 (TJN FSI)', 'link': selectedCountry['secrecy-score-link']},
		{'type':'second-column', 'text': selectedCountry['secrecy-score'].toLocaleString()},
		{'type':'first-column', 'text': 'Corporate Haven Score, 2019 (TJN CTHI)', 'link': selectedCountry['corporate-haven-link']},
		{'type':'second-column', 'text': selectedCountry['corporate-haven-score'].toLocaleString()},
		{'type':'first-column', 'text': 'Total ultimate investor uncertainty'},
		{'type':'second-column', 'text': (selectedCountry['data-2D']['Total ultimate investor uncertainty'] * 100).toLocaleString()+"%"},
		{'type':'first-column', 'text': 'IMF CDIS data (2015)'},
		{'type':'second-column', 'text': selectedCountry['data-2D']['IMF CDIS data (2015)'].toLocaleString()},
		{'type':'first-column', 'text': 'Median estimate'},
		{'type':'second-column', 'text': selectedCountry['data-2D']['Median estimate'].toLocaleString()}
	]

	console.log(detailsData)
	//populate
	var cells = detailsTable.selectAll('div').data(detailsData, function(d) { return d; });

	//exit
	cells.exit().remove();

	//update
	//nothing to pudate

	//enter
	cells.enter().append("div")
		.attr("class", d => d.type)
		.html(function(d){
			if(d.link && d.text != "NaN") {
				return '<a href='+d.link+">"+d.text+"</a>"
			} else {
				return d.text
			}
		})
		// .text(d => d.text)


	console.log(cells)


    // let uAmounts = $legend.selectAll('.details-amounts')
    //     .data(data.values);

    // uAmounts.exit().remove();

    // let eAmounts = uAmounts.enter()
    //     .append('div')
    //     .classed('details-amounts', true);

    // // enter+update pattern for titles
    // eAmounts.append('h6')
    //     .text(d => `as ${headers[d.type]}:`);

    // uAmounts.select('h6')
    //     .text(d => `as ${headers[d.type]}:`);

    // // enter+update pattern for svgs
    // let eSvg = eAmounts.append('svg')
    //     .attr('width', widthSvg + margins.left + margins.right)
    //     .attr('height', d => radiusScale(d.flow.max) * 2 + margins.top + margins.bottom);

    // eSvg.append('defs')
    //     .append("filter")
    //     .attr("filterUnits", "userSpaceOnUse")
    //     .attr("id", (d, i) => `geo-blur-${i}`)
    //     .attr("x", "-50px")
    //     .attr("y", "-50px")
    //     .attr("width", widthSvg + 100)
    //     .attr("height", d => radiusScale(d.flow.max) * 2 + margins.top + margins.bottom + 100)
    //     .append("feGaussianBlur")
    //     .attr("stdDeviation", d => {
    //         return `${((radiusScale(d.flow.max) - radiusScale(d.flow.min)) / 6)}`
    //     });

    // let eSvgGroup = eSvg.append('g')
    //     .attr('transform', `translate(${margins.left} ${margins.top})`);

    // eSvgGroup.append('line')
    //     .classed('details__line line--max', true)
    //     .attr('x1', d => radiusScale(d.flow.max))
    //     .attr('y1', d => radiusScale(d.flow.max) * 2)
    //     .attr('x2', widthSvg)
    //     .attr('y2', d => radiusScale(d.flow.max) * 2);

    // eSvgGroup.append('line')
    //     .classed('details__line line--min', true)
    //     .attr('x1', d => radiusScale(d.flow.max))
    //     .attr('y1', d => radiusScale(d.flow.max) + radiusScale(d.flow.min))
    //     .attr('x2', widthSvg * 0.7)
    //     .attr('y2', d => radiusScale(d.flow.max) + radiusScale(d.flow.min));

    // eSvgGroup.append('circle')
    //     .classed('details__circle circle--max', true)
    //     .attr('cx', d => radiusScale(d.flow.max))
    //     .attr('cy', d => radiusScale(d.flow.max))
    //     .attr('r', d => radiusScale(d.flow.max))
    //     .attr('filter', (d, i) => `url(#geo-blur-${i})`)
    //     .style('fill', d => d.mainType != "target" ? nodeColor(d.type) : sourceNodeColor(d.type));

    // eSvgGroup.append('circle')
    //     .classed('details__circle circle--min', true)
    //     .attr('cx', d => radiusScale(d.flow.max))
    //     .attr('cy', d => radiusScale(d.flow.max))
    //     .attr('r', d => radiusScale(d.flow.min))
    //     .style('fill', d => d.mainType != "target" ? nodeColor(d.type) : sourceNodeColor(d.type));

    // eSvgGroup.append('text')
    //     .classed('details__amount text--max', true)
    //     .attr('text-anchor', 'end')
    //     .attr('x', widthSvg)
    //     .attr('y', d => radiusScale(d.flow.max) * 2 - 3)
    //     .text(d => `$${d3.format(",.0f")(d.flow.max)} M`);

    // eSvgGroup.append('text')
    //     .classed('details__amount text--min', true)
    //     .attr('text-anchor', 'end')
    //     .attr('x', widthSvg * 0.7)
    //     .attr('y', d => radiusScale(d.flow.max) + radiusScale(d.flow.min) - 3)
    //     .text(d => `$${d3.format(",.0f")(d.flow.min)} M`);

    // uAmounts.select('svg')
    //     .attr('height', d => radiusScale(d.flow.max) * 2 + margins.top + margins.bottom);

    // uAmounts.select('filter')
    //     .attr('height', d => radiusScale(d.flow.max) * 2 + margins.top + margins.bottom + 100);

    // uAmounts.select('feGaussianBlur')
    //     .attr("stdDeviation", d => {
    //         return `${((radiusScale(d.flow.max) - radiusScale(d.flow.min)) / 6)}`
    //     });

    // uAmounts.select('line.line--max')
    //     .attr('x1', d => radiusScale(d.flow.max))
    //     .attr('y1', d => radiusScale(d.flow.max) * 2)
    //     .attr('y2', d => radiusScale(d.flow.max) * 2);

    // uAmounts.select('line.line--min')
    //     .attr('x1', d => radiusScale(d.flow.max))
    //     .attr('y1', d => radiusScale(d.flow.max) + radiusScale(d.flow.min))
    //     .attr('y2', d => radiusScale(d.flow.max) + radiusScale(d.flow.min));

    // uAmounts.select('circle.circle--max')
    //     .attr('cx', d => radiusScale(d.flow.max))
    //     .attr('cy', d => radiusScale(d.flow.max))
    //     .attr('r', d => radiusScale(d.flow.max))
    //     .style('fill', d => d.mainType != "target" ? nodeColor(d.type) : sourceNodeColor(d.type));

    // uAmounts.select('circle.circle--min')
    //     .attr('cx', d => radiusScale(d.flow.max))
    //     .attr('cy', d => radiusScale(d.flow.max))
    //     .attr('r', d => radiusScale(d.flow.min))
    //     .style('fill', d => d.mainType != "target" ? nodeColor(d.type) : sourceNodeColor(d.type));

    // uAmounts.select('text.text--max')
    //     .attr('y', d => radiusScale(d.flow.max) * 2 - 3)
    //     .text(d => `$${d3.format(",.0f")(d.flow.max)} M`);

    // uAmounts.select('text.text--min')
    //     .attr('y', d => radiusScale(d.flow.max) + radiusScale(d.flow.min) - 3)
    //     .text(d => `$${d3.format(",.0f")(d.flow.min)} M`);
}
