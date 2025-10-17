const webpack = require('webpack');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  webpack: (config) => {
    // Alias 'process' to the browser polyfill
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      process: 'process/browser',
    };
    // Fallbacks for node core modules some deps may try to use
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      '@react-native-async-storage/async-storage': false,
      fs: false,
      net: false,
      tls: false,
      buffer: require.resolve('buffer/'),
    };
    // Provide Buffer global
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    );
    return config;
  },
};

module.exports = nextConfig;
