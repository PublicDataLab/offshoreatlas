function updateFlows(data) {
    // console.log(data);
    let source = data.source.countryCode;
    let target = data.target.countryCode;
    let nameSource = source.length === 2 ? countriesId.get(source)[1] : source.replace(/\r/, " ");
    let nameTarget = target.length === 2 ? countriesId.get(target)[1] : target.replace(/\r/, " ");
    let minAmount = d3.format(",.0f")(data.value2);
    let maxAmount = d3.format(",.0f")(data.value);
    let yScale = d3.scaleLinear()
        .domain([0, Math.round(data.value)])
        .range([2, Math.round(data.width)])
        .clamp(true);

    d3.select('#flows__source').text(() => source.length === 2 ? `${nameSource} (${source})` : nameSource);
    d3.select('#flows__target').text(() => target.length === 2 ? `${nameTarget} (${target})` : nameTarget);
    d3.select('#flows__number').text(data.flows.length);
    // d3.select('#flows__amount').text(`${minAmount} - ${maxAmount} (M of $)`);

    let nodeWidth = 4;
    let topOffset = 20;
    let margins = { 'top': 0, 'bottom': 10, 'left': 10, 'rigth': 20 };
    let vizWidth = document.querySelector('.flows__details').getBoundingClientRect().width * 0.5 - margins.left - margins.rigth;

    let flowData = d3.select('.flows__details')
        .selectAll('.flow')
        .data(data.flows.sort(function (a, b) {
            return d3.descending(a.maxValue, b.maxValue);
        }));

    flowData.exit().remove();

    let flows = flowData.enter()
        .append('div')
        .classed('flow', true)
        .merge(flowData);

    flows.selectAll('div, p').remove();

    let flowViz = flows.append('div')
        .classed('flow__viz', true)
        .append('svg')
        .attr('width', vizWidth + margins.left + margins.rigth)
        .attr('height', d => yScale(d.maxValue) + topOffset + margins.top + margins.bottom)

    let lineDefs = flowViz.append('defs');

    let lineGradient = lineDefs.append("linearGradient")
        .attr("id", (d, i) => `flow-gradient-${i}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("gradientUnits", "userSpaceOnUse");

    lineGradient.selectAll(".stop")
        .data(d => d.steps.length === 2 ? ["#00adff", "#99ff66"] : ["#c300ff", "#f7931e"])
        .enter().append("stop")
        .attr("offset", function (d, i) { return i / 2; })
        .attr("stop-color", function (d) { return d; });

    lineDefs.append("filter")
        .attr("filterUnits", "userSpaceOnUse")
        .attr("id", (d, i) => `flow-blur-${i}`)
        .attr("x", "-50px")
        .attr("y", "-50px")
        .attr("width", vizWidth + 100)
        .attr("height", d => yScale(d.maxValue) + 100)
        .append("feGaussianBlur")
        .attr("stdDeviation", d => {
            return `${((yScale(d.maxValue) - yScale(d.minValue)) / 6)}`
        });

    let flowVizGroup = flowViz.append('g')
        .attr('transform', `translate(${margins.left} ${margins.top})`);

    flowVizGroup.append('line')
        .classed('flow__line line--blurred', true)
        .attr('x1', 0)
        .attr('y1', d => yScale(d.maxValue) / 2 + topOffset)
        .attr('x2', vizWidth)
        .attr('y2', d => yScale(d.maxValue) / 2 + topOffset)
        .attr('stroke', (d, i) => `url(#flow-gradient-${i})`)
        .attr('stroke-width', d => yScale(d.maxValue))
        .attr('filter', (d, i) => `url(#flow-blur-${i})`);

    flowVizGroup.append('line')
        .classed('flow__line', true)
        .attr('x1', 0)
        .attr('y1', d => yScale(d.maxValue) / 2 + topOffset)
        .attr('x2', vizWidth)
        .attr('y2', d => yScale(d.maxValue) / 2 + topOffset)
        .attr('stroke', (d, i) => `url(#flow-gradient-${i})`)
        .attr('stroke-width', d => yScale(d.minValue));

    flowVizGroup.selectAll('rect')
        .data(d => d.steps.map(x => { return { 'country': x, 'maxValue': d.maxValue } }))
        .enter()
        .append('rect')
        .attr('x', (d, i, a) => vizWidth / (a.length - 1) * i - nodeWidth / 2)
        .attr('y', topOffset)
        .attr('width', nodeWidth)
        .attr('height', d => yScale(d.maxValue));

    flowVizGroup.selectAll('text')
        .data(d => d.steps)
        .enter()
        .append('text')
        .attr('x', (d, i, a) => vizWidth / (a.length - 1) * i - 6)
        .attr('y', topOffset - 4)
        .text(d => d);

    flows.append('p')
        .classed('flow__estimate', true)
        .html(d => `$${d3.format(",.0f")(d.minValue)} M -<br/> $${d3.format(",.0f")(d.maxValue)} M`);

    flows.append('p')
        .classed('flow__uncertainty', true)
        // .text(d => d3.format(".0%")(d.uncertainty));
        .text(d => d.uncertaintyLabel);

}
