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
    .attr("x", 900)
    .attr("y", 20)
    .text(legendTitle);

    var group = svgContainer.append('g').attr("transform", "translate(" + x + "," + y + ")").attr("class", "legendQuant");
    
    //Define orientation color scale
    var colorLegend = d3.legendColor()
        .labelFormat(d3.format(".2f"))
        .useClass(true)
        .scale(colorScale);
    
    //Set orientation color scale
    colorLegend.ascending(true);

    group
        .call(colorLegend);
    return;
}

function arrayDotGlyph(distribution, numRows, numColumns, svgContainer, color, id, width, height, posX, posY, distMode = 'quantile') {
    let numSamples = numRows * numColumns;

    // Grupo que contem as bolinhas
    let container = svgContainer.append("g");
    container.attr("id", "glyph" + id);

    //Captura o centro do quadrado
    let centerX = posX + width / 2.0;
    let centerY = posY + height / 2.0;
    
    // Espaçamento entre a matriz e o box (Borda)
    let slackness = 5;
    let adjustedCanvasWidth = width - 2 * slackness;
    let adjustedCanvasHeight = height - 2 * slackness;

    //
    let canvasAdjustedX = posX + slackness;
    let canvasAdjustedY = posY + slackness;

    //Calculando W e H de cada bolinha
    let sampleWidth = adjustedCanvasWidth / numColumns;
    let sampleHeight = adjustedCanvasHeight / numRows;

    let circleDiameter  =  sampleHeight;
    let circleRadius    =  sampleHeight/2;

    let values = [];

    if (distMode == 'random') {
        for (let i = 0; i < numSamples; ++i) {
            let index = getRandomInt(0, distribution.length);
            values.push(distribution[index]);
        }
    }
    else if (distMode == 'quantile') {
        for (let i = 0; i < numSamples; ++i) {
            values.push(math.quantileSeq(distribution, (1.0 * i) / (numSamples - 1)));
        }
    }

    values.sort((a, b) => (b - a));

    //Borda do canvas do Glyph
    let borderCanvas = container.append("rect")
        .data([container])
        .attr("class", "canvas")
        .attr("x", canvasAdjustedX + circleRadius)
        .attr("y", canvasAdjustedY + circleRadius)
        .attr("width", adjustedCanvasWidth - circleDiameter)
        .attr("height", adjustedCanvasHeight - circleDiameter)
        .attr("fill", "black")

    //Contrução da matriz de bolinhas
    container.selectAll(".sample")
        .data(d3.zip(d3.range(numRows * numColumns), values)) // Range > Criar a lista
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            let coords = unpack(d[0], numRows, numColumns); //Informa em qual linha e columa a bolinha está.
            return canvasAdjustedX + coords[1] * sampleWidth + sampleHeight/2;
        })
        .attr("cy", function (d) {
            let coords = unpack(d[0], numRows, numColumns);
            return canvasAdjustedY + sampleHeight/2 + coords[0] * sampleHeight;
        })
        .attr("r", sampleWidth/2)
        .attr("fill", (d, i) => color(d[1]))
        .attr("stroke", "black")

}