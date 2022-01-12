let width = 1920;
let height = 1080;

let container = document.getElementById('mapid', { style: `width:${width}px;height:${height}px` });
let map = L.map(container).setView([-15.793889	, -47.882778], 10);

let osmLayer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',

  id: 'mapbox/streets-v11',
  tileSize: 512,
  zoomOffset: -1,
  accessToken: 'pk.eyJ1Ijoic2FuZHJvYm94IiwiYSI6ImNrbGwxM2RkaTB5ZzQydW13NXh2MnBlaXAifQ.AJB9tRieYSpsqiTO7Nnn7A'
}).addTo(map);

let BrazilStates = undefined;
d3.json("brasil_estados.json") 
  .then(function (data) {
    BrazilStates = data;
    let BrazilStatesLayer = L.geoJson(BrazilStates, { //instantiates a new geoJson layer using built in geoJson handling
      weight: 1, //Attributes of polygons including the weight of boundaries and colors of map.
      color: "red",
    }).bindPopup(function (Layer) { //binds a popup when clicking on each polygon to access underlying data
      return Layer.feature.properties.ESTADO;
    }).addTo(map); //Adds the layer to the map.

    map.fitBounds(BrazilStatesLayer.getBounds()); //finds bounds of polygon and automatically gets map view to fit (useful for interaction and not having to 'cook' the map zoom and coordinates as in map instantiation
    // d3.select("svg").append("g").attr("id", "groupCircles");

    proj = d3.geoMercator().fitSize([width - 150, height - 150], BrazilStates);//make it fit on the screen     
    
  //gerador de caminhos que vai converter os objetos geojson em caminhos do SVG
  var path = d3.geoPath().projection(proj);
    
  //Centroids
  let centroids = BrazilStates.features.map(d => [path.centroid(d), d.properties.ESTADO]);

  d3.select("svg")
    .selectAll("circle")
    .data(centroids)
    .enter()
    .append("circle")
    .attr("cx", d => d[0][0]-80)
    .attr("cy", d => d[0][1]+60)
    .attr("r", 5)
    .attr("fill", "purple");

  })