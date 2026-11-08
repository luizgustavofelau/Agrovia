process.env.NODE_ENV = 'production';
process.env.BUILD_PATH = 'dist';
// Source maps expõem o código-fonte completo no servidor público.
if (!process.env.GENERATE_SOURCEMAP) process.env.GENERATE_SOURCEMAP = 'false';
require('react-scripts/config/env');
const value = process.env.REACT_APP_API_URL;
const { validateApiOrigin } = require('./validate-api-origin');
process.env.REACT_APP_API_URL = validateApiOrigin(value);
// O dist é o que vai para o servidor público: com a API em localhost, o site publicado
// não conseguiria entrar nem mostrar dados. Para um build local de teste, use AGROVIA_BUILD_LOCAL=1.
if (/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(process.env.REACT_APP_API_URL) && process.env.AGROVIA_BUILD_LOCAL !== '1') {
  console.error('\n[BUILD] REACT_APP_API_URL aponta para ' + process.env.REACT_APP_API_URL + '.');
  console.error('[BUILD] Para publicar, troque no frontend/.env para REACT_APP_API_URL=https://agrovia-sboe.onrender.com e rode o build de novo.\n');
  process.exit(1);
}
require('react-scripts/scripts/build');
