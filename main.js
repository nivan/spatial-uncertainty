// -------------------- SEARCH DATASET URL PARAM  -------------------- //
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const scenario = urlParams.get('scenario')
const matrixOrientation = urlParams.get('matrix')

function urlSearch() {
    if (urlParams.has('scenario')) {
        console.log("True: " + scenario);
        console.log("True: " + matrixOrientation);
    } else {
        urlParams.append('scenario', 'local-01');
        urlParams.append('matrix', 0);
        console.log(">>>>>>>> " + urlParams.getAll('scenario'));
        console.log(">>>>>>>> " + urlParams.getAll('matrix'));
        window.location.href = 'http://0.0.0.0:8000/?scenario=' + urlParams.getAll('scenario') + '&matrix=' + urlParams.getAll('matrix');
    }
}
urlSearch();

// -------------------- UI SETUP APP  -------------------- //

let svg = d3.select("#div-map");

let distribution = d3.range(1000).map(d => Math.random());

let values = d3.range(20)
    .map(d => distribution[getRandomInt(0, distribution.length)]).sort((a, b) => (a - b));

let distributions = {};
let scoreDistributions = {};

// Colors Scheme
let colorScheme = [
    {
        "name": "Escala de cor 1",
        "schemeName": "Spectral",
        "domain": [100, 0],
        "size": [10],
    },
    {
        "name": "Escala de cor 2",
        "schemeName": "RdYlGn",
        "domain": [100, 0],
        "size": [10],
    },
    {
        "name": "Escala de cor 3",
        "schemeName": "PuOr",
        "domain": [100, 0],
        "size": [10],
    },
];

//Clear function
function clear() {
    d3.select('body').selectAll("circle").remove();
    d3.select('body').selectAll(".legendCells").remove();
    d3.select('body').selectAll(".title").remove();
    d3.select('body').selectAll(".label").remove();
    d3.select('body').selectAll(".swatch").remove();
    d3.select('body').selectAll(".canvas").remove();
    d3.select('body').selectAll(".state-label").remove();
}

// -------------------- CREATE AND UPDATE GLYPH COLOR SCHEME -------------------- //

// Append color scheme select menu
let select = d3.select(".container-fluid")
    .append('select')
    .attr('class', 'select')
    .attr('id', 'colorSelect')
    .attr('x', -700)
    .attr('y', 250)
    .on('change', setColorScheme);

// Append items to select
let options = select.selectAll('option')
    .data(colorScheme)
    .enter()
    .append('option')
    .text(d => { return d.name })
    .attr("value", (d) => { return d.schemeName });

//Update color scheme
function setColorScheme() {
    //Clear
    clear();
    d3.select('#sliderCT').property('value', 1);

    //Call Plot Scores
    let selectValue = d3.select('select').property('value');
    plotScores(selectValue);
}

// -------------------- CREATE AND UPDATE GLYPH BACK TRANSPARENCY -------------------- //
// Append tranparency controller
let sliderCanvasTransparency = d3.select(".container-fluid")
    .append('input')
    .attr('id', 'sliderCT')
    .property('type', 'range')
    .property('min', '0')
    .property('max', '1')
    .property('value', 1)
    .property('step', '0.1')
    .on('input', d => { glyphBackTransparency() });

// Append transparency controller label
let labelMatrixTranparency = d3.select(".container-fluid")
    .append('label')
    .text("Transparency")
    .attr('id', 'lblSliderCT')
    .attr('for', 'sliderCT');

function glyphBackTransparency() {
    let opacity = d3.select("#sliderCT").property("value");

    svg.selectAll('.canvas')
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .style("opacity", opacity);

    svg.selectAll('circle')
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .style("stroke-opacity", d => {
            if (opacity == 0) {
                return 0
            } else {
                return opacity
            }
        });
}

// -------------------- UPDATE MATRIX SIZE -------------------- //

let matrixProportionData = [
    {
        "name": "Squared Matrix",
        "value": [0],
        "rows": [90],
        "columns": [90],
    },
    {
        "name": "Vertical Rect Matrix",
        "value": [1],
        "rows": [120],
        "columns": [75],
    },
];

//Matrix size constants
let QUAD_MATRIX_INDEX = 5;
let VERT_RECT_MATRIX_ROWS_INDEX = 4;
let VERT_RECT_MATRIX_COLUMNS_INDEX = 5;

