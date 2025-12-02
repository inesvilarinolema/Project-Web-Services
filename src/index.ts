import express from 'express';
import morgan from 'morgan';
import { config } from 'dotenv';

import { APP_VERSION } from './shared/version';
import { errorHandler } from './helpers/errors';
import { db as sysdb, openDb as openSysDb, createIfNotExists } from './helpers/sysdb';
import { openDb, db, createSchemaAndData } from './helpers/db';
import { authRouter, initAuth } from './helpers/auth';
import { uploadRouter } from './helpers/fileupload';
import { personsRouter } from './api/persons';
import { teamsRouter } from './api/teams';

config({ quiet: true });

const app = express();

// log http requests
app.use(morgan(process.env.MORGANTYPE || 'tiny'));

// static files (angular app)
const frontendPath = process.env.FRONTEND || './frontend/dist/frontend/browser';
app.use(express.static(frontendPath));
// static uploaded files
app.use('/uploads', express.static(process.env.UPLOADSDIR || './uploads'));

// api url prefix
const apiUrl = process.env.APIURL || '/api';

// automatic parsing of json payloads
app.use(express.json());

async function main() {
  sysdb.connection = await openSysDb();
  console.log('System database connected');
  await createIfNotExists();
  await initAuth(app);

  db.connection = await openDb();
  console.log('Database connected');
  await createSchemaAndData(); // create tables and initial data if needed; delete database file to recreate

  // auth router
  app.use('/api/auth', authRouter);
  
  // file upload router
  app.use(apiUrl + '/upload', uploadRouter);

  // import and install api routers
  app.use(apiUrl + '/persons', personsRouter);
  app.use(apiUrl + '/teams', teamsRouter);

  // install our error handler (must be the last app.use)
  app.use(errorHandler);

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

console.log(`Backend ${APP_VERSION} is starting...`);
main().catch(err => {
  console.error('Startup failed due to', err);
})