var Levelup = require('levelup')
  , Sublevel = require('level-sublevel')
  , fs = require('fs')
  , XmlStream = require('xml-stream')
  , quadtree = require('quadtree')
  , zlib = require('zlib');

var db = Sublevel(Levelup('./mydb'));
var qt = db.sublevel('qt');

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

  // Index tiles down to zoom level 16
  add({
    key: ''+qtree+'~'+ch.key, 
    value: ch.value, 
    type: 'put',
    prefix: qt,
    valueEncoding: 'json'
  });
}

db.pre('n', addQuadtreeIndex);

db.pre('w', function (ch, add) {
  var toAdd;
  for (i = 0; i < ch.value.nd.length; i++ ) {
    db.get('n' + ch.value.nd[i].$.ref, function (err, value) {
      if (err) return
      var val = JSON.parse(value);
      var coord = {
        lat: parseFloat(val.$.lat),
        lon: parseFloat(val.$.lon)
      };
      var precision = 16;
      var qtree = quadtree.encode(coord, precision);
      // Index tiles down to zoom level 16
      if (ch.key.match(/w/)) console.log(ch.key);
      toAdd = {
        key: ''+qtree+'~'+ch.key, 
        value: ch.value, 
        type: 'put',
        prefix: qt,
        valueEncoding: 'json'
      };
    });
  }
  add(toAdd);
});

var osmFile = process.argv.slice(2)[0];

var ws = db.createWriteStream({ type: 'put', valueEncoding: 'json' })

ws.on('error', function (err) {
  console.log('Oh my!', err)
});

ws.on('close', function () {
  console.log('Stream closed')
});

var rs = fs.createReadStream(osmFile);

var xml = new XmlStream(rs);

xml.collect('nd');

xml.on('updateElement: node', function (record) {
  ws.write( { key: record.$name.substr(0,1) + record.$.id, value: record } );
});

xml.on('updateElement: way', function (record) {
  count +=1;

  ws.write( { key: record.$name.substr(0,1) + record.$.id, value: record } );

  now = new Date().getTime();
  if (now - lastStart > 5000) {
    console.log( Math.floor(1000 * (count - lastCount) / (now - lastStart)) + '/sec', count);
    lastStart = now;
    lastCount = count;
  }

});

rs.on('end', function () {
  ws.end();
  var end = new Date().getTime();
  console.log("Took: ", end-start, "ms");
});

