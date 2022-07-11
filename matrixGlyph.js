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


function arrayDotGlyph(distribution, numRows, numColumns, svgContainer, color, id, width, height, posX, posY, states, distMode = 'quantile') {
    let numSamples = numRows * numColumns;
    // debugger
    // Grupo que contem as bolinhas
    let container = svgContainer.append("g");
    container.attr("id", id);

    //Captura o centro do quadrado
    let centerX = posX + width / 2.0;
    let centerY = posY + height / 2.0;

    // Espaçamento entre a matriz e o box (Borda)
    let slackness = 12;
    let adjustedCanvasWidth = width - 5.2 * slackness;
    let adjustedCanvasHeight = height - 5.2 * slackness;

    let canvasAdjustedX = posX;
    let canvasAdjustedY = posY;

    //Calculando W e H de cada bolinha
    let sampleWidth = adjustedCanvasWidth / numColumns;
    let sampleHeight = adjustedCanvasHeight / numRows;

    let circleDiameter = sampleHeight;
    let circleRadius = sampleHeight / 2;

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
        .attr("class", "canvas")
        .attr("x", canvasAdjustedX - 3)
        .attr("y", canvasAdjustedY - 3)
        .attr("rx", "6")
        .attr("ry", "6")
        .attr("width", adjustedCanvasWidth + 6)
        .attr("height", adjustedCanvasHeight + 6)
        .attr("fill", "white")
        .attr("stroke", "#768591")

    //Contrução da matriz de bolinhas
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
        .attr("stroke", "none")

    let stateLabel = container.append('text')
        .data([container])
        .attr("class", "state-label")
        .attr("font-family", "Roboto Condensed")
        .attr("x", canvasAdjustedX)
        .attr("y", canvasAdjustedY)
        .text(states)

        var path = d3.geoPath()
        .projection(proj);
        let ctd = mapData.features.map(d=>path.centroid(d));
        let centroids = mapData.features.map(d=>path.centroid(d));
        let indice = mapData.features.map(d=>d.properties.ESTADO).indexOf(states)
        let centroid = centroids[indice]

        let stateLine = container.append('path')
            .data([centroid])
            .attr('d', d=>d3.line()([d,[posX,posY]]))
            .style("stroke", "red")
            .style("stroke-width", 1)
            .attr("fill", 'none')

}

