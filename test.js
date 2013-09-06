var Levelup = require('levelup')
  , Sublevel = require('level-sublevel')
  , XMLWriter = require('xml-writer');
  
// 1) Create our database, supply location and options.
//    This will create or open the underlying LevelDB store.
var db = Sublevel(Levelup('./mydb'));
var qt = db.sublevel('qt');

qt.createReadStream()
  .on('data', function (data) {
     if (data.key.match(/~n/g)) console.log(data.key)
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