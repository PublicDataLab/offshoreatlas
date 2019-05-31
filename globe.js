(function () {
    let context, world, land, borders, countryMetadata, countriesGeo, countriesId, mapDimensions, canvasWidth,canvasHeight, margins;
    let $geoMap = d3.select('.globe__map');
    let projection = d3.geoOrthographic();
    let geoGenerator = d3.geoPath().projection(projection);
    let graticule = d3.geoGraticule();
    let p0 = [0, 0];

    let timeout;
    const colors = {
        'dark': '#000000',
        'light': '#ffffff',
        'graticule': 'rgba(182,182,182,0.6)',
        'main': '#c300ff',
        'mainLight': '#f7acf9',
        'secondaryLight': '#feffe7'
    }

    // this script is inspired by various blocks from Mike Bostock and Peter Cook
    Promise.all([d3.json('https://cdn.jsdelivr.net/npm/world-atlas@1/world/50m.json'), d3.tsv('https://cdn.jsdelivr.net/npm/world-atlas@1/world/50m.tsv', ({ iso_n3, iso_a2, name_long }) => [iso_a2, [iso_n3, name_long]])]).then(function (values) {
        world = values[0];
        countryMetadata = values[1];
        setupMap();
        drawMap([{ 'key': 'IT' }, { 'key': 'IS' }, { 'key': 'AL' }, { 'key': 'AD' }, { 'key': 'AT' }, { 'key': 'BE' }, { 'key': 'BG' }, { 'key': 'BA' }, { 'key': 'BY' }, { 'key': 'CH' }, { 'key': 'CZ' }, { 'key': 'DE' }, { 'key': 'DK' }, { 'key': 'ES' }, { 'key': 'EE' }, { 'key': 'FI' }, { 'key': 'FR' }, { 'key': 'FO' }, { 'key': 'GB' }, { 'key': 'GG' }, { 'key': 'GR' }, { 'key': 'HR' }, { 'key': 'HU' }, { 'key': 'IM' }, { 'key': 'IE' }, { 'key': 'AX' }, { 'key': 'JE' }, { 'key': 'LI' }, { 'key': 'LT' }, { 'key': 'LU' }, { 'key': 'LV' }, { 'key': 'MC' }, { 'key': 'MD' }, { 'key': 'MK' }, { 'key': 'MT' }, { 'key': 'ME' }, { 'key': 'NL' }, { 'key': 'NO' }, { 'key': 'PL' }, { 'key': 'PT' }, { 'key': 'RO' }, { 'key': 'RU' }, { 'key': 'SM' }, { 'key': 'RS' }, { 'key': 'SK' }, { 'key': 'SI' }, { 'key': 'SE' }, { 'key': 'UA' }, { 'key': 'VA' }]);

        let globeObserver = enterView({
            selector: '.globe__marker',
            enter: function (el) {
                animateGlobe(el.id.replace('globe', 'step'), true);
            },
            exit: function (el) {
                animateGlobe(el.id.replace('globe', 'step'), false);
            },
            progress: function(el, progress) {
                let id = el.id.replace(/.*(\d)$/, '$1');
                let $trace = document.querySelector(`.globe__trace .trace__container:nth-child(${id}) .trace`);
                $trace.style.transform = `scaleX(${progress})`;
            },
            offset: 0
        });
    }).catch(function (error) {
        console.log(error);
    });

    function setupMap() {
        // setup canvas and world projections
        land = topojson.feature(world, world.objects.land);
        borders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
        countriesGeo = new Map(topojson.feature(world, world.objects.countries).features.map(country => {
            return [country.id, country]
        }));
        countriesId = new Map(countryMetadata);
        mapDimensions = document.querySelector('.globe__map').getBoundingClientRect();
        canvasWidth = Math.round(mapDimensions.width);
        canvasHeight = Math.round(mapDimensions.height);
        const shorterSide = Math.min(canvasWidth, canvasHeight * 0.8);
        margins = { 'top': shorterSide * 0.25, 'left': shorterSide * 0.15 };
        const scale = 2;

        let canvas = $geoMap.append('canvas')
            .style('width', canvasWidth + 'px')
            .style('height', canvasHeight + 'px');

        canvas.node().width = canvasWidth * scale;
        canvas.node().height = canvasHeight * scale;
        context = canvas.node().getContext('2d');
        context.scale(scale, scale);
        context.translate(margins.left, margins.top);
        projection.scale(shorterSide / 1.85)
            .translate([shorterSide / 1.8, shorterSide / 2.2])
            .center([0, 0])
            .rotate([-15, -35, 0]);
        geoGenerator.context(context);
    }

    function drawMap(countryData) {
        let countriesArray = [];
        countryData.forEach(function (c) {
            let id = countriesId.get(c.key)[0];
            let country = countriesGeo.get(id);
            countriesArray.push(country);
        })
        let p = d3.geoCentroid(countriesArray[0]);
        let r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
        let distance = d3.geoDistance(p0, p);
        let area = d3.geoArea(countriesArray[0]) * 1000;
        p0 = p;

        d3.transition()
            .duration(function () { return 750 * distance + 500 })
            .tween("rotate", function () {
                return function (t) {
                    projection.rotate(r(t));

                    context.clearRect(-margins.left, -margins.top, canvasWidth, canvasHeight);
                    // draw world and countries
                    context.beginPath();
                    geoGenerator(land);
                    context.fillStyle = colors.secondaryLight;
                    context.strokeStyle = colors.mainLight;
                    context.fill();
                    context.stroke();

                    context.beginPath();
                    geoGenerator(borders);
                    context.strokeStyle = colors.mainLight;
                    context.stroke();

                    // draw nations highlighted
                    countriesArray.forEach(function (country) {
                        context.beginPath();
                        geoGenerator(country);
                        context.fillStyle = 'rgba(247, 172, 249, 0.8)';
                        context.strokeStyle = colors.main;
                        context.fill();
                        context.stroke();
                    });

                    if (area < 1) {
                        let geoCircle = d3.geoCircle()
                            .center(p)
                            .radius(function () { return Math.max(3, area * 3) })
                            .precision(1);

                        context.beginPath();
                        geoGenerator(geoCircle());
                        context.fillStyle = 'rgba(204, 0, 204, 0.1)';
                        context.strokeStyle = colors.main;
                        context.lineWidth = 2;
                        context.fill();
                        context.stroke();
                    }

                    // draw graticule
                    context.beginPath();
                    geoGenerator(graticule());
                    context.lineWidth = 0.5;
                    context.strokeStyle = colors.graticule;
                    context.stroke();
                }
            });
    }

    function animateGlobe(step, isEntering) {
        // console.log(isEntering ? 'entered ' : 'exited ', step);
        document.querySelector('em.highlighted').classList.remove('highlighted');

        switch (step) {
            case 'step1':
                if (isEntering) {
                    document.querySelectorAll('.links path').forEach(function (el) { el.classList.remove('blurred') });
                    drawMap([{ 'key': 'NL' }]);
                    document.querySelector('.globe__text p.step1 em:first-child').classList.add('highlighted');
                    document.querySelector('.globe__text p.step1').classList.add('shown');
                } else {
                    drawMap([{ 'key': 'IT' }, { 'key': 'IS' }, { 'key': 'AL' }, { 'key': 'AD' }, { 'key': 'AT' }, { 'key': 'BE' }, { 'key': 'BG' }, { 'key': 'BA' }, { 'key': 'BY' }, { 'key': 'CH' }, { 'key': 'CZ' }, { 'key': 'DE' }, { 'key': 'DK' }, { 'key': 'ES' }, { 'key': 'EE' }, { 'key': 'FI' }, { 'key': 'FR' }, { 'key': 'FO' }, { 'key': 'GB' }, { 'key': 'GG' }, { 'key': 'GR' }, { 'key': 'HR' }, { 'key': 'HU' }, { 'key': 'IM' }, { 'key': 'IE' }, { 'key': 'AX' }, { 'key': 'JE' }, { 'key': 'LI' }, { 'key': 'LT' }, { 'key': 'LU' }, { 'key': 'LV' }, { 'key': 'MC' }, { 'key': 'MD' }, { 'key': 'MK' }, { 'key': 'MT' }, { 'key': 'ME' }, { 'key': 'NL' }, { 'key': 'NO' }, { 'key': 'PL' }, { 'key': 'PT' }, { 'key': 'RO' }, { 'key': 'RU' }, { 'key': 'SM' }, { 'key': 'RS' }, { 'key': 'SK' }, { 'key': 'SI' }, { 'key': 'SE' }, { 'key': 'UA' }, { 'key': 'VA' }]);
                    document.querySelector('.globe__text p.step1').classList.remove('shown');
                    document.querySelector('.globe__text.step1 p:first-child em').classList.add('highlighted');
                    window.clearTimeout(timeout);
                    timeout = window.setTimeout(function () {
                        document.querySelectorAll('.links path').forEach(function (el) { el.classList.add('blurred') });
                    }, 300);
                }
                break;

            case 'step2':
                if (isEntering) {
                    drawMap([{ 'key': 'LU' }]);
                    document.querySelector('.globe__text span.step2 em').classList.add('highlighted');
                    document.querySelector('.globe__text span.step2').classList.add('shown');
                } else {
                    drawMap([{ 'key': 'NL' }]);
                    document.querySelector('.globe__text p.step1 em:first-child').classList.add('highlighted');
                    document.querySelector('.globe__text span.step2').classList.remove('shown');
                }
                break;

            case 'step3':
                if (isEntering) {
                    drawMap([{ 'key': 'KY' }]);
                    document.querySelector('.globe__text em.step3').classList.add('highlighted');
                    document.querySelector('.globe__text.step1').classList.remove('shown');
                    document.querySelector('.globe__text.step3').classList.add('shown');
                } else {
                    drawMap([{ 'key': 'LU' }]);
                    document.querySelector('.globe__text span.step2 em').classList.add('highlighted');
                    document.querySelector('.globe__text.step3').classList.remove('shown');
                    document.querySelector('.globe__text.step1').classList.add('shown');
                }
                break;

            case 'step4':
                if (isEntering) {
                    drawMap([{ 'key': 'VG' }]);
                    document.querySelector('.globe__text span.step4 em').classList.add('highlighted');
                    document.querySelector('.globe__text span.step4').classList.add('shown');
                } else {
                    drawMap([{ 'key': 'KY' }]);
                    document.querySelector('.globe__text em.step3').classList.add('highlighted');
                    document.querySelector('.globe__text span.step4').classList.remove('shown');
                }
                break;

            case 'step5':
                if (isEntering) {
                    drawMap([{ 'key': 'BM' }]);
                    document.querySelector('.globe__text span.step5 em').classList.add('highlighted');
                    document.querySelector('.globe__text span.step5').classList.add('shown');
                } else {
                    drawMap([{ 'key': 'VG' }]);
                    document.querySelector('.globe__text span.step4 em').classList.add('highlighted');
                    document.querySelector('.globe__text span.step5').classList.remove('shown');
                }
                break;

            default:
                break;
        }
    }

})();