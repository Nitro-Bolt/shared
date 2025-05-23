const path = require("path");
const glob = require('glob');
const entries = Object.create(null);

glob.sync('./src/**.ts').forEach(file => {
  const name = path.basename(file, '.ts');
  entries[name] = './' + file;
});

// Base config that applies to either development or production mode.
const config = {
  entry: entries,
  output: {
    library: "@nitrobolt/shared",
    libraryTarget: "commonjs2",
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  // Enable webpack-dev-server to get hot refresh of the app.
  devServer: {
    static: "./build",
  },
};

module.exports = (env, argv) => {
  if (argv.mode === "development") {
    // Set the output path to the `build` directory
    // so we don't clobber production builds.
    config.output.path = path.resolve(__dirname, "build");

    // Generate source maps for our code for easier debugging.
    // Not suitable for production builds. If you want source maps in
    // production, choose a different one from https://webpack.js.org/configuration/devtool
    config.devtool = "eval-cheap-module-source-map";
  }
  return config;
};