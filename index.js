var fs = require('fs');
var path = require('path')

if (fs.existsSync(path.join(__dirname, 'dist'))) {
  module.exports = require('./dist');
} else if (fs.existsSync(path.join(__dirname, 'src'))) {
  module.exports = require('./src');
} else {
  throw new Error('Neither dist nor src versions of node-ddd are available');
}
