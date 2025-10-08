import express, { Request, Response } from 'express';
import path from 'path';
import morgan from 'morgan';

const app = express();

// log http requests
app.use(morgan('tiny'));

// static files (angular app)
const angularDistPath = path.join(__dirname, '../frontend/dist/frontend/browser');
app.use(express.static(angularDistPath));

// automatic parsing of json payloads
app.use(express.json());

// example data endpoint
app.get('/api/example', async (req: Request, res: Response) => {
  res.json({ example: true, on_method: req.method, on_url: req.url })
})

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
