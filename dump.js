var levelup = require('levelup')
  , OsmWriteStream = require('./lib/osm-write-stream');
  
// 1) Create our database, supply location and options.
//    This will create or open the underlying LevelDB store.
var db = levelup('./mydb');

var ws = new OsmWriteStream();

var rs = db.createValueStream();

rs.pipe(ws).pipe(process.stdout);