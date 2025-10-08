import express from 'express';
import path from 'path';
import morgan from 'morgan';

const app = express();

// log http requests
app.use(morgan('tiny'));

// static files (angular app)
const angularDistPath = path.join(__dirname, '../frontend/dist/frontend/browser');
app.use(express.static(angularDistPath));

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
