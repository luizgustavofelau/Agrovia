# Frontend Agrovia

React + TypeScript com Create React App. A configuração de deploy está no [README principal](../README.md#deploy) e os testes no [relatório](../AUDITORIA-DEPLOY.md).

Copie `.env.example` para `.env` se ainda não existir e ajuste `REACT_APP_API_URL`.

```bash
npm ci
npm start
npm run build
npm run preview
```

O desenvolvimento e a prévia usam `/tecti/2026/gpec05/`. Build em `dist`; transfira seu conteúdo, incluindo `.htaccess`. Não utiliza Vite.
