const isProduction = process.env.NODE_ENV === 'production';
module.exports = {
  transpilePackages: ['@mdxeditor/editor', 'react-diff-view'],
  webpack: (config, { isServer }) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    if (!isServer) {
      config.resolve.fallback = {
        dns: false,
        net:false
      };
    }
    return config;
  },
  outputFileTracing: false,
  reactStrictMode: isProduction? true : false,
  swcMinify:false,
  eslint: {
    ignoreDuringBuilds: true,
  },
}