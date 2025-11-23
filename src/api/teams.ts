import { Router, Request, Response } from 'express';
import { db } from '../helpers/database';
import { Team } from '../model/team';
import { HttpError } from '../helpers/errorhandling';
import { requireRole } from '../helpers/auth';

export const teamsRouter = Router();

// teams endpoints
teamsRouter.get('/', requireRole([0,1]), async (req: Request, res: Response) => {
  const filter = `%${req.query.filter || ''}%`;
  let limit = parseInt(req.query.limit as string || '10')
  if(isNaN(limit) || limit < 1) throw new HttpError(400, 'Limit is not properly set');
  const teams = await db?.connection?.all(
    `SELECT * FROM teams
     WHERE shortname LIKE ? OR fullname LIKE ? LIMIT ?`
     , [filter, filter, limit]);
  res.json(teams);
});

teamsRouter.post('/', requireRole([0]), async (req: Request, res: Response) => {
  const { shortname, fullname, color } = req.body; // assume body has correct shape so name is present
  try {
    const newTeam = new Team(shortname, fullname, color);
    const addedTeam = await db?.connection?.get('INSERT INTO teams (shortname, fullname, color) VALUES (?, ?, ?) RETURNING *',
      newTeam.shortname, newTeam.fullname, newTeam.color
    );
    res.json(addedTeam); // return the newly created team; alternatively, you may return the full list of teams
  } catch (error: Error | any) {
    res.status(400).json({ message: error.message }); // bad request; validation or database error
  }
});

teamsRouter.put('/', requireRole([0]), async (req: Request, res: Response) => {
  const { id, shortname, fullname, color } = req.body;
  try {
    if (typeof id !== 'number' || id <= 0) {
      throw new HttpError(400, 'ID was not provided correctly');
    }
    const teamToUpdate = new Team(shortname, fullname, color);
    teamToUpdate.id = id;  // retain the original id
    const updatedTeam = await db?.connection?.get('UPDATE teams SET shortname = ?, fullname = ?, color = ? WHERE id = ? RETURNING *',
      teamToUpdate.shortname, teamToUpdate.fullname, teamToUpdate.color, teamToUpdate.id
    );
    if (updatedTeam) {
      res.json(updatedTeam); // return the updated team
    } else {
      throw new HttpError(404, 'Team to update not found');
    }
  } catch (error: Error | any) {
    const status = (error as any)?.status || 400;
    res.status(status).json({ message: error.message });
  }
});

teamsRouter.delete('/', requireRole([0]), async (req: Request, res: Response) => {
  const id = parseInt(req.query.id as string, 10);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ message: 'ID was not provided correctly' });
    return;
  }
  const deletedTeam = await db?.connection?.get('DELETE FROM teams WHERE id = ? RETURNING *', id);
  if (deletedTeam) {
    res.json(deletedTeam); // return the deleted team
  } else {
    res.status(404).json({ message: 'Team to delete not found' });
  }
});
