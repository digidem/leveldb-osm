var levelup = require('levelup')
  , XMLWriter = require('xml-writer');
  
// 1) Create our database, supply location and options.
//    This will create or open the underlying LevelDB store.
var db = levelup('./mydb');

db.createReadStream()
  .on('data', function (data) {
    var val = JSON.parse(data.value);
    var xw = new XMLWriter;
    xw.startElement(val.tag);
    var keys = Object.keys(val.attrs);
    for ( var i = 0; i < keys.length; i++ ) {
       xw.writeAttribute(keys[i], val.attrs[keys[i]]);
    }
    val = val.children;
    if (val) {
      for ( var i = 0; i < val.length; i++ ) {
         xw.startElement(val[i].tag);
         keys = Object.keys(val[i].attrs);
         for ( var j = 0; j < keys.length; j++ ) {
           xw.writeAttribute(keys[j], val[i].attrs[keys[j]]);
         }
         xw.endElement();
      }
    }
    console.log(xw.toString())
  })
  .on('error', function (err) {
    console.log('Oh my!', err)
  })
  .on('close', function () {
    console.log('Stream closed')
  })
  .on('end', function () {
    console.log('Stream closed')
  });