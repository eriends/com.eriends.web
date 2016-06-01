var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: ['./src/script/entry.js'],
	output: {
		path: path.join(__dirname, 'dist/script'),
		filename: '[name].bundle.js',
		chunkFilename: '[id].bundle.js'
	},
	module: {
    loaders: [
    //  { 
    //    test: /\.css$/, 
    //    loader: 'style-loader!css-loader?modules'
    //  },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('',  'css-loader')
      },
      { 
        test: /\.jsx$/, 
        loader: 'jsx-loader' 
      },
      { 
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },

  plugins: [
    new ExtractTextPlugin(path.join(__dirname, 'dist/style/[name].bundle.css') ,  {
      allChunks: true
    })
  ]
};
