var util = require('util')
  , Transform = require('stream').Transform
  , libxml = require('libxmljs');

function OsmWriteStream (options) {
  if (!(this instanceof OsmWriteStream))
    return new OsmWriteStream(options);

  Transform.call(this, options);
}

util.inherits(OsmWriteStream, Transform);

OsmWriteStream.prototype._transform = function (el, encoding, done) {
  var el = JSON.parse(el.toString());
  var doc = new libxml.Document();
  var node = doc.node(el.type).attr(el.attrs);
  if (el.tags) {
    for (i = 0; i < el.tags.length; i++) {
      node.node('tag').attr(el.tags[i]).parent();
    }
  }
  if (el.nodes) {
    for (i = 0; i < el.nodes.length; i++) {
      node.node('nd').attr(el.nodes[i]).parent();
    }
  }
  var xml = doc.toString().split('\n');
  xml.splice(0,1);
  this.push(xml.join('\n'));
  done();
}

module.exports = OsmWriteStream;