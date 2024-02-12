const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/PhotoFrame.ts',
    plugins: [
        new HtmlWebpackPlugin({title: 'Digitaler Bilderrahmen'}),
        new CopyPlugin({patterns: [{ from: "static", to: "api/pwdman" }]}),        
    ],
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, './dist'),
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.png$/i,
                type: 'asset/resource'
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    }    
};