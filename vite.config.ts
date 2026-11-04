import { defineConfig } from 'vite';
import { ModelService, readConfig } from './server/model.js';
import { modelMiddleware } from './server/http.js';

export default defineConfig({
  plugins: [{ name: 'local-model-server', configureServer(server) {
    // Never use VITE_* for secrets; this module is only loaded by the Node server.
    server.middlewares.use(modelMiddleware(new ModelService(readConfig(process.env))));
  } }],
  server: { host: '127.0.0.1' }
});
