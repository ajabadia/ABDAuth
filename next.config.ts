import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './src/i18n/request.ts'
);

const nextConfig: NextConfig = {
  transpilePackages: ['@abd/ecosystem-widgets', '@abd/styles', '@abd/satellite-sdk'],
  /* industrial config */
};

export default withNextIntl(nextConfig);
