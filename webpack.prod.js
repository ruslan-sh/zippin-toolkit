const { mergeWithRules } = require("webpack-merge");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const common = require("./webpack.common.js");

module.exports = mergeWithRules({
    module: {
        rules: {
            test: "match",
            use: "prepend",
        },
    },
})(common, {
    mode: "production",
    devtool: "source-map",
    module: {
        rules: [{ test: /\.(sa|sc|c)ss$/, use: [MiniCssExtractPlugin.loader] }],
    },
    optimization: {
        minimizer: [new CssMinimizerPlugin(), new TerserPlugin()],
    },
    plugins: [new MiniCssExtractPlugin({ filename: "[name]/[name].css" })],
});
