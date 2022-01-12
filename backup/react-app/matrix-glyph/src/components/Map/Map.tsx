/*
Author: Eli Elad Elrom
Website: https://EliElrom.com
License: MIT License
Component: src/component/Map/Map.tsx

Created with;
$ npx generate-react-cli component Map --type=d3

*/

import React, { useState, useEffect, RefObject } from 'react'
import './Map.scss'
import * as d3 from 'd3' // yarn add d3 @types/d3

const WIDTH = 800
const HEIGHT = 800

const Map = () /* or ( props : IMapProps ) */ => {
  const [myState, setMyState] = useState<Boolean>(true)
  const ref: RefObject<HTMLDivElement> = React.createRef()

  useEffect(() => {
    draw()
  })
  d3.json('https://raw.githubusercontent.com/nivan/data/master/brasil_estados.json')
    .then((data)=>{
      d3.select('svg').append('g').attr('id', 'groupCircles')
      drawMap(data)
    })

  const drawMap = (d) => {
    const proj = d3.geoMercator().fitSize([WIDTH, HEIGHT], d)
    const path = d3.geoPath().projection(proj)
    const colorScale = d3.scaleLinear().domain([0, 10]).range([]);


    d3.select('svg')
      .selectAll('path')
      .data(d.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('stroke', 'black')
      .attr('fill', (d) => {
        return colorScale(Math.random()*10);
      })
  }

  const draw = () => {
    d3.select(ref.current).append('p').text('Hello World')
    d3.select('svg')
      .append('g')
      .attr('transform', 'translate(250, 0)')
      .append('rect').attr('width', 500)
      .attr('height', 500)
      .attr('fill', 'tomato')
  }

  return (
    <div className="Map" ref={ref}>
      <svg width="500" height="500">
        <g transform="translate(0, 0)">
          <rect width="500" height="500" fill="green" />
        </g>
      </svg>
    </div>
  )
}

/*
interface IMapProps {
  // TODO
}
*/

export default Map
