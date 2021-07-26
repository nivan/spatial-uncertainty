let width = 1000;
let height = 800;
let svg = d3.select("body")
    .append("svg")
    .attr("width",width)
    .attr("height",height);
let mapGroup = d3.select("svg").append("g").attr("transform","translate(100,-10)");
let listColors = d3.schemeYlOrRd[9];
let color = d3.scaleQuantize().domain([0.05,37.34]).range(listColors);
let mapMode = "glyph";

//
let animate = false;
let force   = undefined;
let datasets = {};
let distributions = {};
let currentMap = undefined;
let currentDataset = undefined;
let mapData = {};
var mapProjection = undefined;
var mapPathGenerator = undefined;
var idGetter = {};
var valueGetter = {};                
                

let visOptions = [{'text':'Histogram','internalName':'hist'},
                  {'text':'Animation','internalName':'hops'},
                  {'text':'Dot Matrix','internalName':'dotArray'},
                  {'text':'Small Multiples','internalName':'small'}];
let optionData = [
     {'map':{
        'text':'São Paulo',
        'internalName':'sp',    
        'file':'./data/munSP.json'},
     'datasets':[{'text':'Chuvas','internalName':'chuvas','file':'./data/dados_chuva_48h.csv'}]      
     },
     {'map':{
        'text':'Rio de Janeiro',
        'internalName':'rio',
        'file':'./data/rio.geojson'},
     'datasets':[{'text':'Chuvas','internalName':'chuvas','file':''}]      
     },
    {'map':{
    'text':'United States',
    'internalName':'us', 
    'file':'./data/us-states.json',
          },
    'datasets':[{'text':'Covid-19','internalName':'covid','file':''},
                {'text':'Elections 2020','internalName':'elections','file':''}]
    }
];


function legend(x,y,svgContainer,colorScale,scaleType,legendTitle,legendID, minVal, maxVal, payload){

    //hack weird to remove weird svg that is being added artificially
    var ySlack = 2;
    var xSlack = 3;

    //
    svgContainer.select(".legendQuant").remove();
    svgContainer.select(".title").remove();

    //
    svgContainer.append("text").attr("class","title").text(legendTitle);
    var group = svgContainer.append('g').attr("transform","translate("+x+","+y+")").attr("class","legendQuant");
        

    var colorLegend = d3.legendColor()
        .labelFormat(d3.format("d"))
        .useClass(true)
        .scale(colorScale);

    colorLegend.ascending(true);
    
    group
    .call(colorLegend);
    return;
    //debugger
    if(scaleType == "categorical"){
        var rectHeight = 14;
        var rectWidth = 15;
        //
        group.attr("height",function(){return 40+(colorScale.domain().length)*(rectHeight+ySlack)});
        //
        var rects = group.selectAll("rect").data(colorScale.range());
        rects.exit().remove();
        rects.enter()
        .append("rect")
        .merge(rects)
        .attr("y",function(d,i){return (rectHeight + ySlack)*i;})
        .attr("width",rectWidth)
        .attr("height",rectHeight)
        .attr("fill",d=>d)
            .style("stroke-width","1")
        .style("stroke","black");

        //
        var labels = group.selectAll("text").data(colorScale.domain());
        labels.exit().remove();
        labels.enter()
        .append("text")
        .merge(labels)
        .attr("y",function(d,i){return 0.6*rectHeight+(rectHeight + ySlack)*i})
        .attr("x",function(){return (xSlack + rectWidth)})
        .attr("alignment-baseline","middle")
        .text(d=>d);
    }
    else if(scaleType == "sequential"){
        //in this case payload means scented histogram
        
        //
        var rectHeight = 15;
        var rectWidth = 15;
        //
        group.attr("height",function(){return 40+(colorScale.domain().length)*(rectHeight+ySlack)});
        //
        var numRects = colorScale.range().length;
        var legendRects = group.selectAll(".legendRects").data(colorScale.range());
        legendRects.exit().remove();
        legendRects.enter()
        .append("rect")
        .merge(legendRects)
        .attr("y",function(d,i){return (rectHeight + ySlack)*i;})
        .attr("width",rectWidth)
        .attr("height",rectHeight)
        .attr("fill",d=>d)
        .attr("class","legendRects")
        .style("stroke-width","1")
        .style("stroke","black");
        
        //
        var labels = group.selectAll("text").data(colorScale.domain());
        labels.exit().remove();
        labels.enter()
        .append("text")
        .merge(labels)
        .attr("y",function(d,i){return 0.6*rectHeight+(rectHeight + ySlack)*i})
        .attr("x",function(){return (xSlack + rectWidth)})
        .attr("alignment-baseline","middle")
        .text(d=>d);

        //
        if(payload){
        var xScale = d3.scaleLinear().domain(d3.extent(payload)).range([0,40]);
        var barHeight = maximumScreenCoord / payload.length;
        var scentedGroup = svgContainer.select(".scentedRectsGroup");
        var scentedRects = scentedGroup.selectAll(".scentedRect").data(payload);
        scentedRects.exit().remove();
        scentedRects.enter()
                .append("rect")
                .merge(scentedRects)
                .attr("class","scentedRect")
            .attr("x",10)
                .attr("y",function(d,i){return i*barHeight;})
                .attr("width",d=>Math.ceil(xScale(d)))
                .attr("height",barHeight)
                .attr("fill","red");
        }
        
        // //
        // var myBrush = d3.brushY().extent([[0, 0], [40, maximumScreenCoord]]);
        // myBrush.on("brush",(function(){
        // var countExtent = d3.event.selection.map(d=>axisScale.invert(d));
        // if(this.getLayer("Visits Layer"))
        //     this.getLayer("Visits Layer").setColorNormalization(countExtent[0],countExtent[1]);
        // //if(this.getLayer("nanocubeLayer"))
        // //     this.getLayer("nanocubeLayer").setColorNormalization(countExtent[0],countExtent[1]);
        // this.repaint();
        // }).bind(this))
        // .on("end",function(){
        // if(d3.event.selection == null)
        //     svg.select(".brushGroup").call(myBrush.move,[0,maximumScreenCoord])
        // });
        // svg.select(".brushGroup").call(myBrush).call(myBrush.move,[0,maximumScreenCoord]);
        
    }
    else{
        //sequential or diverging
        
    }       
}

