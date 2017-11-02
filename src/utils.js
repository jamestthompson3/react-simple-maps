
import React from "react"
import { utcDay } from 'd3-time'

export function replaceStrokeWidth(styles) {
  let newStyles = {}
  Object.keys(styles).map((key, i) => {
    if(key === "strokeWidth") newStyles[key] = "inherit"
    else newStyles[key] = styles[key]
  })
  return newStyles
}

export function createChoroplethStyles(styles, choroplethValue) {
  if(choroplethValue) {
    let newStyles = {}
    Object.keys(styles).map((key, i) => {
      if(key === "fill") newStyles[key] = choroplethValue.value
      else newStyles[key] = styles[key]
    })
    return newStyles
  }
  else {
    return styles
  }
}

export function calculateResizeFactor(actualDimension, baseDimension) {
  return 1 / 100 * (100 / actualDimension * baseDimension)
}

export function calculateMousePosition(direction, projection, props, zoom, resizeFactor, center = props.center, width = props.width, height = props.height) {
  const reference = { x: 0, y: 1 }
  const reverseRotation = projection().rotate().map(item => -item)
  return (projection().rotate(reverseRotation)([-center[0],-center[1]])[reference[direction]] - (reference[direction] === 0 ? width : height) / 2) * zoom * (1/resizeFactor)
}

export function isChildOfType(child, expectedType) {
  return child.props.componentIdentifier === expectedType
}

export function createNewChildren(children, props) {
  if (!children) return
  if (!children.length) {
    return isChildOfType(children, "Geographies") ? React.cloneElement(children, {
      projection: props.projection,
    }) : (isChildOfType(children, "Markers") || isChildOfType(children, "Annotations") || isChildOfType(children, "Annotation") || isChildOfType(child, "Graticule") ?
    React.cloneElement(children, {
      projection: props.projection,
      zoom: props.zoom,
    }) : children)
  }
  else {
    return children.map((child, i) => {
      if (!child) return
      return isChildOfType(child, "Geographies") ?
        React.cloneElement(child, {
          key: `zoomable-child-${i}`,
          projection: props.projection,
        }) : (isChildOfType(child, "Markers") || isChildOfType(child, "Annotations") || isChildOfType(child, "Annotation") || isChildOfType(child, "Graticule") ?
        React.cloneElement(child, {
          key: `zoomable-child-${i}`,
          projection: props.projection,
          zoom: props.zoom,
        }) : child)
    })
  }
}

export function roundPath(path, precision) {
  if (!path) return
  const query = /[\d\.-][\d\.e-]*/g
  return path.replace(query, n => Math.round(n * (1/precision)) / (1/precision))
}

export function createConnectorPath(connectorType, endPoint, curve) {
  const e0 = endPoint[0]
  const e1 = endPoint[1]
  return `M0,0 Q ${(curve + 1) / 2 * e0},${e1-((curve + 1) / 2 * e1)} ${e0},${e1}`
}

export function createTextAnchor(dx) {
  if (dx > 0)
    return "start"
  else if (dx < 0 )
    return "end"
  else
    return "middle"
}

export function calculateSolarPosition() {
  const π = Math.PI
  const radians = π / 180
  const degrees = 180 / π

  const antipode = position => [position[0] + 180, -position[1]]

  const  solarPosition = time => {
    const centuries = (time - Date.UTC(2000, 0, 1, 12)) / 864e5 / 36525 // since J2000
    const longitude = (utcDay.floor(time) - time) / 864e5 * 360 - 180
    return [
      longitude - equationOfTime(centuries) * degrees,
      solarDeclination(centuries) * degrees
    ]
  }

  // Equations based on NOAA’s Solar Calculator all angles in radians.
  // http://www.esrl.noaa.gov/gmd/grad/solcalc/

  const equationOfTime = centuries => {
    const e = eccentricityEarthOrbit(centuries)
    const m = solarGeometricMeanAnomaly(centuries)
    const l = solarGeometricMeanLongitude(centuries)
    let y = Math.tan(obliquityCorrection(centuries) / 2)
    y *= y
    return y * Math.sin(2 * l)
        - 2 * e * Math.sin(m)
        + 4 * e * y * Math.sin(m) * Math.cos(2 * l)
        - 0.5 * y * y * Math.sin(4 * l)
        - 1.25 * e * e * Math.sin(2 * m)
  }

  const solarDeclination = centuries => Math.asin(Math.sin(obliquityCorrection(centuries)) * Math.sin(solarApparentLongitude(centuries)))

  const solarApparentLongitude = centuries => solarTrueLongitude(centuries) - (0.00569 + 0.00478 * Math.sin((125.04 - 1934.136 * centuries) * radians)) * radians

  const solarTrueLongitude = centuries => solarGeometricMeanLongitude(centuries) + solarEquationOfCenter(centuries)

  const solarGeometricMeanAnomaly = centuries =>(357.52911 + centuries * (35999.05029 - 0.0001537 * centuries)) * radians

  const solarGeometricMeanLongitude = centuries => {
    const l = (280.46646 + centuries * (36000.76983 + centuries * 0.0003032)) % 360
    return (l < 0 ? l + 360 : l) / 180 * π
  }

  const solarEquationOfCenter = centuries => {
    const m = solarGeometricMeanAnomaly(centuries)
    return (Math.sin(m) * (1.914602 - centuries * (0.004817 + 0.000014 * centuries))
        + Math.sin(m + m) * (0.019993 - 0.000101 * centuries)
        + Math.sin(m + m + m) * 0.000289) * radians
  }

  const obliquityCorrection = centuries => meanObliquityOfEcliptic(centuries) + 0.00256 * Math.cos((125.04 - 1934.136 * centuries) * radians) * radians

  const meanObliquityOfEcliptic = centuries => (23 + (26 + (21.448 - centuries * (46.8150 + centuries * (0.00059 - centuries * 0.001813))) / 60) / 60) * radians

  const eccentricityEarthOrbit = centuries => 0.016708634 - centuries * (0.000042037 + 0.0000001267 * centuries)

  return antipode(solarPosition(new Date))
}
