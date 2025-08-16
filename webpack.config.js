const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/js/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        clean: true,
    },
    mode: 'production',
    devServer: {
        static: [
            {
                directory: path.resolve(__dirname, 'src/assets'),
                publicPath: '/assets',
            }
        ],
        hot: true,
        open: true,
        allowedHosts: 'all'
        // historyApiFallback: {
        //     rewrites: [
        //         { from: /^\/about\.html$/, to: '/about.html' },
        //         { from: /^\/contact\.html$/, to: '/contact.html' },
        //     ],
        // },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.css$/i,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: {
                                localIdentName: '[local]'
                            }
                        }
                    }
                ],
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/html/index.html',
            filename: 'index.html',
        }),
        new HtmlWebpackPlugin({
            template: './src/html/project.html',
            filename: 'project/index.html',
        }),
        new HtmlWebpackPlugin({
            template: './src/html/project.html',
            filename: 'about/index.html',
        }),
        new HtmlWebpackPlugin({
            template: './src/html/project.html',
            filename: 'publications/index.html',
        }),
        new HtmlWebpackPlugin({
            template: './src/html/project.html',
            filename: '404/index.html',
        }),
        new HtmlWebpackPlugin({
            template: './src/html/project.html',
            filename: '404.html',
        }),
        new HtmlWebpackPlugin({
            template: './src/html/cv-printable.html',
            filename: 'cv-printable/index.html',
            inject: false, // Do not inject any JS or CSS
        }),
    ],
};
