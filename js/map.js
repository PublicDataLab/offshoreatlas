let world, countryMetadata, countriesGeo, countriesId;
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
    const mapDimensions = document.getElementById('geo-map').getBoundingClientRect();
    const width = mapDimensions.width;
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
            .radius(function() { return Math.max(3, area * 3) })
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
    console.log(data);
    
    let $legend = d3.select('#geo-details');
    let countryData = {
        'code': data.key,
        'name': name
    }

    let uTitle = $legend.selectAll('.details-title')
        .data([countryData]);
    
    uTitle.enter()
        .append('h2')
        .classed('details-title', true)
        .merge(uTitle)
        .text(function(d) {return `${d.name} (${d.code})`});
    
}