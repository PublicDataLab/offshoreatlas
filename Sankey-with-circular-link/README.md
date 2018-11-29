A version of the [Sankey chart with circular links](https://github.com/tomshanley/d3-sankey-circular), with a stroke-dasharray animated to show direction.

Compare this [version which uses arrows](https://bl.ocks.org/tomshanley/87c05949f0b1994bfa71eccbf1f30d09).

The relevant piece of code:

  
```
    arrowsG.selectAll("path")
      .style("stroke-width", "10")
      .style("stroke-dasharray", "10,10")

    let duration = 5
    let maxOffset = 10;
    let percentageOffset = 1;

    var animateDash = setInterval(updateDash, duration);

    function updateDash() {

      arrowsG.selectAll("path")
      .style("stroke-dashoffset", percentageOffset * maxOffset)

      percentageOffset = percentageOffset == 0 ? 1 : percentageOffset - 0.01

    }
    ```