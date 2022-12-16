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


//Matrix size constants
let VERT_RECT_MATRIX_ROWS_INDEX = 2;
let VERT_RECT_MATRIX_COLUMNS_INDEX = 10;

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

    //
    var deslocamentos = {
        'CE':[10,-90],
        'PB':[110,-50],
        'PE':[90,-20],
        'AL':[60,20],
        'RN':[30,-65],
        'SE':[35,50],
        'PI':[10,10],
        'DF':[20,-40],
        'SC':[50,-10],
        'GO':[10,20],
        'RJ':[30,20],
        'ES':[20,20],
    };

    //Centroids
    let centroids = mapData.features.map(d => [path.centroid(d), d.properties.ESTADO, d.properties.UF]);
    centroids.forEach((function (c) {
        var deslocX = 0;
        var deslocY = 0;
        if(c[2] in this){
            deslocX = this[c[2]][0];
            deslocY = this[c[2]][1];
        }
        if (matrixOrientation == 0) {
            arrayDotGlyph(scoreDistributions[c[1]],
                4,
                5,
                d3.select("#svg-map"), color, "glyph-" + c[1].normalize("NFD").replace(/[\u0300-\u036f\s+]/ig, "").toLowerCase(), 115, 110, c[0][0]+deslocX, c[0][1]+deslocY, c[1], c[2]);
        } else {
            arrayDotGlyph(scoreDistributions[c[1]],
                VERT_RECT_MATRIX_ROWS_INDEX,
                VERT_RECT_MATRIX_COLUMNS_INDEX,
                d3.select("#svg-map"), color, "glyph-" + c[1].normalize("NFD").replace(/[\u0300-\u036f\s+]/ig, "").toLowerCase(), 170, 90, c[0][0]+deslocX, c[0][1]+deslocY, c[1], c[2]);
        }

    }).bind(deslocamentos));
}