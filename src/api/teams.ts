import { Router, Request, Response } from 'express';
import { db } from '../helpers/database';

export const teamsRouter = Router();

// persons endpoints
teamsRouter.get('/', async (req: Request, res: Response) => {
  const teams = await db?.connection?.all(
    `SELECT * FROM teams`
  );
  res.json(teams);
});
