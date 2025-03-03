const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/'
  },
  devtool: 'source-map',
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist'),
      },
      {
        directory: path.join(__dirname, 'assets'),
        publicPath: '/assets',
        serveIndex: true,
      }
    ],
    compress: true,
    port: 8081,
    hot: true,
    historyApiFallback: true,
    proxy: {
      '/socket.io': {
        target: (process.env.SERVER_URL || 'http://localhost:3000'),
        ws: true,
        changeOrigin: true
      },
      '/api': {
        target: (process.env.SERVER_URL || 'http://localhost:3000'),
        changeOrigin: true
      }
    },
    devMiddleware: {
      writeToDisk: true
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets/models/*.glb', to: 'assets/models/[name][ext]' },
        { from: 'assets/**/*', to: '[path][name][ext]' }
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(glb|gltf|obj|mtl|json)$/i,
        type: 'asset/resource',
      },
    ],
  },
}; 