var fs = require('fs');
var path = require('path')

if (fs.existsSync(path.join(__dirname, 'build'))) {
  module.exports = require('./build');
} else if (fs.existsSync(path.join(__dirname, 'src'))) {
  module.exports = require('./src');
} else {
  throw new Error('Neither build nor src versions of node-ddd are available');
}
