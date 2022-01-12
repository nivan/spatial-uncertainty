let svg = d3.select("#div-map");

let distribution = d3.range(1000).map(d=>Math.random());

let values = d3.range(20)
	.map(d=>distribution[getRandomInt(0,distribution.length)]).sort((a,b)=>(a-b));

let distributions = {};
let scoreDistributions = {};

// Colors Scheme
let colorScheme = [
    {
        "name" : "Diverging 1",
        "schemeName" : "BrBG",
        "size":[10],
    },
    {
        "name" : "Diverging 2",
        "schemeName" : "PuOr",
        "size":[10],
    },
    {
        "name" : "Diverging 3",
        "schemeName" : "RdYlGn",
        "size":[10],
    },
];

//Clear function
function clear() {    
    d3.select('body').selectAll("circle").remove();
    d3.select('body').selectAll(".legendCells").remove();
    d3.select('body').selectAll(".title").remove();
    d3.select('body').selectAll(".label").remove();
    d3.select('body').selectAll(".swatch").remove();
    //d3.select('body').selectAll(".canvas").remove();
}

// -------------------- CREATE AND UPDATE GLYPH COLOR SCHEME -------------------- //

// Append color scheme select menu
let select = d3.select("body")
            .append('select')
            .attr('class', 'select')
            .attr('id', 'colorSelect')
            .attr('x', 900)
            .attr('y', 250)
            .on('change', setColorScheme);

// Append items to select
let options = select.selectAll('option')
                .data(colorScheme)
                .enter()
                .append('option')
                    .text(d => { return d.name })
                .attr( "value", (d) => { return d.schemeName } );

//Update color scheme
function setColorScheme(){
    //Clear
    clear();
    d3.select('#sliderCT').property('value', 1);

    //Call Plot Scores
    let selectValue = d3.select('select').property('value');
    plotScores(selectValue);
}

// -------------------- CREATE AND UPDATE GLYPH BACK TRANSPARENCY -------------------- //
// Append tranparency controller
let sliderCanvasTransparency = d3.select("body")
            .append('input')
            .attr('id', 'sliderCT')
            .property('type', 'range')
            .property('min', '0')
            .property('max', '1')
            .property('value', 1)
            .property('step', '0.1')
            .on('input', d => { glyphBackTransparency() });
// Append tranparency controller label
let labelMatrixTranparency = d3.select("body")
    .append('label')
    .text("Back transparency")
    .attr('id', 'lblSliderCT')
    .attr('for', 'sliderCT');

function glyphBackTransparency(){
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
            if ( opacity == 0){
                return 0
            } else{
                return opacity
            }
        });
}

// -------------------- UPDATE MATRIX SIZE -------------------- //

//Matrix size contants
let QUAD_MATRIX_INDEX = 4;
let RECT_MATRIX_ROWS_INDEX = 2;
let RECT_MATRIX_COLUMNS_INDEX = 8;


// Append matrix size controller
let sliderMatrixSize = d3.select("body")
            .append('input')
            .attr('id', 'sliderMS')
            .property('type', 'range')
            .property('min', '1')
            .property('max', '10')
            .property('step', '1')
            .property('value', 1)
            .on('input', d => { glyphMatrixMultiplier() });

let labelMatrixSize = d3.select("body")
    .append('label')
    .text("Matrix size: 1x")
    .attr('id', 'lblSliderMS')
    .attr('for', 'sliderMS');
    
    function glyphMatrixMultiplier(){
        clear();
        let opacity = d3.select('#sliderCT').property("value");
        d3.select('#sliderCT').property('value', opacity);
        // Append matrix size label
        let mult = d3.select("#sliderMS").property("value");
        d3.select("#lblSliderMS").text("Matrix size: " + mult + "x" );
        //
        QUAD_MATRIX_INDEX = 4 * mult;
        RECT_MATRIX_ROWS_INDEX = 2 * mult;
        RECT_MATRIX_COLUMNS_INDEX = 8 * mult;
        let defaultScale = d3.select("#colorSelect").property("value");
        plotScores(defaultScale);
    }

// -------------------- LOAD SCORE DATA -------------------- //

function loadScoreData(){
    d3.csv('users_score_dataset_2.csv').then(function(scores){
        scores.forEach(element => {
            let index = element['State'];
            if(!(index in scoreDistributions)){
                scoreDistributions[index] = [];
            }
            if(+element['Probability'] > 0.01){
                scoreDistributions[index].push(+element['Probability']);
            }
        });
        let defaultScale = "RdYlGn";
        plotScores(defaultScale);
    })
}
    
// -------------------- PLOT SCORE FUNCTION  -------------------- //

function plotScores(c){
    mult = d3.select("#sliderMS").property("value");
    let listColors = d3[`scheme${c}`][10];

    console.log("ListColors_______: " + listColors);

    let color = d3.scaleQuantize().domain([0, 1]).range(listColors);

    legend(1000, 600, svg, color, 'sequential', 'Probalidade (%)', 'legend');

    //gerador de caminhos que vai converter os objetos geojson em caminhos do SVG
    var path = d3.geoPath().projection(proj);

    //Centroids
    let centroids = mapData.features.map(d => [path.centroid(d), d.properties.ESTADO]);

    console.log(centroids);
    centroids.forEach(function(c){
        arrayDotGlyph(scoreDistributions[c[1]], QUAD_MATRIX_INDEX, QUAD_MATRIX_INDEX, d3.select("#mapId"), color, "glyph-" + c[1].replace(/[.,\/#!$%\^&\*;:{}=\-_`´~() ]/g,""), 85, 85, c[0][0], c[0][1]);
    });


}