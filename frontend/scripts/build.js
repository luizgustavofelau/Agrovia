process.env.NODE_ENV = 'production';
process.env.BUILD_PATH = 'dist';
// Source maps expõem o código-fonte completo no servidor público.
if (!process.env.GENERATE_SOURCEMAP) process.env.GENERATE_SOURCEMAP = 'false';
require('react-scripts/config/env');
const value = process.env.REACT_APP_API_URL;
const { validateApiOrigin } = require('./validate-api-origin');
process.env.REACT_APP_API_URL = validateApiOrigin(value);
require('react-scripts/scripts/build');
