// Origins allowed to call the API and open sockets from a browser. Same-origin requests through nginx
// never need this; set CORS_ORIGINS (comma separated) when the site is served from another host.
export const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'https://localhost:4443,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
