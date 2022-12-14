let canvasWidth = 900;
let canvasheight = 850;

    // Lendo Arquivo
    let mapData = undefined;
    d3.json("brasil_estados.json")
      .then(function (data) {
        mapData = data;
        setInterface();
        loadScoreData();
      })

    var proj = d3.geoMercator();

    //seta os eventos
    function setInterface() {
      //set evento de mudança do valor do slider
      d3.select("svg").append("g").attr("id", "groupCircles");
      drawData();
    }

    function drawData() {
      
      proj = d3.geoMercator()
      .fitSize([canvasWidth, canvasheight], mapData);//make it fit on the screen     
        
      //gerador de caminhos que vai converter os objetos geojson em caminhos do SVG
      var path = d3.geoPath()
        .projection(proj);

      //create projection
      let colorScale = d3.scaleLinear().domain([0, 10]).range(["#fff", "#fff"]);
      //
      d3.select("svg")
        .selectAll("path")
        .data(mapData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "black")
        .attr("fill", function (d) {
          return colorScale(Math.random() * 10);
        });

      // centroids
      let centroids = mapData.features.map(d => [path.centroid(d), d.properties.UF]);

      d3.select("svg")
      .selectAll("circle")
      .data(centroids)
      .enter()
      .append("circle")
      .attr("cx",d=>d[0][0])
      .attr("cy",d=>d[0][1])
      .attr("r",5)
      .attr("id", d=> "circ-"+d[1])
      .attr("fill","gray");

    }