import { Router } from 'express';
import { Audit } from '../model/audit'; 
import { requireRole } from '../helpers/auth'; 

export const auditRouter = Router();

auditRouter.get('/', requireRole([0]), async (req, res, next) => {
  try {
    const logs = await Audit.getAll(100);
    res.json(logs);
  } 
  catch (error) {
    next(error);
  }
});