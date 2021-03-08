let mapData = undefined;
let distributions = {};
let width = 1000;
let height = 800;
let svg = d3.select("body")
    .append("svg")
    .attr("width",width)
    .attr("height",height);
let mapGroup = d3.select("svg").append("g").attr("transform","translate(150,0)");
let listColors = d3.schemeYlOrRd[9];
let color = d3.scaleQuantize().domain([0.05,37.34]).range(listColors);

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
        
        let lines = mapGroup.selectAll("line")
                    .data(edges)
                    .enter()
                    .append("line")
                    .style("stroke", "#ccc")
                    .style("stroke-width", 1);
        
        //Every time the simulation "ticks", this will be called
        force.on("tick", function() {    
            //
                        lines.attr("x1", function(d) { return d.source.x; })
                        .attr("y1", function(d) { return d.source.y; })
                        .attr("x2", function(d) { return d.target.x; })
                        .attr("y2", function(d) { return d.target.y; });
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
    .attr("d", pathGenerator)
    .attr("stroke","black")
    .attr("fill",'white');
}

function plotGlyphs(positions){

    d3.select("#glyphGroup").remove();
    let glyphGroup = mapGroup.append("g").attr("id","glyphGroup");

    let ww = 75;
    let hh = 75;
    
    positions.forEach((center,i)=>{
        arrayDotGlyph(distributions[i],4,5,glyphGroup,color,"Test"+i,50,50,center[0]-ww/2,center[1]-hh/2);    
    });
    
}

d3.csv('./data/results.csv').then(function(scalarData){
    for(let i = 0 ; i < 18 ; ++i)
        distributions[i] = [];

    scalarData.forEach(element => {
        let index = +element.index_right;
        distributions[index].push(+element.average);
    });

    d3.json('./data/rio.geojson').then(function(data){
        //
        mapData = data;
        //
        let projection = d3.geoMercator()
            .fitSize([800, 800], mapData);//make it fit on the screen
        let pathGenerator = d3.geoPath().projection(projection);
        //
        plotBaseMap(projection, pathGenerator);
        positionGlyphs(projection, pathGenerator);
        legend(350,180,svg,color,'sequential','Preciptation','legend');
        //plotDistributions();    
    });    
})

