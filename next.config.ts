import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './src/i18n/request.ts'
);

const nextConfig: NextConfig = {
  transpilePackages: ['@ajabadia/ecosystem-widgets', '@ajabadia/styles', '@ajabadia/satellite-sdk'],
};

export default withNextIntl(nextConfig);
