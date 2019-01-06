const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/genpass.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index_bundle.js',
    sourceMapFilename: '[name].map',
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'genpass.html',
      template: 'src/template.html',
      inject: false,
    }),
  ],
  devtool: 'cheap-module-source-map',

  devServer: {
    port: 7777,
    stats: 'normal',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
          },
        },
      },
    ],
  },
  mode: 'development',
};
