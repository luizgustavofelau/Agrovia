function validateApiOrigin(value) {
  try {
    if (!value) throw new Error();
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)
      || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      throw new Error();
    }
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.protocol !== 'https:' && !local) throw new Error();
    return url.origin;
  } catch {
    throw new Error('Defina REACT_APP_API_URL com somente a origem HTTPS da API, sem /api, caminhos, credenciais, query ou fragmento. HTTP é permitido apenas para localhost.');
  }
}

module.exports = { validateApiOrigin };
