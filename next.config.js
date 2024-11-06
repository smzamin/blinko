const isProduction = process.env.NODE_ENV === 'production';
module.exports = {
  transpilePackages: ['@mdxeditor/editor', 'react-diff-view','highlight.js','remark-gfm'],
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
  reactStrictMode: isProduction? true : false,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
}