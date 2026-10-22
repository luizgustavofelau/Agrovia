process.env.NODE_ENV = 'production';
process.env.BUILD_PATH = 'dist';
require('react-scripts/config/env');
const value = process.env.REACT_APP_API_URL;
if (!value || !/^https?:\/\//.test(value)) {
  throw new Error('Defina REACT_APP_API_URL no .env antes do build.');
}
require('react-scripts/scripts/build');
