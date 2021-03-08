function unpack(packedIndex, rows, cols){
    
    return [Math.floor(packedIndex/cols),(cols-1)-(packedIndex % cols)];
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

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

function arrayDotGlyph(distribution, numRows, numColumns, svgContainer, color, id, width, height, posX, posY,distMode='quantile'){
    let numSamples = numRows * numColumns;

    //
    let container = svgContainer.append("g");
	container.attr("id","glyph"+ id);
 
    //
    let centerX = posX + width/2.0;
    let centerY = posY + height/2.0;
    let slackness = 5;
    let adjustedCanvasWidth  = width  - 2*slackness;
    let adjustedCanvasHeight = height - 2*slackness;
    let canvasAdjustedX      = centerX - adjustedCanvasWidth/2.0;
    let canvasAdjustedY      = centerY - adjustedCanvasHeight/2.0;

    let sampleWidth  = adjustedCanvasWidth/numColumns;
    let sampleHeight = adjustedCanvasHeight/numRows;


    let values = [];
    
    if(distMode=='random'){
        for(let i = 0 ; i < numSamples ; ++i){
            let index = getRandomInt(0,distribution.length);
            values.push(distribution[index]);
        }
    }
    else if(distMode=='quantile'){
        for(let i = 0 ; i < numSamples ; ++i){
            values.push(math.quantileSeq(distribution,(1.0*i)/(numSamples-1)));
        }
    }
    
    values.sort((a,b)=>(b-a));//d3.range(numRows*numColumns)
	//.map(d=>distribution[getRandomInt(0,distribution.length)]).sort((a,b)=>(a-b));
    //debugger
    
    //
    //let color = d3.scaleLinear().domain([0,265,530]).range(['blue','white','red']);
    
    

    //
    let borderCanvas = container.append("rect")
	.attr("x",posX)
	.attr("y",posY)
	.attr("width",width)
	.attr("height",height)
	.attr("fill","white")
	.attr("stroke", "gray")
	.attr("stroke-width",slackness);

    
    //
    container.selectAll(".sample")
	.data(d3.zip(d3.range(numRows*numColumns),values))
	.enter()
	.append("rect")
	.attr("x",function(d){
	    let coords = unpack(d[0],numRows,numColumns);
	    return canvasAdjustedX+coords[1]*sampleWidth;
	})
	.attr("y",function(d){
	    let coords = unpack(d[0],numRows,numColumns);
	    return canvasAdjustedY+coords[0]*sampleHeight;
	})
	.attr("width",sampleWidth)
	.attr("height",sampleHeight)
	.attr("fill", (d,i)=>color(d[1]))
	.attr("stroke","black")
    ;
    
}
