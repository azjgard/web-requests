const path    = require('path');
const appPath = (p) => path.resolve(__dirname, 'app', p);

const entry = {
  background : appPath('background/backgroundController.js'),
  content    : appPath('content/contentController.js')
};

const outPath  = appPath('output');
const filename = '[name].js';

const output = {
  path : outPath,
  filename,
  publicPath: 'output'
};

const loaders = [
  { 
    test   : /\.css$/,
    loader : 'style-loader!css-loader'
  },
  {
    test : /\.xml$/,
    use  : 'raw-loader'
  },
  {
    test: /\.(jpe?g|png|gif|svg)$/i,
    use : [
      'url-loader?limit=10000',
      'img-loader'
    ]
  }
];

const modules = {
  loaders
};

module.exports = {
  entry  ,
  output ,
  module : modules
};

