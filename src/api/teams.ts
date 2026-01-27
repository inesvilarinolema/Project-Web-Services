import { Router, Request, Response } from "express";

import { HttpError } from "../helpers/errors";
import { db, teamTableDef } from "../helpers/db";
import { Team } from "../model/team";
import { deleteUploadedFile } from "../helpers/fileupload";
import { requireRole } from "../helpers/auth";
import { Audit } from "../model/audit";

export const teamsRouter = Router();

//Helper to transform flat DB rows into nested objects (location: {lat, lon})
const mapRowToTeam = (row: any) => {
	if (!row) return null;
	const { latitude, longitude, ...rest } = row;
	return {
		...rest,
		//Construct the location object only if coordinates exist
		location: (latitude !== null && longitude !== null) ? { latitude, longitude } : null
	};
};

/**
 * GET /:id/members
 * Fetches all persons belongig to a specific team via the memberships join
 * Acces -> Admin & Users
 */
teamsRouter.get('/:id/members', requireRole([0, 1]), async (req: Request, res: Response) => {
	const teamId = parseInt(req.params.id, 10);
	try {
		const query = `
			SELECT p.id, p.firstname, p.lastname
			FROM persons p
			JOIN memberships m ON p.id = m.person_id
			WHERE m.team_id = ?
		`;
		const members = await db!.connection!.all(query, [teamId]);
		res.json(members);
	} catch (error: any) {
		throw new HttpError(500, error.message);
	}
});

/**
 * GET /
 * Retrieves a list of teams with advanced filtering, sorting an pagination
 * Access -> Admin & User
 */
teamsRouter.get('/', requireRole([0, 1]), async (req: Request, res: Response) => {

	let query = `
		SELECT
			id, name, longname, color, has_avatar, latitude, longitude,
			(
				SELECT COUNT(*)
				FROM memberships m
				WHERE m.team_id = teams.id
		) AS member_count
		FROM teams
	` // base query

	const sqlParams: any[] = [];

	const q = req.query.q as string;
	if (q) { 
		let concat = Object.entries(teamTableDef.columns)
			.filter(([_name, def]) => !('skipFiltering' in def && def.skipFiltering))
			.map(([name, def]) => {
				if (def.type === 'DATE') {
					//Convert timestamp to string YYYY-MM-DD
					return `COALESCE(strftime('%Y-%m-%d', ${teamTableDef.name}.${name} / 1000, 'unixepoch'),'')`;
				}
				return `COALESCE(${teamTableDef.name}.${name},'')`; //Handle null values safely during concatenation

			}).join(" || ' ' || ");
		query += ' WHERE ' + concat + ' LIKE ?';
		sqlParams.push(`%${q.replace(/'/g, "''")}%`);
	}

	//Expects and index (1,2,3) for ASC or negative (-1,-2..-) for DESC
	const order = parseInt(req.query.order as string, 10);
	if (order > 0 && order <= Object.keys(teamTableDef.columns).length) { 
		query += ` ORDER BY ${order} ASC`; 
	} 
	else if (order < 0 && -order <= Object.keys(teamTableDef.columns).length) {
		query += ` ORDER BY ${-order} DESC`;
	}

	//Pagination
	const limit = parseInt(req.query.limit as string, 10);
	if (!isNaN(limit) && limit > 0) {
		query += ' LIMIT ?';
		sqlParams.push(limit);
	}
	const offset = parseInt(req.query.offset as string, 0);
	if (!isNaN(offset)) { 
		query += ' OFFSET ?';
		sqlParams.push(offset);
	}

	//Execute an map results
	const teams = await db!.connection!.all(query, sqlParams);
	const result = teams.map(mapRowToTeam);
	res.json(result);
});


/**
 * POST /
 * Creates a new team
 * Acces -> Admin
 */
teamsRouter.post('/', requireRole([0]), async (req: Request<{}, {}, Team>, res: Response) => {
	const { name, longname, color, has_avatar, location} = req.body; // assume body has correct shape so name is present
	try {
		const newTeam = new Team(name, longname, color, has_avatar, location);
		const addedTeam = await db!.connection!.get(
			'INSERT INTO teams (name, longname, color, has_avatar, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?) RETURNING *',
			newTeam.name, 
			newTeam.longname, 
			newTeam.color, 
			newTeam.has_avatar, 
			newTeam.location?.latitude ?? null, 
			newTeam.location?.longitude ?? null
		);

		//Audit log
		const userId = (req as any).user ? (req as any).user.id : null;
		if(userId){
			await Audit.log(userId, 'CREATE', 'teams', newTeam.id, `Team '${name}' added`);
		}

		res.json(mapRowToTeam(addedTeam)); // return the newly created Team; alternatively, you may consider returning the full list of teams
	} 
	catch (error: Error | any) {
		throw new HttpError(400, 'Cannot add team: ' + error.message); // bad request; validation or database error
	}
});

/**
 * PUT /
 * Updates an existing team
 * Access -> Admin
 */
teamsRouter.put('/', requireRole([0]), async (req: Request<{}, {}, Team>, res: Response) => {
	const { id, name, longname, color, has_avatar, location } = req.body;
	try {
		if (typeof id !== 'number' || id <= 0) {
			throw new HttpError(400, 'ID was not provided correctly');
		}
		const TeamToUpdate = new Team(name, longname, color, has_avatar, location);
		TeamToUpdate.id = id;  
		const updatedTeam = await db!.connection!.get('UPDATE teams SET name = ?, longname = ?, color = ?, has_avatar = ?, latitude = ?, longitude = ? WHERE id = ? RETURNING *',
			TeamToUpdate.name, TeamToUpdate.longname, TeamToUpdate.color, TeamToUpdate.has_avatar, TeamToUpdate.location?.latitude ?? null, TeamToUpdate.location?.longitude ?? null, TeamToUpdate.id
		);

		if (updatedTeam) {
			//If avatar flag was removed, delete the physical file
			if(!has_avatar) {
				deleteUploadedFile(id.toString() + '.png', 'avatar'); 
			}

			//Audit log
			const userId = (req as any).user ? (req as any).user.id : null;
			if(userId){
				await Audit.log(userId, 'UPDATE', 'teams', id, `Team '${name}' updated`);
			}
			
			res.json(mapRowToTeam(updatedTeam));
		} 
		else {
			throw new HttpError(404, 'Team to update not found');
		}
	} 
	catch (error: Error | any) {
		throw new HttpError(400, 'Cannot update team: ' + error.message);
	}
});


/**
 * DELETE /
 * Deletes a Team ant idts associated avatar file
 * Access -> Admin
 */
teamsRouter.delete('/', requireRole([0]), async (req: Request, res: Response) => {
	const id = parseInt(req.query.id as string, 10);
	if (isNaN(id) || id <= 0) {
		throw new HttpError(404, 'ID was not provided correctly');
	}

	const deletedTeam = await db!.connection!.get('DELETE FROM teams WHERE id = ? RETURNING *', id);
	if (deletedTeam) {
		deleteUploadedFile(id.toString() + '.png', 'avatar'); //delete associated avatar file if exists
		
		//Audit log
		const userId = (req as any).user ? (req as any).user.id : null;
		if(userId){
			await Audit.log(userId, 'DELETE', 'teams', id, `Team deleted`);
		}

		res.json(mapRowToTeam(deletedTeam));
	} 
	else {
		throw new HttpError(404, 'Team to delete not found');
	}
});
