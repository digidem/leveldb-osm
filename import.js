var Levelup = require('levelup')
  , Sublevel = require('level-sublevel')
  , fs = require('fs')
  , Osm2Json = require('osm2json')
  , quadtree = require('quadtree')
  , zlib = require('zlib');

var db = Sublevel(Levelup('./mydb', {valueEncoding: 'json'}));
var qt = db.sublevel('qt', {valueEncoding: 'json'});

var start = new Date().getTime();
var lastStart = start;
var count = 0;
var lastCount = 0;

var addQuadtreeIndex = function (ch, add) {
  var coord = {
    lat: parseFloat(ch.value.$.lat),
    lon: parseFloat(ch.value.$.lon)
  };
  var precision = 16;
  var qtree = quadtree.encode(coord, precision);

  add({
    key: ''+qtree+'~'+ch.key, 
    value: ch.value, 
    type: 'put',
    prefix: qt,
  });
}

//db.pre('n', addQuadtreeIndex);
/*
db.pre('x', function (ch, add) {
  var toAdd;
  for (i = 0; i < ch.value.nd.length; i++ ) {
    db.get('n' + ch.value.nd[i].$.ref, function (err, value) {
      if (err) return

      var coord = {
        lat: parseFloat(value.$.lat),
        lon: parseFloat(value.$.lon)
      };
      var precision = 16;
      var qtree = quadtree.encode(coord, precision);

      qt.put(''+qtree+'~'+ch.key, ch.value);
    });
  }
});
*/

var osmFile = process.argv.slice(2)[0];

var ws = db.createWriteStream({ type: 'put', valueEncoding: 'json' })


ws._map = function(chunk) {
  var rec = JSON.parse(chunk.toString());
  return {
      type: this._type
    , key: rec.type.substr(0,1) + rec.attrs.id
    , value: rec
    , keyEncoding: rec.keyEncoding || this._options.keyEncoding
    , valueEncoding: rec.valueEncoding || this.encoding || this._options.valueEncoding
  }
}



ws.on('data', function (err) {
  console.log('Oh my!', err)
});

ws.on('close', function () {
  console.log('Stream closed')
});

var rs = fs.createReadStream(osmFile);
var gzip = zlib.createGunzip();
var osm = new Osm2Json();

rs.pipe(gzip).pipe(osm).pipe(ws);


osm.on('data', function (chunk) {
  count +=1;

  now = new Date().getTime();
  if (now - lastStart > 5000) {
    console.log( Math.floor(1000 * (count - lastCount) / (now - lastStart)) + '/sec', count);
    lastStart = now;
    lastCount = count;
  }

});


osm.on('end', function () {
  ws.end();
  var end = new Date().getTime();
  console.log("Took: ", end-start, "ms");
});

