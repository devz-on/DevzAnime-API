import createApp from './lib/create-app.js';
import { configureDocs } from './lib/configure-docs.js';
import router from './routes/routes.js';
import { proxyHandler, proxyOptionsHandler } from './routes/proxy.js';

const app = createApp();

configureDocs(app);

app.options('/api/v1/proxy', proxyOptionsHandler);
app.get('/api/v1/proxy', proxyHandler);
app.route('/api/v1', router);

export default app;
