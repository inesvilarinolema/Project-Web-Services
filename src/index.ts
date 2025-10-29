import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import morgan from 'morgan';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

const app = express();

// log http requests
app.use(morgan('tiny'));

// static files (angular app)
const angularDistPath = path.join(__dirname, '../frontend/dist/frontend/browser');
app.use(express.static(angularDistPath));

// automatic parsing of json payloads
app.use(express.json());

// new Error class
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    // set the prototype explicitly, required for extending built-in classes
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// common error handler returns json with appropriate message
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
    const status = (err as any)?.status || 500;
    const message = (err as any)?.message || "Internal Server Error";
    console.error('ERROR!', message);
    res.status(status).json({ message });
}

// schema for a person
class Person {
  id: number;
  firstname: string;
  lastname: string;
  birthdate: Date;

  constructor(firstname: string, lastname: string, birthdate: Date) {
    if (!firstname || typeof firstname !== 'string' || firstname.trim().length === 0)
      throw new HttpError(400, 'First name was not provided correctly');
    if( !lastname || typeof lastname !== 'string' || lastname.trim().length === 0)
      throw new HttpError(400, 'Last name was not provided correctly');
    if( !birthdate || !(birthdate instanceof Date) || isNaN(birthdate.getTime()) || birthdate < new Date('1900-01-01') || birthdate >= new Date())
      throw new HttpError(400, 'Birth date was not provided correctly');

    this.id = 0; // will be set by the database AUTOINCREMENT
    this.firstname = firstname;
    this.lastname = lastname;
    this.birthdate = birthdate;
  }
}

// initial sample persons
const initialPersons: Person[] = [
  { id: 1, firstname: 'Alice', lastname: 'Adams', birthdate: new Date('1999-03-24') },
  { id: 2, firstname: 'Bobby', lastname: 'Brown', birthdate: new Date('1996-08-20') },
  { id: 3, firstname: 'Cecille', lastname: 'Cronfield', birthdate: new Date('1991-11-02') }
];

// open sqlite database and create tables if they do not exist

let db: Database | null = null;

async function openDb(): Promise<Database> {
  return open({
    filename: './data.sqlite3',
    driver: sqlite3.Database
  });
}

async function createSchemaAndData() {
  // Create a structure
  await db!.run(`
    CREATE TABLE IF NOT EXISTS persons
      (id INTEGER PRIMARY KEY AUTOINCREMENT, firstname TEXT, lastname TEXT, birthdate DATE)
    `);
  // Check if the table is empty
  const row = await db!.get<{ count: number }>('SELECT COUNT(*) AS count FROM persons');
  if (row && row.count === 0) {
    // Insert sample records from persons array if empty
    for(const person of initialPersons) {
      await db!.run('INSERT INTO persons (id, firstname, lastname, birthdate) VALUES (?, ?, ?, ?)',
        person.id, person.firstname, person.lastname, person.birthdate
      );
    }
  }
}

// persons endpoints
app.get('/api/persons', async (req: Request, res: Response) => {
  const persons = await db?.all('SELECT * FROM persons');
  res.json(persons);
});

app.post('/api/persons', async (req: Request, res: Response) => {
  const { firstname, lastname, birthdate } = req.body; // assume body has correct shape so name is present
  try {
    const newPerson = new Person(firstname, lastname, new Date(birthdate));
    const addedPerson = await db?.get('INSERT INTO persons (firstname, lastname, birthdate) VALUES (?, ?, ?) RETURNING *',
      newPerson.firstname, newPerson.lastname, newPerson.birthdate
    );
    res.json(addedPerson); // return the newly created person; alternatively, you may return the full list of persons
  } catch (error: Error | any) {
    res.status(400).json({ message: error.message }); // bad request; validation or database error
  }
});

app.put('/api/persons', async (req: Request, res: Response) => {
  const { id, firstname, lastname, birthdate } = req.body;
  try {
    if (typeof id !== 'number' || id <= 0) {
      throw new HttpError(400, 'ID was not provided correctly');
    }
    const personToUpdate = new Person(firstname, lastname, new Date(birthdate));
    personToUpdate.id = id;  // retain the original id
    const updatedPerson = await db?.get('UPDATE persons SET firstname = ?, lastname = ?, birthdate = ? WHERE id = ? RETURNING *',
      personToUpdate.firstname, personToUpdate.lastname, personToUpdate.birthdate, personToUpdate.id
    );
    if (updatedPerson) {
      res.json(updatedPerson); // return the updated person
    } else {
      throw new HttpError(404, 'Person to update not found');
    }
  } catch (error: Error | any) {
    const status = (error as any)?.status || 400;
    res.status(status).json({ message: error.message });
  }
});

app.delete('/api/persons/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ message: 'ID was not provided correctly' });
    return;
  }
  const deletedPerson = await db?.get('DELETE FROM persons WHERE id = ? RETURNING *', id);
  if (deletedPerson) {
    res.json(deletedPerson); // return the deleted person
  } else {
    res.status(404).json({ message: 'Person to delete not found' });
  }
});

async function main() {
  db = await openDb();
  console.log('Database connected');
  await createSchemaAndData();

  // install our error handler
  app.use(errorHandler);

  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}

main().catch(err => {
  console.error('Startup failed');
})