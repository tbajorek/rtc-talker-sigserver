const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

const root = require('app-root-path');

const includePaths = [
    fs.realpathSync(__dirname + '/src'),
];

const namedPlugin = new webpack.NamedModulesPlugin();

const definePlugin = new webpack.DefinePlugin({
    __LOCALE_DIR__: JSON.stringify(`${root}/src/locale`),
    __VERSION__: JSON.stringify('1.0.0'),
});

const config = {
    entry: ['./src/index.js'],
    output: {
        path: path.resolve('./build'),
        filename: 'server.js',
    },
    target: 'node',
    plugins: [
        namedPlugin, definePlugin, new webpack.IgnorePlugin(/vertx/),
    ],
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                include: includePaths,
                use: {
                    loader: 'babel-loader',
                    query: {
                        presets: ['@babel/env'],
                        plugins: [
                            ['babel-plugin-transform-builtin-extend', {
                                globals: ['Error', 'Array'],
                            }],
                        ],
                    },
                },
            },
        ],
    },
};

module.exports = config;
