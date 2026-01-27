import { Router, Request, Response } from "express";
import { HttpError } from "../helpers/errors";
import { db, personTableDef } from "../helpers/db";
import { Person } from "../model/person";
import { requireRole } from "../helpers/auth";
import { broadcast } from "../helpers/websocket";
import {Audit} from "../model/audit";
export const personsRouter = Router();

/**
 * GET /
 * Retrieves persons with their associated teams 
 * Access -> Admin & User
 */

personsRouter.get('/', requireRole([0, 1]), async (req: Request, res: Response) => {

	const sqlParams: any[] = [];
	const teamId = parseInt(req.query.team_id as string, 10);

	let query = `
		SELECT
			id, firstname, lastname, birthdate, email,
			(
				SELECT COALESCE(
					json_group_array(
						json_object(
							'id', t.id,
							'name', t.name,
							'longname', t.longname,
							'color', t.color,
							'has_avatar', CASE WHEN t.has_avatar = 1 THEN true ELSE false END
						)
					),
					json('[]')
				)
				FROM memberships m
				JOIN teams t ON t.id = m.team_id
				WHERE m.person_id = persons.id
			) AS team_objects
		FROM persons
	`; 

	//If a specific teamID is requested
	if (!isNaN(teamId)) {
		query += `
			JOIN memberships m2 ON m2.person_id = p.id
			WHERE m2.team_id = ?
		`;
		sqlParams.push(teamId);
	}

	//Filtering & searching
	const q = req.query.q as string;
	const { total } = await db.connection!.get("SELECT COUNT(1) AS total FROM persons");
	let filtered = total;

	if (q) { 

		//Build dynamic search string
		let concat = Object.entries(personTableDef.columns)
			.filter(([_name, def]) => !('skipFiltering' in def && def.skipFiltering))
			.map(([name, def]) => {
				
				if (def.type === 'DATE') {
					return `COALESCE(strftime('%Y-%m-%d', ${personTableDef.name}.${name} / 1000, 'unixepoch'),'')`;
				}
				return `COALESCE(${personTableDef.name}.${name},'')`; // coalesce is needed to protect against potential null-values
			}).join(" || ' ' || ");


		concat += " || ' ' || COALESCE(team_objects,'')";
		let selection = ' WHERE ' + concat + ' LIKE ?';
		query += selection;
		sqlParams.push(`%${q.replace(/'/g, "''")}%`);

		//Get count of filtered results for pagination
		const row  = await db.connection!.get(`SELECT COUNT(1) AS filtered FROM (${query}) f`, sqlParams);
		filtered = row.filtered;
	}

	//Sorting
	const order = parseInt(req.query.order as string, 10);
	if (order > 0 && order <= Object.keys(personTableDef.columns).length) { 
		query += ` ORDER BY ${order} ASC`; 
	} 
	else if (order < 0 && -order <= Object.keys(personTableDef.columns).length) {
		query += ` ORDER BY ${-order} DESC`;
	}
	
	//Pagination
	const limit = parseInt(req.query.limit as string, 10);
	if (!isNaN(limit) && limit > 0) { 
		query += ' LIMIT ?';
		sqlParams.push(limit);
	}

	const offset = parseInt(req.query.offset as string, 0);
	if (!isNaN(limit) && limit > 0 && !isNaN(offset)) { 
		query += ' OFFSET ?';
		sqlParams.push(offset);
	}

	//Execute query
	const persons = (await db!.connection!.all(query, sqlParams))!.map(p => ({ ...p, team_objects: JSON.parse(p.team_objects)}));
	const response = { total, filtered, persons };
	res.json(response);
});


//Helper: update memberships for a person
async function setMembership(person_id: number, team_ids: number[]) {
	await db!.connection!.run('DELETE FROM memberships WHERE person_id=?', person_id);
	
	for(const team_id of team_ids) {
		await db!.connection!.run('INSERT INTO memberships (person_id, team_id) VALUES (?, ?)', person_id, team_id);
	}
}


/**
 * POST /
 * Creates a new Person and assigns them to teams
 * Access -> Admin
 */
personsRouter.post('/', requireRole([0]), async (req: Request, res: Response) => {
	const { firstname, lastname, birthdate, email, team_ids } = req.body;
	
	//Start transaction
	await db!.connection!.exec('BEGIN IMMEDIATE');
	try {
		const newPerson = new Person(firstname, lastname, new Date(birthdate), email);
		
		//Insert person
		newPerson.team_ids = Array.isArray(team_ids) ? team_ids : [];
		const addedPerson = await db!.connection!.get('INSERT INTO persons (firstname, lastname, birthdate, email) VALUES (?, ?, ?, ?) RETURNING *',
			newPerson.firstname, newPerson.lastname, newPerson.birthdate, newPerson.email
		);

		///Set team memberships
		await setMembership(addedPerson.id, newPerson.team_ids);

		//Commit transaction
		await db!.connection!.exec('COMMIT');

		//Audit log
		const userId = (req as any).user ? (req as any).user.id : null;
		if(userId){
			await Audit.log(userId, 'CREATE', 'persons', addedPerson.id , `Person '${firstname}' '${lastname}' created`);
		}

		res.json(addedPerson);
	} 
	catch (error: Error | any) {
		await db!.connection!.exec('ROLLBACK'); //Rollback on any error
		throw new HttpError(400, 'Cannot add person: ' + error.message); // bad request; validation or database error
	}
});

