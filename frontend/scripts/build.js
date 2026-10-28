process.env.NODE_ENV = 'production';
process.env.BUILD_PATH = 'dist';
require('react-scripts/config/env');
const value = process.env.REACT_APP_API_URL;
const { validateApiOrigin } = require('./validate-api-origin');
process.env.REACT_APP_API_URL = validateApiOrigin(value);
require('react-scripts/scripts/build');