function positionGlyphs(pathGenerator,glyphType,positionMode="fixed"){
    //
    let map = mapData[currentMap];
    let centroids = map.features.map(d=>pathGenerator.centroid(d));
    //
    //debugger
    let ids = undefined;
    if(currentMap == 'sp'){
        ids = map.features.map(d=>d.properties.name);
    }
    else if(currentMap == 'us'){
        ids = map.features.map(d=>d.id);
    }
    else if(currentMap == 'rio'){
        ids = map.features.map(d=>d.properties.id);
    }
    else{
        console.log('Unexpected Map!!!');
        debugger
    }
    
    if(positionMode=='fixed'){
        plotGlyphs(centroids,ids,glyphType);	
    }
    else if(positionMode == 'force'){
        //
        let nodes = [];
        let edges = [];
        let count = 0;
        centroids.forEach((element,i)=>{
            nodes.push({'name':'free'+i,'id':i,'isFree':1,'x':centroids[i][0],'y':centroids[i][1]});
            nodes.push({'name':"fixed"+i,'fx':centroids[i][0],'fy':centroids[i][1]});
            edges.push({ 'source': count, 'target': (count+1) });
            count += 2;
        });
        //
        let w = 950;
        let h = 800;
        force = d3.forceSimulation(nodes)
                            .force("charge", d3.forceManyBody())
                            .force("collisionForce",d3.forceCollide(1).strength(0.2))
                            .force("link", d3.forceLink(edges).distance(1));
                            //.force("center", d3.forceCenter().x(w/2).y(h/2));
        
        let lines = undefined;
        let showLines = false;
        if(showLines){
            mapGroup.selectAll("line")
                    .data(edges)
                    .enter()
                    .append("line")
                    .style("stroke", "#ccc")
                    .style("stroke-width", 1);
        }
        
        //Every time the simulation "ticks", this will be called
        force.on("tick", function() {    
            //
            if(showLines){
                        lines.attr("x1", function(d) { return d.source.x; })
                        .attr("y1", function(d) { return d.source.y; })
                        .attr("x2", function(d) { return d.target.x; })
                        .attr("y2", function(d) { return d.target.y; });
            }
            //
            let positions = nodes.filter(node=>node.isFree==1).map(node=>[node.x,node.y]);
            plotGlyphs(positions,ids,glyphType);	
        });
    }
}

function smallMultiples(){

}

