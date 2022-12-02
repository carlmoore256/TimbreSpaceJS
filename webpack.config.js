const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './out/index.js',
    devtool: 'inline-source-map',
    devServer: {
        static: './dist',
    },
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new CopyPlugin({
            patterns: [
            { from: "assets", to: "assets" },
            // { from: "index.html", to: "index.html" },
            ],
        }),
        new HtmlWebpackPlugin({template: 'src/index.html'})
    ],
    // optimization: {
    //     runtimeChunk: 'single',
    // },
    // watch: true
};