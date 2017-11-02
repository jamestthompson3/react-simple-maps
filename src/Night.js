// Based on Mike Bostock's Solar Terminator
// http://bl.ocks.org/mbostock/4597134
import React, { Component } from 'react'
import calculateSolarPosition from './utils'
import {
  geoPath,
  geoCircle
} from 'd3-geo'

class Night extends Component {
  constructor() {
    super()
    this.state = {
      renderNight: false,
      nightPath: '',
      circlePath: ''
    }
    this.renderNight = this.renderNight.bind(this)
  }

  componentDidMount() {
    this.renderNight()
  }
  renderNight(){
    const { projection } = this.props
    const circle = geoCircle().angle(90).origin(calculateSolarPosition())
    const path = geoPath().projection(projection)

    this.setState({
      renderNight: true,
      nightPath: path,
      circlePath: circle
    })
  }
  shouldComponentUpdate(nextProps) {
    return nextProps.disableOptimization
  }
  render() {
    const {
      style,
      fill,
      stroke,
      nightFill
    } = this.props
    return this.state.renderNight && (
      <g className="rsm-night">
        <path
          fill={fill}
          stroke={stroke}
          d={this.state.nightPath}
          style={style}
        />
        <path
          fill={nightFill}
          stroke={stroke}
          d={this.state.circlePath}
          style={style}
        />
      </g>

    )
  }
}

Night.defaultProps = {
  componentIdentifier: 'Night',
  disableOptimization: true,
  stroke: '#000',
  fill: 'rgb(0,0,0,0.35)',
  style: {
    pointerEvents: 'none'
  }
}

export default Night
