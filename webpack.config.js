const path = require('path');

module.exports = {
    entry: {
        backgroundScript: './src/backgroundScript.ts',
        cfInjectedScript: './src/cfInjectedScript.ts',
        atcoderInjectedScript: './src/atcoderInjectedScript.ts',
        csesInjectedScript: './src/csesInjectedScript.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    optimization: {
        runtimeChunk: false,
        splitChunks: {
            chunks: 'all'
        }
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
    devtool: 'inline-source-map'
};
