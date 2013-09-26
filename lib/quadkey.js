var ts = require("node-geospatial/lib/tile-system");

var quadtree = {};

quadtree.encode = function(coord, zoomLevel) {
  var pixelCoords = ts.latLonToPixelXY(coord.lat, coord.lon, zoomLevel);
  var tileCoords = ts.pixelXYToTileXY(pixelCoords.pixelX, pixelCoords.pixelY);
  
  return ts.tileXYToQuadKey(tileCoords.tileX, tileCoords.tileY, zoomLevel);
};