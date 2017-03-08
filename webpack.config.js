const webpack = require('webpack');

module.exports = {
    entry: './client/index.js',
    output: {
        path: './client',
        filename: '_bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: 'node_modules'
                // include: 'node_modules/jquery'
            }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
        })
    ]
};