// Append matrix proportion
let matrixSelect = d3.select(".container-fluid")
    .append('select')
    .attr('class', 'selectMatrix')
    .attr('id', 'matrixSelect')
    .attr('x', 900)
    .attr('y', 500)
    .property('value', 0)
    .on('change', d => { glyphMatrixType(d.value) });

// Append items to select
let matrixOptions = matrixSelect.selectAll('option')
    .data(matrixProportionData)
    .enter()
    .append('option')
    .text(d => { return d.name })
    .attr("value", (d) => { return d.value });

function glyphMatrixType(v) {
    clear();
    let val = d3.select("#matrixSelect").property("value");
    d3.select('#matrixSelect').property('value', val);

    let defaultScale = d3.select("#colorSelect").property("value");
    plotScores(defaultScale);
}

// Append matrix size controller
let sliderMatrixSize = d3.select(".container-fluid")
    .append('input')
    .attr('id', 'sliderMS')
    .property('type', 'range')
    .property('min', '0.5')
    .property('max', '4')
    .property('step', '0.5')
    .property('value', 1)
    .on('input', d => { glyphMatrixMultiplier() });

let labelMatrixSize = d3.select(".container-fluid")
    .append('label')
    .text("Matrix size: 1x")
    .attr('id', 'lblSliderMS')
    .attr('for', 'sliderMS');

function glyphMatrixMultiplier() {
    clear();
    let opacity = d3.select('#sliderCT').property("value");
    d3.select('#sliderCT').property('value', opacity);
    // Append matrix size label
    let mult = d3.select("#sliderMS").property("value");
    d3.select("#lblSliderMS").text("Matrix size: " + mult + "x");
    //
    QUAD_MATRIX_INDEX = 4 * mult;
    VERT_RECT_MATRIX_ROWS_INDEX = 8 * mult;
    VERT_RECT_MATRIX_COLUMNS_INDEX = 2 * mult;

    let defaultScale = d3.select("#colorSelect").property("value");
    plotScores(defaultScale);
}

// -------------------- LOAD SCORE DATA -------------------- //

function loadScoreData() {
    let fileName = "./csv/experiment_dataset_" + scenario + ".csv";
    console.log(fileName);

    d3.csv(fileName).then(function (scores) {
        scores.forEach(element => {
            let index = element['State'];
            if (!(index in scoreDistributions)) {
                scoreDistributions[index] = [];
            }
            if (+element['Prec_Prob'] > 0.01) {
                scoreDistributions[index].push(+element['Prec_Prob']);
            }
        });
        let defaultScale = "Spectral";
        plotScores(defaultScale);
    })
}

// -------------------- PLOT SCORE FUNCTION  -------------------- //

function plotScores(c) {
    mult = d3.select("#sliderMS").property("value");
    matrixType = d3.select("#matrixSelect").property("value");
    let listColors = d3[`scheme${c}`][10];
    //Custom color scale: Based on Color Brewer divergent scale
    //https://colorbrewer2.org/#type=diverging&scheme=RdBu&n=10
    let color = d3.scaleQuantize().domain([0, 1]).range([
        "#CC211F",
        "#FF6666",
        "#F7A959",
        "#FFCC99",
        "#F9E086",
        "#FFFFCC",
        "#70A0CA",
        "#A5D2E5",
        "#99CC99",
        "#CCFFCC",
    ]);

    legend(60, 550, d3.select("#svg-map"), color, 'sequential', 'Escala de Sucesso (%)', 'legend');

    //gerador de caminhos que vai converter os objetos geojson em caminhos do SVG
    var path = d3.geoPath().projection(proj);

    //Centroids
    let centroids = mapData.features.map(d => [path.centroid(d), d.properties.ESTADO, d.properties.UF]);
    centroids.forEach(function (c) {
        if (matrixType == 0) {
            arrayDotGlyph(scoreDistributions[c[1]],
                4,
                5,
                d3.select("#svg-map"), color, "glyph-" + c[1].normalize("NFD").replace(/[\u0300-\u036f\s+]/ig, "").toLowerCase(), 115, 110, c[0][0], c[0][1], c[1], c[2]);
        } else {
            arrayDotGlyph(scoreDistributions[c[1]],
                VERT_RECT_MATRIX_ROWS_INDEX,
                VERT_RECT_MATRIX_COLUMNS_INDEX,
                d3.select("#svg-map"), color, "glyph-" + c[1].normalize("NFD").replace(/[\u0300-\u036f\s+]/ig, "").toLowerCase(), 75, 120, c[0][0], c[0][1], c[1], c[2]);
        }

    });
}