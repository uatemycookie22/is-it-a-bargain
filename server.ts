import path from 'path';
import { createRequestHandler } from 'expo-server/adapter/express';
import express from 'express';
import compression from 'compression';

const CLIENT_BUILD_DIR = path.join(process.cwd(), 'dist/client');
const SERVER_BUILD_DIR = path.join(process.cwd(), 'dist/server');

const app = express();
app.use(compression());
app.disable('x-powered-by');

process.env.NODE_ENV = 'production';

app.use(
  express.static(CLIENT_BUILD_DIR, {
    maxAge: '1h',
    extensions: ['html'],
  })
);

app.all('/{*all}', createRequestHandler({ build: SERVER_BUILD_DIR }));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server listening on port ${port}`));