//Helper: Validates if a person can be removed from a team (cannot be removed if they have assigned tasks in that team)
async function checkTeamConsistency(personId: number, newTeamIdsRaw: any) {
	const newTeamIds = Array.isArray(newTeamIdsRaw) ? newTeamIdsRaw : [];

	//Get current teams
	const currentMemberships = await db!.connection!.all(
		'SELECT team_id FROM memberships WHERE person_id = ?', 
		personId
	);
	const currentTeamIds = currentMemberships.map((m: any) => m.team_id);

	//Identify which teams are being removed
	const teamsToRemove = currentTeamIds.filter(tid => !newTeamIds.includes(tid));
	if (teamsToRemove.length === 0) {
		return;
	}

	//Check for tasks in the removed teams
	const placeholder = teamsToRemove.join(','); 
	const conflictTask = await db!.connection!.get(
		`SELECT tasks.id, teams.name as team_name 
		 FROM tasks 
		 JOIN teams ON tasks.team_id = teams.id
		 WHERE tasks.person_id = ? 
		 AND tasks.team_id IN (${placeholder}) 
		 LIMIT 1`,
		personId
	);

	if (conflictTask) {
		throw new HttpError(409, `Cannot remove person from team '${conflictTask.team_name}' because they have assigned tasks there. Please reassign their tasks first.`);
	}
}


/**
 * PUT /
 * Updates an existing person
 * Access -> Admin
 */
personsRouter.put('/', requireRole([0]), async (req: Request, res: Response) => {
	const { id, firstname, lastname, birthdate, email, team_ids } = req.body;
	if (typeof id !== 'number' || id <= 0) {
		throw new HttpError(400, 'ID was not provided correctly');
	}

	await db!.connection!.exec('BEGIN IMMEDIATE'); // start transaction
	try {

		await checkTeamConsistency(id, team_ids);
		const personToUpdate = new Person(firstname, lastname, new Date(birthdate), email);
		personToUpdate.id = id;  //retain the original id
		// set team ids if provided
		personToUpdate.team_ids = Array.isArray(team_ids) ? team_ids : [];
		
		//Update person data
		const updatedPerson = await db.connection?.get('UPDATE persons SET firstname = ?, lastname = ?, birthdate = ?, email = ? WHERE id = ? RETURNING *',
			personToUpdate.firstname, personToUpdate.lastname, personToUpdate.birthdate, personToUpdate.email, personToUpdate.id
		);

		if (updatedPerson) {
			//Update memberships
			await setMembership(updatedPerson.id, personToUpdate.team_ids);
			await db!.connection!.exec('COMMIT');

			//Audit log
			const userId = (req as any).user ? (req as any).user.id : null;
			if(userId){
				await Audit.log(userId, 'UPDATE', 'persons', id, `Person '${updatedPerson.firstname}' '${updatedPerson.lastname}' updated`);
			}

			//Notify clients
			broadcast([0,1], {type: 'membershipsUpdate'});

			res.json(updatedPerson); // return the updated person
		} 
		else {
			await db!.connection!.exec('ROLLBACK');
			throw new HttpError(404, 'Person to update not found');
		}
	} 
	catch (error: Error | any) {
		await db!.connection!.exec('ROLLBACK');
		throw new HttpError(400, 'Cannot update person: ' + error.message);  
	}
});


/**
 * DELETE /
 * Deletes a person
 * Access -> Admin
 */
personsRouter.delete('/', requireRole([0]), async (req: Request, res: Response) => {
	const id = parseInt(req.query.id as string, 10);
	if (isNaN(id) || id <= 0) {
		throw new HttpError(400, 'Cannot delete person');  
	}
	
	await db!.connection!.exec('BEGIN IMMEDIATE'); // start transaction
	try {
		//Check dependencies (tasks)
		const pendingTask = await db!.connection!.get(
			'SELECT 1 FROM tasks WHERE person_id = ? LIMIT 1',
			id
		);

		if (pendingTask) {
			throw new HttpError(409, 'Cannot delete person: They still have assigned tasks. Please reassign their tasks first.'
			);
		}

		//Delete person
		const deletedPerson = await db!.connection!.get('DELETE FROM persons WHERE id = ? RETURNING *', id);
		if (deletedPerson) {
			await db!.connection!.exec('COMMIT');

			//Audit log
			const userId = (req as any).user ? (req as any).user.id : null;
			if(userId){
				await Audit.log(userId, 'DELETE', 'persons', id, 'Person deleted');
			}

			//Notify clients
			broadcast([0,1], {type: 'membershipsUpdate', data: 'Reload needed'});

			res.json(deletedPerson); // return the deleted person
		} 
		else {
			await db!.connection!.exec('ROLLBACK'); 
			throw new HttpError(404, 'Person to delete not found');
		}
	} 
	catch (error: Error | any) {
		await db!.connection!.exec('ROLLBACK');
		throw new HttpError(400, 'Cannot delete person: ' + error.message);  
	}
});