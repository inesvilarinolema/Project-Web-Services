import { Router, Request, Response } from 'express';
import { db } from '../helpers/database';
import { requireRole } from '../helpers/auth'

export const teamsRouter = Router();

// persons endpoints
teamsRouter.get('/', requireRole([0]), async (req: Request, res: Response) => {
  const teams = await db?.connection?.all(
    `SELECT * FROM teams`
  );
  res.json(teams);
});
