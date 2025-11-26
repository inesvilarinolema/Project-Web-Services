import { Router, Request, Response } from 'express';
import { db } from '../helpers/database';
import { Person } from '../model/person';
import { HttpError } from '../helpers/errorhandling';
import { requireRole } from '../helpers/auth';

export const personsRouter = Router();

// persons endpoints
personsRouter.get('/', requireRole([0,1]), async (req: Request, res: Response) => {
  const filter = `%${req.query.filter || ''}%`;
  let limit = parseInt(req.query.limit as string || '10')
  if(isNaN(limit) || limit < 1) throw new HttpError(400, 'Limit is not properly set');
  const persons = await db?.connection?.all(
    `SELECT
      p.id,
      p.firstname,
      p.lastname,
      p.birthdate,
      COALESCE(json_group_array(
        json_object(
            'id', t.id,
            'shortname', t.shortname,
            'color', t.color
        ) 
      ) FILTER (WHERE t.id IS NOT NULL), json('[]')) AS team_objects
      FROM persons p
      LEFT JOIN membership m ON m.person_id = p.id
      LEFT JOIN teams t ON t.id = m.team_id
      WHERE firstname LIKE ? OR lastname LIKE ?
      GROUP BY p.id LIMIT ?`
     , [filter, filter, limit]);

  res.json(persons?.map(p => ({ ...p, team_objects: JSON.parse(p.team_objects)})));
});

async function setMembership(person_id: number, team_ids: number[]) {
    await db?.connection?.get('DELETE FROM membership WHERE person_id=?', person_id);
    for(const team_id of team_ids) {
        await db?.connection?.get('INSERT INTO membership (person_id, team_id) VALUES (?, ?)', person_id, team_id);
    }
}

personsRouter.post('/', requireRole([0]), async (req: Request, res: Response) => {
  const { firstname, lastname, birthdate, team_ids } = req.body; // assume body has correct shape so name is present
  try {
    const newPerson = new Person(firstname, lastname, new Date(birthdate));
    const addedPerson = await db?.connection?.get('INSERT INTO persons (firstname, lastname, birthdate) VALUES (?, ?, ?) RETURNING *',
      newPerson.firstname, newPerson.lastname, newPerson.birthdate
    );
    await setMembership(addedPerson.id, team_ids);
    res.json(addedPerson); // return the newly created person; alternatively, you may return the full list of persons
  } catch (error: Error | any) {
    res.status(400).json({ message: error.message }); // bad request; validation or database error
  }
});

personsRouter.put('/', requireRole([0]), async (req: Request, res: Response) => {
  const { id, firstname, lastname, birthdate, team_ids } = req.body;
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
      await setMembership(updatedPerson.id, team_ids);
      res.json(updatedPerson); // return the updated person
    } else {
      throw new HttpError(404, 'Person to update not found');
    }
  } catch (error: Error | any) {
    const status = (error as any)?.status || 400;
    res.status(status).json({ message: error.message });
  }
});

personsRouter.delete('/', requireRole([0]), async (req: Request, res: Response) => {
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
