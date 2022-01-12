let width = 1140;
let height = 800;
              /*
              let container = document.getElementById('div-map', { style: `width:${width}px;height:${height}px` });
              let map = L.map(container).setView([-15.793889	, -47.882778], 10);

              let osmLayer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',

                id: 'mapbox/streets-v11',
                tileSize: 512,
                zoomOffset: -1,
                accessToken: 'pk.eyJ1Ijoic2FuZHJvYm94IiwiYSI6ImNrbGwxM2RkaTB5ZzQydW13NXh2MnBlaXAifQ.AJB9tRieYSpsqiTO7Nnn7A'
              }).addTo(map);
              */

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
      .fitSize([width, height], mapData);//make it fit on the screen     
        
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
        })
        .on("mouseover", function () {
          d3.select(this).attr("fill", "#F2F2F2");
        })
        .on("mouseout", function () {
          d3.select(this).attr("fill", "white");
        });

      //Centroids
      let centroids = mapData.features.map(d => [path.centroid(d), d.properties.ESTADO]);

      d3.select("svg")
        .selectAll("circle")
        .data(centroids)
        .enter()
        .append("circle")
        .attr("cx", d => d[0][0])
        .attr("cy", d => d[0][1])
        .attr("r", 3)
        .attr("fill", "gray");
    }