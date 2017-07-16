var path = require("path");

var HtmlWebpackPlugin = require("html-webpack-plugin");
var ProvidePlugin = require("webpack").ProvidePlugin;


/*
 * The portal is a single page React application that uses
 * ReactRouter to show the correct view to the user based
 * on the current URI.
 *
 * This is fine when starting from the root page and navigating
 * around the app but it means that links reference pages that
 * are not backed by anything server side.
 *
 * When using NGINX to serve static files we could use the try_files
 * directive to return the same HTML file.
 * Caddy does not support this (although rewrite states it does it,
 * it actually returns a 301 to the user).
 *
 * Since we are already using HtmlWebpackPlugin to render the
 * index page we can also use it to render multiple pages that
 * are actually identical and allows are signle page app to be
 * more then one page.
 */
var pages = [
  "index.html",
  "login.html",
  "profile.html"
].map((page) => {
  return new HtmlWebpackPlugin({
    // TODO(stefano): favicon: './images/favicon.png',
    filename: page,
    title: "AuthGateway Portal",
    template: "index.ejs"
  });
});


module.exports = {
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js"
  },

  devtool: "cheap-module-source-map",
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: "babel-loader"
      }
    }, {
      test: /\.css$/,
      use: [
        "style-loader",
        "css-loader"
      ]
    }, {
      test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
      use: [
        "file-loader"
      ]
    }]
  },

  plugins: [
    new ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      Tether: "tether"
    }),
  ].concat(pages)
};
