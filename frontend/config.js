// Calculate the number of unique case numbers
var caseStepGradient = {};
for (var county in casesData.CountyData) {
  var element = {};
  keysLength = Object.keys(casesData.CountyData[county].series).length;
  lastDayKey = Object.keys(casesData.CountyData[county].series)[keysLength - 1]
  element.color = '';
  caseStepGradient[casesData.CountyData[county].series[lastDayKey]] = element;
}

// Figure out number of step gradients https://jsfiddle.net/002v98LL/
function interpolateColor(color1, color2, factor) {
  if (arguments.length < 3) {
    factor = 0.5;
  }

  var result = color1.slice();
  for (var i = 0; i < 3; i++) {
    result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
  }

  return result;
};

function interpolateColors(color1, color2, steps) {
  var stepFactor = 1 / (steps - 1);
  var interpolatedColorArray = [];

  color1 = color1.match(/\d+/g).map(Number);
  color2 = color2.match(/\d+/g).map(Number);

  for (var i = 0; i < steps; i++) {
    interpolatedColorArray.push(interpolateColor(color1, color2, stepFactor * i));
  }

  return interpolatedColorArray;
}

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}


// Choose gradient steps from selections of http://web-tech.ga-usa.com/2012/05/creating-a-custom-hot-to-cold-temperature-color-gradient-for-use-with-rrdtool/index.html
rawColorArray = interpolateColors('rgb(255,220,0)', 'rgb(255,30,0)', Object.keys(caseStepGradient).length);

// Iterate through the colors, convert to hext, assign to caseStepGradient
var caseStepGradientKeys = Object.keys(caseStepGradient);
for (index = 0; index < rawColorArray.length; index++) {
  rgb = rgbToHex(rawColorArray[index][0], rawColorArray[index][1], rawColorArray[index][2]);
  caseStepGradient[caseStepGradientKeys[index]].color = rgb;
}
// console.log(JSON.stringify(caseStepGradient, null, 2));

// Create map instance https://www.amcharts.com/docs/v4/chart-types/map/
var chart = am4core.create('mapdiv', am4maps.MapChart);

// Set map definition
chart.geodata = am4geodata_region_usa_miLow;

// Set projection
chart.projection = new am4maps.projections.Miller();

// Disable resize, drag, and zoom
chart.seriesContainer.draggable = false;
chart.seriesContainer.resizable = false;
chart.maxZoomLevel = 1;

// Create map polygon series
var polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());

// Make map load polygon (like country names) data from GeoJSON
polygonSeries.useGeodata = true;
// console.log(chart.geodata);
// console.log(JSON.stringify(casesData, null, 2));

// Build the backing data object
var backingData = [];
for (index = 0; index < chart.geodata.features.length; index++) {
  // Iterate through the places
  place = chart.geodata.features[index].properties;
  var placeData = {};
  placeData.id = place.id;
  placeData.name = place.name;
  placeData.value = 0;

  // If there's a match with the data, add the value and fill
  for (var casePlace in casesData.CountyData) {
    if (casePlace == place.name) {
      keysLength = Object.keys(casesData.CountyData[casePlace].series).length;
      lastDayKey = Object.keys(casesData.CountyData[casePlace].series)[keysLength - 1];
      placeData.value = casesData.CountyData[casePlace].series[lastDayKey];
      placeData.fill = am4core.color(caseStepGradient[placeData.value].color);
    }
  }

  backingData.push(placeData);
}

polygonSeries.data = backingData;

// Configure series
var polygonTemplate = polygonSeries.mapPolygons.template;
polygonTemplate.tooltipText = '{name} : {value} cases';
polygonTemplate.fill = am4core.color('#D3D3D3');
polygonTemplate.propertyFields.fill = 'fill';

// Create chart instance https://www.amcharts.com/demos/simple-column-chart/
var chart = am4core.create('chartdiv', am4charts.XYChart);

// Handle moving state data back into chart
function loadStateChart() {
  // Add data
  var stateDataArray = [];
  for (var day in casesData.StateData.series) {
    var element = {};
    element.date = day.replace('2020-','').replace('-','/');
    element.cases = casesData.StateData.series[day];
    stateDataArray.push(element);
  }

  chart.data = stateDataArray;
  chartText = document.getElementById('scope');
  chartText.innerHTML = 'State-wide';
}

loadStateChart();

// Create axes
var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
categoryAxis.dataFields.category = 'date';
categoryAxis.renderer.grid.template.location = 0;
categoryAxis.renderer.minGridDistance = 30;
categoryAxis.renderer.labels.template.rotation = 90;
categoryAxis.renderer.labels.template.horizontalCenter = 'center';
categoryAxis.renderer.labels.template.verticalCenter = 'middle';
// categoryAxis.renderer.labels.template.disabled = true;

var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
valueAxis.min = 0;

// Create series
var series = chart.series.push(new am4charts.ColumnSeries());
series.dataFields.valueY = 'cases';
series.dataFields.categoryX = 'date';
series.name = 'Cases';
series.columns.template.tooltipText = '{categoryX}: [bold]{valueY}[/]';
series.columns.template.fillOpacity = 0.8;

var columnTemplate = series.columns.template;
columnTemplate.strokeWidth = 0;
columnTemplate.strokeOpacity = 1;
columnTemplate.fill = am4core.color('#FED8B1');

// Updated text
updateText = document.getElementById('update');
updateText.innerHTML = casesData.Updated;

// Click on county event
polygonSeries.mapPolygons.template.events.on('hit', function(ev) {
  if (typeof casesData.CountyData[ev.target.dataItem.dataContext.name] !== 'undefined') {
    var countyDataArray = [];
    for (var day in casesData.CountyData[ev.target.dataItem.dataContext.name].series) {
      var element = {};
      element.date = day.replace('2020-','').replace('-','/');
      element.cases = casesData.CountyData[ev.target.dataItem.dataContext.name].series[day];
      countyDataArray.push(element);
    }

    chart.data = countyDataArray;
    chartText = document.getElementById('scope');
    chartText.innerHTML = ev.target.dataItem.dataContext.name;
  }
});

// Click on state button
function stateView() {
  loadStateChart();
}
