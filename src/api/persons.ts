import { Router, Request, Response } from 'express';
import { db } from '../helpers/database';
import { Person } from '../model/person';
import { HttpError } from '../helpers/errorhandling';

export const personsRouter = Router();

// persons endpoints
personsRouter.get('/', async (req: Request, res: Response) => {
  const filter = `%${req.query.filter || ''}%`;
  const persons = await db?.connection?.all('SELECT * FROM persons WHERE firstname LIKE ? OR lastname LIKE ?', [filter, filter]);
  res.json(persons);
});

personsRouter.post('/', async (req: Request, res: Response) => {
  const { firstname, lastname, birthdate } = req.body; // assume body has correct shape so name is present
  try {
    const newPerson = new Person(firstname, lastname, new Date(birthdate));
    const addedPerson = await db?.connection?.get('INSERT INTO persons (firstname, lastname, birthdate) VALUES (?, ?, ?) RETURNING *',
      newPerson.firstname, newPerson.lastname, newPerson.birthdate
    );
    res.json(addedPerson); // return the newly created person; alternatively, you may return the full list of persons
  } catch (error: Error | any) {
    res.status(400).json({ message: error.message }); // bad request; validation or database error
  }
});

personsRouter.put('/', async (req: Request, res: Response) => {
  const { id, firstname, lastname, birthdate } = req.body;
  try {
    if (typeof id !== 'number' || id <= 0) {
      throw new HttpError(400, 'ID was not provided correctly');
    }
    const personToUpdate = new Person(firstname, lastname, new Date(birthdate));
    personToUpdate.id = id;  // retain the original id
    const updatedPerson = await db?.connection?.get('UPDATE persons SET firstname = ?, lastname = ?, birthdate = ? WHERE id = ? RETURNING *',
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

personsRouter.delete('/', async (req: Request, res: Response) => {
  const id = parseInt(req.query.id as string, 10);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ message: 'ID was not provided correctly' });
    return;
  }
  const deletedPerson = await db?.connection?.get('DELETE FROM persons WHERE id = ? RETURNING *', id);
  if (deletedPerson) {
    res.json(deletedPerson); // return the deleted person
  } else {
    res.status(404).json({ message: 'Person to delete not found' });
  }
});
