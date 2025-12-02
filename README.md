# Programming Web Services 2025

## A project from the scratch

#### Backend

##### Installation TS version of Expressjs framework

```bash
npm init -y
npm install express @types/express
npm install --save-dev typescript ts-node-dev
```

##### Create transpiler configuration in tsconfig.json

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true
  }
}
```

##### Create a main server code in src/index.ts
Put some code in src/index.ts, e.g.
```js
import express from 'express';
import path from 'path';

const app = express();
const angularDistPath = path.join(__dirname, '../frontend/dist/frontend/browser');
app.use(express.static(angularDistPath));

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

##### Add some recipes

Modify file `package.json` by adding some new scripts. After `npm init` the only script defined is `test`.
```json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "ts-node-dev --respawn src/index.ts ",
    "build": "tsc",
    "start": "node dist/index.js"
  },
```

##### Compile and run the server

`npm run build` to transpile sources to production version in dist/
`npm start` to run the transpiled code
`npm run dev` to run development server what restarts after each code change

#### Frontend

##### Install Angular (v20) tools
```bash
npm install -g @angular/cli@20
```
NOTE: on Mac or Linux, it may require preceding this command by `sudo`.

##### Create frontend folder, download demo sources and transpile them to production version.
```bash
ng new frontend --routing --style=scss --defaults
cd frontend
ng build --configuration production
```

##### Create frontend/proxy.conf.json to allow cooperation between frontend development server and backend API working on port 3000 using endpoint `/api`
```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```

##### Run a development server
```bash
ng serve --proxy-config proxy.conf.json
```

NOTE: `ng` automatically creates `package.json` with corresponding `ng`-commands to build and run frontends.

## Consume this project

##### Clone sources to a local folder
```bash
git clone https://gitlab.com/mariusz.jarocki/pws2025.git
```

##### Install dependecies for both frontend and backend
```bash
npm install
npm --prefix frontend install
```
##### Run both parts of Webapp using development servers
```bash
npm run dev
```
and using another terminal
```bash
cd frontend
npm run dev
```

##### Reinitialize databases
Simply delete all/selected `*.sqlite3` files from db folder

##### Enjoy the working Webapp in your browser! :)
http://localhost:4200
