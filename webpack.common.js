const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: {
        app: "./app/src/index.ts",
        "fantasy-calendar": "./fantasy-calendar/src/index.ts",
    },
    module: {
        rules: [
            { test: /\.(sa|sc|c)ss$/, use: ["css-loader", "sass-loader"] },
            { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
            { test: /\.js$/, enforce: "pre", use: "source-map-loader" },
        ],
    },
    output: {
        filename: "[name]/[name].bundle.js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./app/src/index.ejs",
            filename: "index.html",
            chunks: ["app"],
        }),
        new HtmlWebpackPlugin({
            template: "./fantasy-calendar/src/index.ejs",
            filename: "fantasy-calendar/index.html",
            chunks: ["fantasy-calendar"],
        }),
    ],
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
};
