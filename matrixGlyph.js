function unpack(packedIndex, rows, cols) {
    return [Math.floor(packedIndex / cols), (packedIndex % cols)];
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive.
}

function legend(x, y, svgContainer, colorScale, scaleType, legendTitle, legendID, minVal, maxVal, payload) {

    //Append title legend
    svgContainer.append("text")
        .attr("class", "title")
        .attr("x", x)
        .attr("y", y)
        .text(legendTitle);

    var group = svgContainer.append('g').attr("transform", "translate(" + x + "," + y + ")").attr("class", "legendQuant");

    //Define orientation color scale
    var colorLegend = d3.legendColor()
        .labelFormat(d3.format(".0%"))
        .useClass(true)
        .scale(colorScale);

    //Set orientation color scale
    colorLegend.ascending(true);
    group
        .call(colorLegend);
    return;
}


function arrayDotGlyph(distribution, numRows, numColumns, svgContainer, color, id, width, height, posX, posY, states, uf, distMode = 'quantile') {
    
    //
    let numSamples = numRows * numColumns;
    // debugger
    // Grupo que contem as bolinhas
    let container = svgContainer.append("g");
    container.attr("id", id)
    container.attr("class", "glyph")
    container.attr("width", 80)
    container.attr("height", 80)
    

    //Captura o centro do quadrado
    let centerX = posX + width / 2.0;
    let centerY = posY + height / 2.0;

    // Espaçamento entre a matriz e o box (Borda)
    let slackness = 35;
    let adjustedCanvasWidth = width - 2 * slackness;
    let adjustedCanvasHeight = height - 2 * slackness;

    let canvasAdjustedX = posX;
    let canvasAdjustedY = posY;

    //Calculando W e H de cada bolinha
    let sampleWidth = adjustedCanvasWidth / numColumns;
    let sampleHeight = adjustedCanvasHeight / numRows ;

    let values = [];

    if (distMode == 'random') {
        for (let i = 0; i < numSamples; ++i) {
            let index = getRandomInt(0, distribution.length);
            values.push(distribution[index]);
        }
    }
    else if (distMode == 'quantile') {
        for (let i = 0; i < numSamples; ++i) {
            values.push(math.quantileSeq(distribution, (1.0 * i) / (numSamples - 1), true));
        }
    }

    values.sort((a, b) => (b - a));

    //Borda do canvas do Glyph
    let borderCanvas = container.append('rect')
        .data([container])
        .attr("class", "canvas shadow")
        .attr("id", "rect-"+uf)
        .attr("x", canvasAdjustedX - 1)
        .attr("y", canvasAdjustedY - 1)
        .attr("rx", "3")
        .attr("ry", "3")
        .attr("width", adjustedCanvasWidth + 3)
        .attr("height", adjustedCanvasHeight + 2)
        .attr("fill", "white")

    //Construção da matriz de bolinhas
    container.selectAll(".sample")
        .data(d3.zip(d3.range(numRows * numColumns), values)) // Range > Criar a lista
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            let coords = unpack(d[0], numRows, numColumns); //Informa em qual linha e columa a bolinha está.
            return canvasAdjustedX + coords[1] * sampleWidth + sampleHeight / 2;
        })
        .attr("cy", function (d) {
            let coords = unpack(d[0], numRows, numColumns);
            return canvasAdjustedY + sampleHeight / 2 + coords[0] * sampleHeight;
        })
        .attr("r", sampleWidth / 2)
        .attr("fill", (d, i) => color(d[1]))
        .attr("stroke", "white")
        .style("stroke-width", .5) 

    let stateLabel = container.append('text')
        .data([container])
        .attr("class", "state-label")
        .attr("id", "state-label"+uf)
        .attr("font-family", "Roboto Condensed")
        .attr("x", canvasAdjustedX)
        .attr("y", canvasAdjustedY)
        .text(states)

    //DEBUG
        // console.group("Glyph & Centroid positions")
        console.log("RECT > ", svgContainer.select("#rect-" + uf).attr("x"), svgContainer.select("#rect-" + uf).attr("y"), uf);
        console.log("CIRC > ", svgContainer.select("#circ-" + uf).attr("cx"), svgContainer.select("#circ-" + uf).attr("cy"), uf); 
    //END DEBUG
    linkingStates(svgContainer, uf, container, states);

}

//Linking States (Path)
function linkingStates(svgContainer, uf, container, states){

    const nodes = [];
    nodes.push([svgContainer.select("#rect-" + uf).attr("x"), svgContainer.select("#rect-" + uf).attr("y")]);
    nodes.push([svgContainer.select("#circ-" + uf).attr("cx"), svgContainer.select("#circ-" + uf).attr("cy")]);
    //nodes.push([0, 0]);

    // Create a horizontal link from the first node to the second
    const links = d3.linkHorizontal()({
        source: nodes[0],
        target: nodes[1]
    });

    const stateLine = container.append('path')
        .attr('d', links)
        .data(nodes)
        .style("stroke", "gray")
        .style("stroke-width", 3)
        .attr("fill", 'none');

}