import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Настройки для загрузки больших файлов
  serverExternalPackages: [],
  
  // Настройки для статических файлов
  staticPageGenerationTimeout: 1000, // 1000 секунд
  
  // Настройки для сборки
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Увеличиваем лимит для клиентской части
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
