import {pwaAssets} from './server/pwa-assets.js';
import {browserEngineAssets} from './server/browser-engine-assets.js';
import { FileCredentialsStore, credentialsPath } from './server/credentials.js';
import { CostControl } from './server/costs.js';
import { UpdateService } from './server/updates.js';
import { defineConfig } from 'vite';
import { ModelService, readConfig } from './server/model.js';
import { PlayingEngineService } from './server/playing-engine.js';
import { StockfishService } from './server/stockfish.js';
import { modelMiddleware } from './server/http.js';

export default defineConfig({
  define:{__PWA_ENABLED__:JSON.stringify(true)},
  plugins: [browserEngineAssets(),pwaAssets(),{ name: 'local-model-server', configureServer(server) {
    // Never use VITE_* for secrets; this module is only loaded by the Node server.
    const stockfish = new StockfishService();
    const playingEngine=new PlayingEngineService();
    server.middlewares.use(modelMiddleware(new ModelService(readConfig(process.env),fetch,new FileCredentialsStore(credentialsPath(process.env)),new CostControl(credentialsPath(process.env)+'.usage.json')), raw => stockfish.check(raw),new UpdateService(server.config.root),raw=>playingEngine.move(raw)));
  } }],
  server: { host: '127.0.0.1' }
});
