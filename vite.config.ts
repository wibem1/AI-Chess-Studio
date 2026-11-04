import { FileCredentialsStore, credentialsPath } from './server/credentials.js';
import { CostControl } from './server/costs.js';
import { UpdateService } from './server/updates.js';
import { defineConfig } from 'vite';
import { ModelService, readConfig } from './server/model.js';
import { StockfishService } from './server/stockfish.js';
import { modelMiddleware } from './server/http.js';

export default defineConfig({
  plugins: [{ name: 'local-model-server', configureServer(server) {
    // Never use VITE_* for secrets; this module is only loaded by the Node server.
    const stockfish = new StockfishService();
    server.middlewares.use(modelMiddleware(new ModelService(readConfig(process.env),fetch,new FileCredentialsStore(credentialsPath(process.env)),new CostControl(credentialsPath(process.env)+'.usage.json')), raw => stockfish.check(raw),new UpdateService(server.config.root)));
  } }],
  server: { host: '127.0.0.1' }
});
