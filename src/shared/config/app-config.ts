/**
 * Конфигурация приложения
 */

export const appConfig = {
  name: 'Hackaton LCT Frontend',
  version: '0.1.0',
  environment: process.env.NODE_ENV || 'development',
} as const;
