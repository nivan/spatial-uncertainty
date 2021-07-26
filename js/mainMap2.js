let mapData = undefined;
let distributions = {};
let width = 1000;
let height = 800;
let svg = d3.select("body")
    .append("svg")
    .attr("width",width)
    .attr("height",height);
let mapGroup = d3.select("svg").append("g").attr("transform","translate(100,0)");
let listColors = d3.schemeYlOrRd[9];
let color = d3.scaleQuantize().domain([0.05,37.34]).range(listColors);
let mapMode = "glyph";

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
        .labelFormat(d3.format(".2f"))
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

function positionGlyphs(projection,pathGenerator,positionMode="force"){
    //
    let centroids = mapData.features.map(d=>pathGenerator.centroid(d));

    if(positionMode=='fixed'){
        plotGlyphs(centroids,projection,pathGenerator);	
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
        var force = d3.forceSimulation(nodes)
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
            plotGlyphs(positions,projection,pathGenerator);	
        });
    }
}

function plotBaseMap(projection,pathGenerator){
    
    //
    mapGroup
	.selectAll("path")
	.data(mapData.features)
	.enter()
	.append("path")
	.attr("class","mapPath")
	.attr("d", pathGenerator)
	.attr("stroke","white")
	.attr('stroke-width',2)
	.attr("fill",'#dedede');
}

function buildHistograms(numBins){
    let histograms = {};
    let extent = [Number.MAX_SAFE_INTEGER,Number.MIN_SAFE_INTEGER];
    for(let key in distributions){
        let distribution = distributions[key];
        let distExtent = d3.extent(distribution);
        extent[0] = d3.min([extent[0],distExtent[0]]);
        extent[1] = d3.max([extent[1],distExtent[1]]);
    }
    //compute histogram
    let binWidth = (extent[1]-extent[0])/numBins;
    histograms["xExtent"] = extent;
    histograms["bins"] = d3.range(numBins).map(i=>[i*binWidth,(i+1)*binWidth]);
    histograms["numBins"] = numBins
    let yValues = [0];

    for(let key in distributions){
        let distribution = distributions[key];
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

function plotGlyphs(positions,projection,pathGenerator,gtype='hist'){

    d3.select("#glyphGroup").remove();
    let glyphGroup = mapGroup.append("g").attr("id","glyphGroup");

    let ww = 75;
    let hh = 75;
    
    //
    let auxPayload = undefined;
    if(gtype == 'hist'){
        auxPayload = buildHistograms(10);
    }
    else if(gtype == "dotArray"){
        legend(350,180,svg,color,'sequential','Preciptation','legend');
    }
    //
    positions.forEach((center,i)=>{
        if(gtype == 'dotArray') arrayDotGlyph(distributions[i],5,4,glyphGroup,color,"Test"+i,50,50,center[0]-ww/2,center[1]-hh/2);    
        else if(gtype == 'hist') histogramGlyph(auxPayload[i], auxPayload.bins, auxPayload.numBins, auxPayload.yExtent, 
                                             glyphGroup, "Test"+i,75,50, center[0]-ww/2,center[1]-hh/2, 5)
    });
    
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function drawAnimation(){

    let extent = [Number.MAX_SAFE_INTEGER,Number.MIN_SAFE_INTEGER];
    for(let key in distributions){
        let distribution = distributions[key];
        let distExtent = d3.extent(distribution);
        extent[0] = d3.min([extent[0],distExtent[0]]);
        extent[1] = d3.max([extent[1],distExtent[1]]);
    }


    
	for (var i = 0; i < 10; i++) {
	    if(i < 9){
            //console.log("tick" + i);
            mapGroup.selectAll(".mapPath")
            .attr("fill",(d,i)=>{
                let distribution = distributions[i];
                
                let distSize = distribution.length;
                let index = getRandomInt(0,distSize);
                
                return color(distributions[i][index]);
            });
		}
		if(i==(9)){
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

d3.csv('./data/results.csv').then(function(scalarData){
    //debugger
    parseScalarData(scalarData);

    d3.json('./data/rio.geojson').then(function(data){
        // //
        // let contiguousStates = ["Alabama", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];
        // debugger
        // data.features = data.features.filter(d=>contiguousStates.indexOf(d.properties.name) > 0);
        // console.log(data)
        mapData = data;

        
        //
        let projection = d3.geoMercator()
            .fitSize([900, 900], mapData);//make it fit on the screen
        let pathGenerator = d3.geoPath().projection(projection);
        //
        plotBaseMap(projection, pathGenerator);
        
        if(mapMode == "glyph")
            positionGlyphs(projection, pathGenerator);
        else if(mapMode == "animation")
            drawAnimation();
        //plotDistributions();    
    });    
})

