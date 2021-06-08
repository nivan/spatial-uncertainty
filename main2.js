let svg = d3.select("body")
    .append("svg")
    .attr("width", 1200)
    .attr("height", 320);

let distribution = d3.range(1000).map(d=>Math.random());

let values = d3.range(20)
	.map(d=>distribution[getRandomInt(0,distribution.length)]).sort((a,b)=>(a-b));

let distributions = {};

// Colors Scheme
let colorScheme = [
    {
        "name" : "Sequential (Single-Hue) 1",
        "schemeName" : "Blues",
        "size":[9],
    },
    {
        "name" : "Sequential (Single-Hue) 2",
        "schemeName" : "Greys",
        "size":[9],
    }, 
    {
        "name" : "Sequential (Single-Hue) 3",
        "schemeName" : "Reds",
        "size":[9],
    }, 
    {
        "name" : "Sequential (Multi-Hue) 1",
        "schemeName" : "YlOrRd",
        "size":[9],
        },
    {
        "name" : "Sequential (Multi-Hue) 2",
        "schemeName" : "BuPu",
        "size":[9],
    },
    { 
        "name" : "Sequential (Multi-Hue) 3",
        "schemeName" : "PuBuGn",
        "size":[9],
    },
    {
        "name" : "Diverging 1",
        "schemeName" : "BrBG",
        "size":[9],
    },
    {
        "name" : "Diverging 2",
        "schemeName" : "PuOr",
        "size":[9],
    },
    {
        "name" : "Diverging 3",
        "schemeName" : "RdYlGn",
        "size":[9],
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

    //Call Plot Distribution
    let selectValue = d3.select('select').property('value');
    plotDistributions(selectValue);
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
        console.log(opacity);
        // Append matrix size label
        let mult = d3.select("#sliderMS").property("value");
        d3.select("#lblSliderMS").text("Matrix size: " + mult + "x" );
        
        QUAD_MATRIX_INDEX = 4 * mult;
        RECT_MATRIX_ROWS_INDEX = 2 * mult;
        RECT_MATRIX_COLUMNS_INDEX = 8 * mult;
        let defaultScale = d3.select("#colorSelect").property("value");
        plotDistributions(defaultScale);
    }


// -------------------- LOAD DATA -------------------- //
d3.csv('preciptation.csv').then(function(data){
    data.forEach(element => {
        let index = +element['index_right'];
        if(!(index in distributions)){
            distributions[index] = [];
        }
        distributions[index].push(+element['average']);
    });
    let defaultScale = "Blues";
    plotDistributions(defaultScale);
})

// -------------------- PLOT MAIN FUNCTION  -------------------- //

function plotDistributions(c){
    mult = d3.select("#sliderMS").property("value");
    let listColors = d3[`scheme${c}`][9];

    let color = d3.scaleQuantize().domain([0.05,37.34]).range(listColors);
    //
    legend(900,40,svg,color,'sequential','Rain precipitation','legend');
    //
    arrayDotGlyph(distributions[0], QUAD_MATRIX_INDEX, QUAD_MATRIX_INDEX, svg, color, "Test0", 100, 100, 40, 10);
    arrayDotGlyph(distributions[0], RECT_MATRIX_ROWS_INDEX, RECT_MATRIX_COLUMNS_INDEX, svg, color, "Test5", 152, 46, 25, 120);

    arrayDotGlyph(distributions[1], QUAD_MATRIX_INDEX, QUAD_MATRIX_INDEX, svg, color, "Test0", 100, 100, 210, 10);
    arrayDotGlyph(distributions[1], RECT_MATRIX_ROWS_INDEX, RECT_MATRIX_COLUMNS_INDEX, svg, color, "Test5", 152, 46, 185, 120);

    arrayDotGlyph(distributions[2], QUAD_MATRIX_INDEX, QUAD_MATRIX_INDEX, svg, color, "Test0", 100, 100, 370, 10);
    arrayDotGlyph(distributions[2], RECT_MATRIX_ROWS_INDEX, RECT_MATRIX_COLUMNS_INDEX, svg, color, "Test5", 152, 46, 345, 120);

    arrayDotGlyph(distributions[3], QUAD_MATRIX_INDEX, QUAD_MATRIX_INDEX, svg, color, "Test0", 100, 100, 530, 10);
    arrayDotGlyph(distributions[3], RECT_MATRIX_ROWS_INDEX, RECT_MATRIX_COLUMNS_INDEX, svg, color, "Test5", 152, 46, 505, 120);
    
    arrayDotGlyph(distributions[4], QUAD_MATRIX_INDEX, QUAD_MATRIX_INDEX, svg, color, "Test0", 100, 100, 690, 10);
    arrayDotGlyph(distributions[4], RECT_MATRIX_ROWS_INDEX, RECT_MATRIX_COLUMNS_INDEX, svg, color, "Test5", 152, 46, 665, 120);
}