function plotBaseMap(){
    mapGroup
	.selectAll(".mapPath")
    .remove();

    if(currentMap == 'us'){                
        mapProjection = d3.geoAlbers()
                            .fitSize([900, 900], mapData[currentMap]);//make it fit on the screen
    }
    else if(currentMap == 'rio'){
        mapProjection = d3.geoMercator()
                            .fitSize([900, 900], mapData[currentMap ]);//make it fit on the screen
    }
    else if(currentMap == 'sp'){
        mapProjection = d3.geoMercator()
                            .fitSize([900, 900], mapData[currentMap ]);//make it fit on the screen
    }

    mapPathGenerator = d3.geoPath().projection(mapProjection);

    //
    mapGroup
	.selectAll("path")
	.data(mapData[currentMap].features)
	.enter()
	.append("path")
	.attr("class","mapPath")
	.attr("d", mapPathGenerator)
	.attr("stroke","white")
	.attr('stroke-width',2)
	.attr("fill",'#dedede');
}

function getDistributionsExtent(){
    let extent = [Number.MAX_SAFE_INTEGER,Number.MIN_SAFE_INTEGER];

    for(let key in currentDataset){
        let distribution = currentDataset[key];
        let distExtent = d3.extent(distribution);
        extent[0] = d3.min([extent[0],distExtent[0]]);
        extent[1] = d3.max([extent[1],distExtent[1]]);
    }

    return extent;
}

function buildHistograms(numBins){
    let histograms = {};
    let extent = getDistributionsExtent();
    
    //compute histogram
    let binWidth = (extent[1]-extent[0])/numBins;
    histograms["xExtent"] = extent;
    histograms["bins"] = d3.range(numBins).map(i=>[i*binWidth,(i+1)*binWidth]);
    histograms["numBins"] = numBins
    let yValues = [0];

    for(let key in currentDataset){
        let distribution = currentDataset[key];
        let counts = d3.range(numBins).map(d=>0);

        distribution.forEach(element => {
            let index = Math.min(counts.length-1,Math.floor((element - extent[0])/binWidth));
            counts[index] += 1;
        });
        histograms[key] = counts;
        yValues.push(d3.max(counts));
    }
    histograms['yExtent'] = d3.extent(yValues);

    return histograms;
}

