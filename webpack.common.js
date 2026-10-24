const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: {
        app: "./src/app/index.tsx",
        "apps/encounters":
            "./src/apps/encounters/index.ts",
        "apps/calendar": "./src/apps/calendar/index.ts",
        "apps/map-editor": "./src/apps/map-editor/index.ts",
    },
    module: {
        rules: [
            { test: /\.(sa|sc|c)ss$/, use: ["css-loader", "sass-loader"] },
            { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
            { test: /\.js$/, enforce: "pre", use: "source-map-loader" },
        ],
    },
    output: {
        filename: "[name]/index.js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/apps/encounters/index.ejs",
            filename: "apps/encounters/index.html",
            chunks: ["apps/encounters"],
        }),
        new HtmlWebpackPlugin({
            template: "./src/app/index.html",
            filename: "index.html",
            chunks: ["app"],
        }),
        new HtmlWebpackPlugin({
            template: "./src/apps/calendar/index.ejs",
            filename: "apps/calendar/index.html",
            chunks: ["apps/calendar"],
        }),
        new HtmlWebpackPlugin({
            template: "./src/apps/map-editor/index.ejs",
            filename: "apps/map-editor/index.html",
            chunks: ["apps/map-editor"],
        }),
        ...[
            ["fantasy-calendar", "calendar"],
            ["encounter-difficulty-calculator", "encounters"],
            ["map-drawing-tool", "map-editor"],
        ].map(([previousPath, app]) => new HtmlWebpackPlugin({
            template: "./src/app/redirect.ejs",
            filename: `${previousPath}/index.html`,
            target: `../apps/${app}/`,
            chunks: [],
        })),
    ],
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
};
