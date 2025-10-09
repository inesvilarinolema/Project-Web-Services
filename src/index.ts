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

// schema for a person
class Person {
  private static seq = 3; // starting id for new persons
  id: number;
  name: string;

  constructor(name: string) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) { // basic validation
      throw new Error('Name is required');
    }
    this.id = Person.seq++; // auto-increment id
    this.name = name;
  }
}

// in-memory "database"
const persons: Person[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
];

// persons endpoints
app.get('/api/persons', async (req: Request, res: Response) => {
  res.json(persons);
});

app.post('/api/persons', async (req: Request, res: Response) => {
  const { name } = req.body; // assume body has correct shape so name is present
  try {
    const newPerson = new Person(name);
    persons.push(newPerson);
    res.json(newPerson); // return the newly created person; alternatively, you may return the full list of persons
  } catch (error: Error | any) {
    res.status(400).json({ message: error.message }); // bad request due to validation error
  }
});

app.delete('/api/persons/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const index = persons.findIndex(p => p.id === id);
  if (index !== -1) { // person found
    const deletedPerson = persons[index];
    persons.splice(index, 1);
    res.json(deletedPerson); // return the deleted person
  } else {
    res.status(404).json({ message: 'Person to delete not found' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
