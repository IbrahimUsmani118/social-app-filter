const createExpoWebpackConfigAsync = require('@expo/webpack-config')
const {withAlias} = require('@expo/webpack-config/addons')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
// const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')
// const {sentryWebpackPlugin} = require('@sentry/webpack-plugin') // Temporarily disabled
const {version} = require('./package.json')

const GENERATE_STATS = process.env.EXPO_PUBLIC_GENERATE_STATS === '1'
const OPEN_ANALYZER = process.env.EXPO_PUBLIC_OPEN_ANALYZER === '1'

const reactNativeWebWebviewConfiguration = {
  test: /postMock.html$/,
  use: {
    loader: 'file-loader',
    options: {
      name: '[name].[ext]',
    },
  },
}

module.exports = async function (env, argv) {
  let config = await createExpoWebpackConfigAsync(env, argv)
  config = withAlias(config, {
    'react-native$': 'react-native-web',
    'react-native-webview': 'react-native-web-webview',
    // Mock native modules for web builds
    'react-native-uitextview': require.resolve('./__mocks__/react-native-uitextview.js'),
    'expo-background-notification-handler': require.resolve('./__mocks__/expo-background-notification-handler.ts'),
    'expo-bluesky-shared-prefs': require.resolve('./__mocks__/expo-bluesky-shared-prefs.ts'),
    'expo-bluesky-visibility-view': require.resolve('./__mocks__/expo-bluesky-visibility-view.tsx'),
    'expo-platform-info': require.resolve('./__mocks__/expo-platform-info.ts'),
  })
  config.module.rules = [
    ...(config.module.rules || []),
    reactNativeWebWebviewConfiguration,
    // Suppress source map warnings for packages with missing source files
    {
      test: /\.js$/,
      enforce: 'pre',
      use: ['source-map-loader'],
      exclude: [
        /node_modules\/react-native-root-siblings/,
        /node_modules\/react-native-uitextview/,
        /node_modules\/.*\.js$/
      ]
    },
    // Optimize images
    {
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      type: 'asset',
      parser: {
        dataUrlCondition: {
          maxSize: 8 * 1024, // 8kb
        },
      },
    },
  ]
  
  // Add ignore patterns for webpack warnings
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /requireNativeComponent.*was not found/,
    /Module not found.*expo-background-notification-handler/,
    /Module not found.*expo-bluesky-shared-prefs/,
    /Module not found.*expo-bluesky-visibility-view/,
    /Module not found.*expo-platform-info/,
    /Native module.*not available/,
    /The native view manager.*isn't exported/
  ]
  if (env.mode === 'development') {
    config.plugins.push(new ReactRefreshWebpackPlugin())
  } else {
    // Support static CDN for chunks
    config.output.publicPath = 'auto'
    
    // Production optimizations
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            enforce: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
          },
          expo: {
            test: /[\\/]node_modules[\\/]expo[\\/]/,
            name: 'expo',
            chunks: 'all',
            priority: 15,
          },
        },
      },
      usedExports: true,
      sideEffects: false,
      minimize: true,
    }
    
    // Add compression and caching
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    }
  }

  // Bundle analyzer removed for optimization
  // if (GENERATE_STATS || OPEN_ANALYZER) {
  //   config.plugins.push(
  //     new BundleAnalyzerPlugin({
  //       openAnalyzer: OPEN_ANALYZER,
  //       generateStatsFile: true,
  //       statsFilename: '../stats.json',
  //       analyzerMode: OPEN_ANALYZER ? 'server' : 'json',
  //       defaultSizes: 'parsed',
  //     }),
  //   )
  // }
  // Temporarily disabled Sentry webpack plugin
  // if (process.env.SENTRY_AUTH_TOKEN) {
  //   config.plugins.push(
  //     sentryWebpackPlugin({
  //       org: 'blueskyweb',
  //       project: 'app',
  //       authToken: process.env.SENTRY_AUTH_TOKEN,
  //       release: {
  //         // fallback needed for Render.com deployments
  //         name: process.env.SENTRY_RELEASE || version,
  //         dist: process.env.SENTRY_DIST,
  //       },
  //     }),
  //   )
  // }
  return config
}
