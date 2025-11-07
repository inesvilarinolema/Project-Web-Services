import express from 'express';
import morgan from 'morgan';
import { config } from 'dotenv';

import { db, openDb, createSchemaAndData } from './helpers/database';
import { personsRouter } from './api/persons';
import { errorHandler } from './helpers/errorhandling';

config({ quiet: true });

const app = express();

// log http requests
app.use(morgan('tiny'));

// static files (angular app)
const angularDistPath = '../frontend/dist/frontend/browser';
app.use(express.static(angularDistPath));

// automatic parsing of json payloads
app.use(express.json());

async function main() {
  db.connection = await openDb();
  console.log('Database connected');
  await createSchemaAndData();

  app.use('/api/persons', personsRouter);

  // install our error handler (should be the last middleware)
  app.use(errorHandler);

  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}

main().catch(err => {
  console.error('Startup failed');
})