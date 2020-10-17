const dotenv = require('dotenv').config();
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const postcssNormalize = require('postcss-normalize');
const nodeExternals = require('webpack-node-externals');

const INLINE_IMG_SIZE_LIMIT_BYTES = 10000;
const postcssLoader = {
    // Adds vendor prefixing based on specified browser support (browserslist) in package.json
    loader: 'postcss-loader',
    options: {
        ident: 'postcss',
        plugins: () => [
            require('postcss-flexbugs-fixes'),
            require('postcss-preset-env')({
                autoprefixer: {
                    flexbox: 'no-2009',
                },
                stage: 3,
            }),
            postcssNormalize(),
        ],
    },
};

module.exports = function(env, argv) {
    const isDev = !env.production;
    const isProd = !!env.production;
    const isServer = env.platform === 'server';
    const isClient = env.platform === 'client';
    const publicPath = '';

    const imgUrlLoaderOptions = {
        // images smaller than this size will be inlined in the bundle instead of requiring a request for the image
        limit: INLINE_IMG_SIZE_LIMIT_BYTES,
        name: 'media/[name].[contenthash:8].[ext]',
    }
    // Do not write image files for server bundle, but still maintain the same url or inline them if small enough (above config)
    if (isServer) {
        imgUrlLoaderOptions.fallback = 'file-loader';
        imgUrlLoaderOptions.emitFile = false;
    }

    const outputFilename = isServer ? 'server.js' : (isProd ? 'js/[name].[contenthash:8].js' : 'js/client.js');
    const outputChunkFilename = isClient ? (isProd ? 'js/[name].[contenthash:8].chunk.js' : 'js/[name].chunk.js') : '[id].js';

    const config = {
        entry: isServer ? './src/server/index.tsx' : ['react-hot-loader/patch', './src/client/index.tsx'],
        output: {
            path: path.resolve(__dirname, isClient ? 'build/public' : 'build'),
            filename: outputFilename,
            chunkFilename: outputChunkFilename,
            publicPath: publicPath,
        },
        mode: isProd ? 'production' : 'development',
        bail: isProd,
        devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.json'],
        },
        target: isServer ? 'node' : 'web',
        watch: isDev && isServer,
        module: {
            rules: [
                {
                    test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                    loader: 'url-loader',
                    options: imgUrlLoaderOptions,
                },
                {
                    test: /\.(ts|js)x?$/,
                    exclude: path.resolve(__dirname, 'node_modules/'),
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [ ['@babel/preset-env', { targets: isServer ? { node: 'current' } : {} }], '@babel/preset-react', '@babel/preset-typescript'],
                            plugins: [
                                "@babel/plugin-proposal-class-properties",
                                "@babel/plugin-proposal-optional-chaining",
                                isServer && [
                                    "babel-plugin-transform-remove-imports", {
                                      "test": "\\.(scss|sass|css)$"
                                    }
                                ], // Needed to ignore style imports for bundling server code
                                isClient && 'react-hot-loader/babel',
                            ].filter(item => !!item),
                            compact: isProd,
                            ignore: [
                                "**/*.d.ts",
                                "**/*.test.tsx"
                            ]
                        },
                    },
                },
                isClient && {
                    test: /\.css$/,
                    use: [
                        isDev && 'style-loader',
                        {
                            loader: MiniCssExtractPlugin.loader,
                            options: { hmr: isDev },
                        },
                        {
                            loader: 'css-loader',
                            options: { importLoaders: 1 },
                        },
                        postcssLoader,
                    ].filter(item => !!item),
                },
                {
                    test: /\.svg$/,
                    use: ['@svgr/webpack'],
                }
            ].filter(item => !!item)
        },
        optimization: {
            minimize: isProd && isClient,
            minimizer: [
                // These are only used for client in production mode
                new TerserPlugin({ sourceMap: true }),
                new OptimizeCSSAssetsPlugin({
                    cssProcessorOptions: {
                        parser: safePostCssParser,
                        map: {
                            // `inline: false` forces the sourcemap to be output into a
                            // separate file
                            inline: false,
                            // `annotation: true` appends the sourceMappingURL to the end of
                            // the css file, helping the browser find the sourcemap
                            annotation: true,
                        },
                    },
                    cssProcessorPluginOptions: {
                        preset: ['default', { minifyFontValues: { removeQuotes: false } }],
                    },
                }),
            ],
            // Automatically split vendor and commons
            splitChunks: isClient ? {
                chunks: 'all',
                name: false,
            } : false,
        },
        plugins: [
            // Copy contents of 'public' folder to 'build/public' except index.html which is handled by the html-webpack-plugin
            isClient && new CopyPlugin([
                { from: 'public/', to: '.', ignore: ['index.html'] }, // 'to' is relative to 'output.path'
            ]),
            // Generates an `index.html` file with the <script> injected.
            isClient && new HtmlWebpackPlugin(
                Object.assign(
                    {},
                    {
                        inject: true,
                        template: './public/index.html',
                    },
                    isProd ? {
                        minify: {
                            removeComments: true,
                            collapseWhitespace: true,
                            removeRedundantAttributes: true,
                            useShortDoctype: true,
                            removeEmptyAttributes: true,
                            removeStyleLinkTypeAttributes: true,
                            keepClosingSlash: true,
                            minifyJS: true,
                            minifyCSS: true,
                            minifyURLs: true,
                        },
                    } : undefined
                )
            ),
            isClient && new MiniCssExtractPlugin({
                filename: isDev ? 'css/[name].css' : 'css/[name].[contenthash:8].css',
                chunkFilename: isDev ? 'css/[name].chunk.css' : 'css/[name].[contenthash:8].chunk.css',
            }),
            isClient && isDev && new webpack.HotModuleReplacementPlugin(), // Required for css hot reloading
            isDev && new WatchMissingNodeModulesPlugin(path.resolve('node_modules')), // Rebuilds after an 'npm install'
        ].filter(item => !!item),
    };

    // Use hot dev server in dev for client
    if (isDev && isClient) {
        config.devServer = {
            host: '0.0.0.0',
            port: process.env.CLIENT_WDS_PORT,
            contentBase: 'public',
            contentBasePublicPath: publicPath,
            watchContentBase: true,
            publicPath,
            hot: true,
            historyApiFallback: true,
            clientLogLevel: 'error',
            writeToDisk: true,
            sockPort: process.env.CLIENT_WDS_PORT,
        }
    }

    if (isServer) {
        config.externals = [ nodeExternals() ]; // Prevent node_modules from being bundled
        // So node globals aren't mocked
        config.node = {
            __filename: false,
            __dirname: false,
        };

        if (isDev) {
            config.watchOptions = {
                // Add delay to build server files when watching since we want to allow time for any hot updates to reach the express server before we reload it.
                aggregateTimeout: 900, // default is 300
            }
        }
    }

    return config;
}