function plotGlyphs(positions,ids,gtype='hist'){

    d3.select("#glyphGroup").remove();
    let glyphGroup = mapGroup.append("g").attr("id","glyphGroup");

    let ww = 75;
    let hh = 75;
    
    //
    let auxPayload = undefined;
    if(gtype == 'hist'){
        //
        d3.select(".legendQuant").remove();
        d3.select(".title").remove();
        auxPayload = buildHistograms(10);
    }
    else{
        legend(10,10,svg,color,'sequential','Preciptation','legend');
    }
    
    positions.forEach((center,i)=>{
        let id = ids[i];
        if(gtype == 'dotArray') arrayDotGlyph(currentDataset[id],5,4,glyphGroup,color,"Test"+i,50,50,center[0]-ww/2,center[1]-hh/2);    
        else if(gtype == 'hist'){
                if(!(id in auxPayload))
                    debugger 
                histogramGlyph(auxPayload[id], auxPayload.bins, auxPayload.numBins, auxPayload.yExtent, 
                                             glyphGroup, "Test"+i,75,50, center[0]-ww/2,center[1]-hh/2, 5)
            }
    }); 
    
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function drawAnimation(){
    animate = true;
    let nameMapData = d3.select("#mapSelect").node().value;
    let nameData    = d3.select("#dataSelect").node().value;

    currentDataset = datasets[[nameMapData,nameData]];


    let extent = [Number.MAX_SAFE_INTEGER,Number.MIN_SAFE_INTEGER];
    for(let key in currentDataset){
        let distribution = currentDataset[key];
        let distExtent = d3.extent(distribution);
        extent[0] = d3.min([extent[0],distExtent[0]]);
        extent[1] = d3.max([extent[1],distExtent[1]]);
    }

	for (var i = 0; i < 10; i++) {
        if(!animate){
            break;
        }
	    if(i < 9){
            //console.log("tick" + i);
            
            mapGroup.selectAll(".mapPath")
                .attr("fill",function(d){
                    let distribution = undefined;
                    if(nameMapData == 'sp') distribution = currentDataset[d.properties.name];
                    else if(nameMapData == 'us') distribution = currentDataset[d.id];
                    else distribution = currentDataset[d.properties.id];
                    return color(distribution[getRandomInt(0,distribution.length)]);
        
            });
		}
        if(i==9){
			i=-1;
		}
		await sleep(660);
	}
}

function parseScalarData(scalarData){
    // let uniqueIds = new Set(scalarData.map(d=>d.index_right))
    // distributions = {}

    // for (const v of Set(scalarData.map(d=>d.index_right))) {
    // 	console.log(v);
    // }
    
    for(let i = 0 ; i < 18 ; ++i)
        distributions[i] = [];

    scalarData.forEach(element => {
        let index = +element.index_right;
        distributions[index].push(+element.average);
    });
    
}

function searchByInternalName(nameKey, myArray){

    for (var i=0; i < myArray.length; i++) {
        if (myArray[i]['map']['internalName'] === nameKey) {
            return myArray[i];
        }
    }
}



function loadMapData(){
    //map data
    let nameMapData = d3.select("#mapSelect").node().value;
    
    if(!(nameMapData in mapData)){
        //
        let mapMetaData = searchByInternalName(nameMapData,optionData);
        let filename = mapMetaData['map']['file'];
        
        //
        d3.json(filename).then(function(data){
            
            let temp = data;
        
            if(nameMapData == 'us'){
                //
                let contiguousStates = ["Alabama", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];
                temp.features = temp.features.filter(d=>contiguousStates.indexOf(d.properties.name) >= 0);
            }

            mapData[nameMapData] = temp;
            plotBaseMap();
        }); 
                
    }
    else{
        plotBaseMap();
    }
}

function updateDataOptions(){
    let selectedValue    = d3.select("#mapSelect").node().value;
    currentMap = selectedValue;
    let availableOptions = searchByInternalName(selectedValue,optionData)['datasets'];
    [{'text':'Covid-19','internalName':'covid','file':''},
      {'text':'Elections 2020','internalName':'elections','file':''}]
    
    if(availableOptions){
        let sel = d3.select("#dataSelect")
        .selectAll("option")
        .data(availableOptions);

        //
        sel.exit().remove();
        //
        sel.enter()
        .append("option")
        .merge(sel) 
        .attr('value',d=>d.internalName)
        .text(d=>d.text);
    }
}

function updateMapInput(){
    updateDataOptions();
    loadMapData();
}

function drawHistogramGlyphs(){
    let posOption = d3.select("#posSelect").node().value;
    positionGlyphs(mapPathGenerator, 'hist',posOption);
}

function drawMatrixGlyphs(){
    let posOption = d3.select("#posSelect").node().value;
    positionGlyphs(mapPathGenerator, 'dotArray',posOption);
}

function updateDataVis(){
    //
    let nameMapData = d3.select("#mapSelect").node().value;
    let nameData    = d3.select("#dataSelect").node().value;
    currentDataset = datasets[[nameMapData,nameData]];

    //
    let selectedVis     = d3.select("#visSelect").node().value;
    if(selectedVis != 'hops')
        animate = false;

     //reset map
    d3.selectAll(".mapPath")
	.attr("stroke","white")
	.attr('stroke-width',2)
	.attr("fill",'#dedede');
    //
    if(force){
        force.stop();
    }
    //remove glyphs
    d3.select("#glyphGroup").remove();

    //
    let extent = getDistributionsExtent();
    color.domain(extent);

    //
    if(selectedVis == 'hist'){
        drawHistogramGlyphs();
    }
    else if(selectedVis == 'hops'){
        legend(10,10,svg,color,'sequential','Preciptation','legend');
        drawAnimation();
    }
    else if(selectedVis == 'dotArray'){
        drawMatrixGlyphs();
    }
}

function updateView(){
    //
    updateMapInput();

    //
    updateDataVis();
}

function initInterface(){

    d3.select("#mapSelect")
    .selectAll("option")
    .data(optionData)
    .enter()
    .append('option')
    .attr('value',d=>d['map']['internalName'])
    .text(d=>d['map']['text']);
    d3.select("#mapSelect").on('change',updateDataOptions);

    //
    d3.select("#visSelect")
    .selectAll("option")
    .data(visOptions)
    .enter()
    .append('option')
    .attr('value',d=>d['internalName'])
    .text(d=>d['text']);

    //
    d3.select("#updateButton")
    .on('click',updateView);

    //
    updateView();
}

function parseData(data,mapID,dataID,idGetter,valueGetter){
    let myData = {};
    for(let i in data){
        let item = data[i];
        let regionID = idGetter(item);
        let value = valueGetter(item);
        if(regionID == undefined)
            continue;
        if(!(regionID in myData)){
            myData[regionID] = [];
        }
        myData[regionID].push(value);
    }
    //
    datasets[[mapID,dataID]] = myData;
}

function loadMaps(){
    d3.json('./data/munSP.json').then(function(spMap){
        let regiaoMet = ['Araçariguama', 'Arujá', 'Atibaia', 'Barueri', 'Bertioga', 'Biritiba Mirim', 'Bom Jesus dos Perdões', 'Cabreúva', 'Caieiras', 'Cajamar', 'Campo Limpo Paulista', 'Carapicuíba', 'Cotia', 'Cubatão', 'Diadema', 'Embu', 'Embu-Guaçu', 'Ferraz de Vasconcelos', 'Francisco Morato', 'Franco da Rocha', 'Guararema', 'Guarujá', 'Guarulhos', 'Ibiúna', 'Igaratá', 'Indaiatuba', 'Itanhaém', 'Itapecerica da Serra', 'Itapevi', 'Itaquaquecetuba', 'Itatiba', 'Itu', 'Itupeva', 'Jacareí', 'Jandira', 'Jarinu', 'Jundiaí', 'Juquitiba', 'Louveira', 'Mairinque', 'Mairiporã', 'Mauá', 'Miracatu', 'Mogi das Cruzes', 'Mongaguá', 'Nazaré Paulista', 'Osasco', 'Pedro de Toledo', 'Peruíbe', 'Piracaia', 'Pirapora do Bom Jesus', 'Poá', 'Praia Grande', 'Ribeirão Pires', 'Rio Grande da Serra', 'Salto', 'Santa Isabel', 'Santana de Parnaíba', 'Santo André', 'Santos', 'Suzano', 'São Bernardo do Campo', 'São Caetano do Sul', 'São José dos Campos', 'São Lourenço da Serra', 'São Paulo', 'São Roque', 'São Vicente', 'Taboão da Serra', 'Vargem Grande Paulista', 'Vinhedo', 'Várzea Paulista']
        spMap.features = spMap.features.filter(d=>regiaoMet.indexOf(d.properties.name) >= 0);
        mapData['sp'] = spMap;
        d3.json('./data/rio.geojson').then(function(rioMap){
            mapData['rio'] = rioMap;
            d3.json('./data/us-states.json').then(function(usMap){
                let contiguousStates = ["Alabama", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];
                usMap.features = usMap.features.filter(d=>contiguousStates.indexOf(d.properties.name) >= 0);
                mapData['us'] = usMap;
                loadDatasets();
            });
        });
    });
}

function loadDatasets(){
    d3.csv('data/covid-states.csv').then(function(usCovidData){
        parseData(usCovidData,'us','covid',idGetter[['us','covid']],valueGetter[['us','covid']]);
        d3.csv('data/dados_chuva_48h.csv').then(function(spPrecipData){
            parseData(spPrecipData,'sp','chuvas',idGetter[['sp','chuvas']],valueGetter[['sp','chuvas']]);
            d3.csv('data/preciptationFinal.csv').then(function(precipData){
                parseData(precipData,'rio','chuvas',idGetter[['rj','chuvas']],valueGetter[['rj','chuvas']]);
                initInterface();        
            });
        });
    });
}

function mountGetterSetter(){
    idGetter[['sp','chuvas']] = d=>d['municipio'];
    idGetter[['rj','chuvas']] = d=>d['regionID'];
    idGetter[['us','covid']] = d=>d['id'];

    valueGetter[['sp','chuvas']] = d=>(+d['valor_vegetacao']-(+d['valor_urbano']));
    valueGetter[['rj','chuvas']] = d=>+d['value'];          
    valueGetter[['us','covid']] = d=>+d['cases'];          

}

mountGetterSetter();
loadMaps();
// d3.csv('./data/results.csv').then(function(scalarData){
//     //debugger
//     parseScalarData(scalarData);

//     d3.json('./data/us-states.json').then(function(data){
//         //
//         let contiguousStates = ["Alabama", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];
	
//         data.features = data.features.filter(d=>contiguousStates.indexOf(d.properties.name) >= 0);
//         console.log(data)
//         mapData = data;

        
//         //
//         let projection = d3.geoAlbers()//Mercator()
//             .fitSize([900, 900], mapData);//make it fit on the screen
//         let pathGenerator = d3.geoPath().projection(projection);
//         //
//         plotBaseMap(projection, pathGenerator);
        
//         // if(mapMode == "glyph")
//         //     positionGlyphs(projection, pathGenerator);
//         // else if(mapMode == "animation")
//         //     drawAnimation();   
//     });    
// })

