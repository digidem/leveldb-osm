var Levelup = require('levelup')
  , Sublevel = require('level-sublevel')
  , fs = require('fs')
  , xml = require('big-xml')
  , quadtree = require('quadtree');

// 1) Create our database, supply location and options.
//    This will create or open the underlying LevelDB store.
var db = Sublevel(Levelup('./mydb'));
var qt = db.sublevel('qt');
var start = new Date().getTime();
var lastStart = start;
var count = 0;
var lastCount = 0;

var addQuadtreeIndex = function (ch, add) {
  var coord = {
    lat: parseFloat(ch.value.attrs.lat),
    lon: parseFloat(ch.value.attrs.lon)
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

//db.pre('n', addQuadtreeIndex);

var osmFile = process.argv.slice(2)[0];

var ws = db.createWriteStream({ type: 'put', valueEncoding: 'json' })

ws.on('error', function (err) {
  console.log('Oh my!', err)
});

ws.on('close', function () {
  console.log('Stream closed')
});

var rs = xml.createReader(osmFile, /^(node|way|relation)$/, { gzip: true });

rs.on('record', function (record) {
  count +=1;

  ws.write( { key: record.tag.substr(0,1) + record.attrs.id, value: record } );
  now = new Date().getTime();
  if (now - lastStart > 5000) {
    rs.pause();
    console.log('there will be no more data for 1 second');
    setTimeout(function() {
      console.log('now data will start flowing again');
      rs.resume();
    }, 1000);
    console.log( Math.floor(1000 * (count - lastCount) / (now - lastStart)) + '/sec')
    lastStart = now;
    lastCount = count;
  }
});

rs.on('end', function () {
  ws.end();
  var end = new Date().getTime();
  console.log("Took: ", end-start, "ms");
});

