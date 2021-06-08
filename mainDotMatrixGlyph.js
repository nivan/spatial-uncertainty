let svg = d3.select("body")
    .append("svg")
    .attr("width",800)
    .attr("height",400);

let distribution = d3.range(1000).map(d=>Math.random());

let values = d3.range(20)
	.map(d=>distribution[getRandomInt(0,distribution.length)]).sort((a,b)=>(a-b));

arrayDotGlyph(values,4,5,svg,"Test",100,100,10,10);

arrayDotGlyph(values,1,20,svg,"Test2",150,30,10,150);

arrayDotGlyph(values,2,10,svg,"Test2",150,30,10,180);
