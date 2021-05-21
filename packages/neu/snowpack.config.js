// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

// @ts-check

const fs = require('fs')

const isDesktop =
  process.env.NODE_ENV !== 'development' && !process.env.BASE_URL

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    src: '/',
    'backup/neu': {
      url: '/neu',
      static: true,
      resolve: false,
    },
  },
  plugins: ['@snowpack/plugin-sass'],
  packageOptions: {
    /* ... */
  },
  devOptions: {
    port: 4567,
  },
  buildOptions: {
    out: 'public',
  },
  env: {
    __LoadSearch__: isDesktop
      ? ''
      : fs.readFileSync('../nodejs/assets/search.yaml', 'utf-8'),
    __LoadImage__: isDesktop
      ? ''
      : fs.readFileSync('../nodejs/assets/image.yaml', 'utf-8'),
    __BaseURL__: process.env.BASE_URL || '',
  },
}
