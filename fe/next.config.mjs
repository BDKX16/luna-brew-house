/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    typedRoutes: false,
  },
  webpack: (config) => {
    // Configuración de alias más robusta
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }

    config.resolve.alias["@"] = ".";

    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
