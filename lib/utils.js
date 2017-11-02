"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.replaceStrokeWidth = replaceStrokeWidth;
exports.createChoroplethStyles = createChoroplethStyles;
exports.calculateResizeFactor = calculateResizeFactor;
exports.calculateMousePosition = calculateMousePosition;
exports.isChildOfType = isChildOfType;
exports.createNewChildren = createNewChildren;
exports.roundPath = roundPath;
exports.createConnectorPath = createConnectorPath;
exports.createTextAnchor = createTextAnchor;
exports.calculateSolarPosition = calculateSolarPosition;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _d3Time = require("d3-time");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function replaceStrokeWidth(styles) {
  var newStyles = {};
  Object.keys(styles).map(function (key, i) {
    if (key === "strokeWidth") newStyles[key] = "inherit";else newStyles[key] = styles[key];
  });
  return newStyles;
}

function createChoroplethStyles(styles, choroplethValue) {
  if (choroplethValue) {
    var newStyles = {};
    Object.keys(styles).map(function (key, i) {
      if (key === "fill") newStyles[key] = choroplethValue.value;else newStyles[key] = styles[key];
    });
    return newStyles;
  } else {
    return styles;
  }
}

function calculateResizeFactor(actualDimension, baseDimension) {
  return 1 / 100 * (100 / actualDimension * baseDimension);
}

function calculateMousePosition(direction, projection, props, zoom, resizeFactor) {
  var center = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : props.center;
  var width = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : props.width;
  var height = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : props.height;

  var reference = { x: 0, y: 1 };
  var reverseRotation = projection().rotate().map(function (item) {
    return -item;
  });
  return (projection().rotate(reverseRotation)([-center[0], -center[1]])[reference[direction]] - (reference[direction] === 0 ? width : height) / 2) * zoom * (1 / resizeFactor);
}

function isChildOfType(child, expectedType) {
  return child.props.componentIdentifier === expectedType;
}

function createNewChildren(children, props) {
  if (!children) return;
  if (!children.length) {
    return isChildOfType(children, "Geographies") ? _react2.default.cloneElement(children, {
      projection: props.projection
    }) : isChildOfType(children, "Markers") || isChildOfType(children, "Annotations") || isChildOfType(children, "Annotation") || isChildOfType(child, "Graticule") ? _react2.default.cloneElement(children, {
      projection: props.projection,
      zoom: props.zoom
    }) : children;
  } else {
    return children.map(function (child, i) {
      if (!child) return;
      return isChildOfType(child, "Geographies") ? _react2.default.cloneElement(child, {
        key: "zoomable-child-" + i,
        projection: props.projection
      }) : isChildOfType(child, "Markers") || isChildOfType(child, "Annotations") || isChildOfType(child, "Annotation") || isChildOfType(child, "Graticule") ? _react2.default.cloneElement(child, {
        key: "zoomable-child-" + i,
        projection: props.projection,
        zoom: props.zoom
      }) : child;
    });
  }
}

function roundPath(path, precision) {
  if (!path) return;
  var query = /[\d\.-][\d\.e-]*/g;
  return path.replace(query, function (n) {
    return Math.round(n * (1 / precision)) / (1 / precision);
  });
}

function createConnectorPath(connectorType, endPoint, curve) {
  var e0 = endPoint[0];
  var e1 = endPoint[1];
  return "M0,0 Q " + (curve + 1) / 2 * e0 + "," + (e1 - (curve + 1) / 2 * e1) + " " + e0 + "," + e1;
}

function createTextAnchor(dx) {
  if (dx > 0) return "start";else if (dx < 0) return "end";else return "middle";
}

function calculateSolarPosition() {
  var π = Math.PI;
  var radians = π / 180;
  var degrees = 180 / π;

  var antipode = function antipode(position) {
    return [position[0] + 180, -position[1]];
  };

  var solarPosition = function solarPosition(time) {
    var centuries = (time - Date.UTC(2000, 0, 1, 12)) / 864e5 / 36525; // since J2000
    var longitude = (_d3Time.utcDay.floor(time) - time) / 864e5 * 360 - 180;
    return [longitude - equationOfTime(centuries) * degrees, solarDeclination(centuries) * degrees];
  };

  // Equations based on NOAA’s Solar Calculator all angles in radians.
  // http://www.esrl.noaa.gov/gmd/grad/solcalc/

  var equationOfTime = function equationOfTime(centuries) {
    var e = eccentricityEarthOrbit(centuries);
    var m = solarGeometricMeanAnomaly(centuries);
    var l = solarGeometricMeanLongitude(centuries);
    var y = Math.tan(obliquityCorrection(centuries) / 2);
    y *= y;
    return y * Math.sin(2 * l) - 2 * e * Math.sin(m) + 4 * e * y * Math.sin(m) * Math.cos(2 * l) - 0.5 * y * y * Math.sin(4 * l) - 1.25 * e * e * Math.sin(2 * m);
  };

  var solarDeclination = function solarDeclination(centuries) {
    return Math.asin(Math.sin(obliquityCorrection(centuries)) * Math.sin(solarApparentLongitude(centuries)));
  };

  var solarApparentLongitude = function solarApparentLongitude(centuries) {
    return solarTrueLongitude(centuries) - (0.00569 + 0.00478 * Math.sin((125.04 - 1934.136 * centuries) * radians)) * radians;
  };

  var solarTrueLongitude = function solarTrueLongitude(centuries) {
    return solarGeometricMeanLongitude(centuries) + solarEquationOfCenter(centuries);
  };

  var solarGeometricMeanAnomaly = function solarGeometricMeanAnomaly(centuries) {
    return (357.52911 + centuries * (35999.05029 - 0.0001537 * centuries)) * radians;
  };

  var solarGeometricMeanLongitude = function solarGeometricMeanLongitude(centuries) {
    var l = (280.46646 + centuries * (36000.76983 + centuries * 0.0003032)) % 360;
    return (l < 0 ? l + 360 : l) / 180 * π;
  };

  var solarEquationOfCenter = function solarEquationOfCenter(centuries) {
    var m = solarGeometricMeanAnomaly(centuries);
    return (Math.sin(m) * (1.914602 - centuries * (0.004817 + 0.000014 * centuries)) + Math.sin(m + m) * (0.019993 - 0.000101 * centuries) + Math.sin(m + m + m) * 0.000289) * radians;
  };

  var obliquityCorrection = function obliquityCorrection(centuries) {
    return meanObliquityOfEcliptic(centuries) + 0.00256 * Math.cos((125.04 - 1934.136 * centuries) * radians) * radians;
  };

  var meanObliquityOfEcliptic = function meanObliquityOfEcliptic(centuries) {
    return (23 + (26 + (21.448 - centuries * (46.8150 + centuries * (0.00059 - centuries * 0.001813))) / 60) / 60) * radians;
  };

  var eccentricityEarthOrbit = function eccentricityEarthOrbit(centuries) {
    return 0.016708634 - centuries * (0.000042037 + 0.0000001267 * centuries);
  };

  return antipode(solarPosition(new Date()));
}