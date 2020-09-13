/*
 * CSS Cloud Storage browser.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const webpack = require("webpack");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const htmlPlugin = new HtmlWebPackPlugin({
  template: "./src/browser/index.html",
  filename: "./index.html",
  title: "CANcloud"
});

const definePlugin = new webpack.DefinePlugin({
  EDITOR: JSON.stringify({ offline: false })
});

const copyPlugin = new CopyWebpackPlugin([
  { from: "src/browser/customize-css/customize.css", to: "customize-css" }
]);

module.exports = {
  context: __dirname,
  entry: [path.resolve(__dirname, "src/browser/index.js")],
  output: {
    path: __dirname + "/site",
    filename: "js/[hash].js"
  },
  resolve: {
    extensions: [".js", ".jsx", ".less"]
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader"
          },
          {
            loader: "less-loader"
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader"
          }
        ]
      },
      {
        test: /\.(png|jpg|gif|svg|ico)$/,
        use: [
          {
            loader: "file-loader?limit=1024&name=images/[name].[ext]"
          }
        ]
      },
      {
        test: /\.svg/,
        use: {
          loader: "svg-url-loader",
          options: {}
        }
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg)/,
        use: [
          {
            loader: "url-loader?limit=1024&name=fonts/[name].[ext]"
          }
        ]
      }
    ]
  },
  node: {
    fs: "empty"
  },
  plugins: [htmlPlugin, copyPlugin, definePlugin],
  devServer: {
    historyApiFallback: true,
    contentBase: "./"
  }
};
