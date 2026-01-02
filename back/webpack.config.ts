const swcDefaultConfig = require("@nestjs/cli/lib/compiler/defaults/swc-defaults").swcDefaultsFactory().swcOptions;

export default {
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: "swc-loader",
                    options: swcDefaultConfig,
                },
            },
        ],
    },
};
