import { Router } from 'express';
import { Audit } from '../model/audit'; 
import { requireRole } from '../helpers/auth'; 

export const auditRouter = Router();

/**
 * GET /
 * Retrieves the system audit logs
 * Access -> Admin
 */
auditRouter.get('/', requireRole([0]), async (req, res, next) => {
	try {
		//Fetch the latest 100 actions recorded in the system
		const logs = await Audit.getAll(100);
		res.json(logs);
	} 
	catch (error) {
		next(error);
	}
});