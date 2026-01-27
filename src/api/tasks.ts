import { Router, Request, Response } from "express";
import { HttpError } from "../helpers/errors";
import { db, taskTableDef } from "../helpers/db";
import { Task } from "../model/task";
import { requireRole } from "../helpers/auth";
import { Audit } from "../model/audit";
export const tasksRouter = Router();

/**
 * GET /
 * Retrieves task with optional filtering by text or specific team IDs
 * Access -> Admin & Users
 */
tasksRouter.get('/', requireRole([0, 1]), async (req: Request, res: Response) => {

		let query = `
			SELECT
				tasks.id, tasks.name, tasks.team_id, tasks.person_id, tasks.start_date, tasks.end_date,
				(persons.firstname || ' ' || persons.lastname) as person_name
			FROM tasks
			LEFT JOIN persons ON tasks.person_id = persons.id
		`;
	
		const sqlParams: any[] = [];
		const whereClauses: string[] = []; 

		//--Filtering--
		const q = req.query.q as string;
		if (q) {
			//Concatenate all columns
			let concat = Object.keys(taskTableDef.columns)
				.map(name => `COALESCE(${taskTableDef.name}.${name}, '')`)
				.join(" || ' ' || ");
			query += ' WHERE ' + concat + ' LIKE ?';
			sqlParams.push(`%${q.replace(/'/g, "''")}%`);
		}

		//Filter specific team IDs
		const teamIdsParam = req.query.team_ids as string;
		if (teamIdsParam) {
			const ids = teamIdsParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
			
			if (ids.length > 0) {
				const placeholders = ids.map(() => '?').join(',');
				whereClauses.push(`tasks.team_id IN (${placeholders})`);
				sqlParams.push(...ids);
			}
		}

		if (whereClauses.length > 0) {
			query += ' WHERE ' + whereClauses.join(' AND ');
		}
		
		//Sorting
		const order = parseInt(req.query.order as string, 10);
		if (order > 0 && order <= Object.keys(taskTableDef.columns).length) {
			query += ` ORDER BY ${order} ASC`;
		} 
		else if (order < 0 && -order <= Object.keys(taskTableDef.columns).length) {
			query += ` ORDER BY ${-order} DESC`;
		}
	
		//Pagination
		const limit = parseInt(req.query.limit as string, 10);
		if (!isNaN(limit) && limit > 0) {
			query += ' LIMIT ?';
			sqlParams.push(limit);
		}
	
		const offset = parseInt(req.query.offset as string, 10);
		if (!isNaN(offset)) {
			query += ' OFFSET ?';
			sqlParams.push(offset);
		}
	
		try {
			const tasks = await db!.connection!.all(query, sqlParams);
			res.json({
				total: tasks.length,  
				filtered: tasks.length,
				tasks
			});
		} 
		catch (error: any) {
			throw new HttpError(500, 'Cannot get tasks: ' + error.message);
		}
	});
	
/**
 * POST /
 * Creates a new task
 * Access -> Admin
 */
	tasksRouter.post('/', requireRole([0]), async (req: Request, res: Response) => {
		const { name, team_id, person_id, start_date, end_date } = req.body;
		
		try {
			//Check if the person belongs to the team
			const membership = await db!.connection!.get(
				'SELECT 1 FROM memberships WHERE person_id = ? AND team_id = ?',
				person_id, team_id
			);

			if (!membership) {
				throw new HttpError(400, 'The selected person does not belong to the selected team');
			}

			//Create model instance
			const newTask = new Task(name, team_id, person_id, start_date, end_date || null);

			const result = await db!.connection!.run(
				'INSERT INTO tasks (name, team_id, person_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
				newTask.name, newTask.team_id, newTask.person_id, newTask.start_date, newTask.end_date
			);

			//Audit log
			const userId = (req as any).user ? (req as any).user.id : null;
			if (userId && result.lastID) {
				await Audit.log(userId, 'CREATE', 'tasks', result.lastID, `Task '${req.body.name}' created`);
			}

			res.json({ 
				message: 'Task added successfully', task: { ...newTask, id: result.lastID} 
			});

		} 
		catch (error: any) {
			if (error instanceof HttpError) throw error;
			throw new HttpError(400, 'Cannot add task: ' + error.message);
		}
	});


	/**
	 * PUT /
	 * Updates an existing task
	 * Access -> Admin
	 */
	tasksRouter.put('/', requireRole([0]), async (req: Request, res: Response) => {
		const { id, name, team_id, person_id, start_date, end_date } = req.body;
	
		if (typeof id !== 'number' || id <= 0) {
			throw new HttpError(400, 'ID was not provided correctly');
		}
	
		try {
			const taskToUpdate = new Task(name, team_id, person_id, start_date, end_date || null);
			taskToUpdate.id = id;
	
			const updatedTask = await db!.connection!.get(
				'UPDATE tasks SET name = ?, team_id = ?, person_id = ?, start_date = ?, end_date = ? WHERE id = ? RETURNING *',
				taskToUpdate.name, taskToUpdate.team_id, taskToUpdate.person_id, taskToUpdate.start_date, taskToUpdate.end_date, taskToUpdate.id
			);
	
			if (!updatedTask) {
				throw new HttpError(404, 'Task to update not found');
			}

			//Audit log
			const userId = (req as any).user ? (req as any).user.id : null;
			if(userId){
				await Audit.log(userId, 'UPDATE', 'tasks', id, `Task ${name} updated`);
			}

			res.json(updatedTask);

		} 
		catch (error: any) {
			throw new HttpError(400, 'Cannot update task: ' + error.message);
		}
	});
	

	/**
	 * DELETE /
	 * Deletes a task by ID
	 * Access -> Admin
	 */ 
	tasksRouter.delete('/', requireRole([0]), async (req: Request, res: Response) => {
		const id = parseInt(req.query.id as string, 10);
	
		if (isNaN(id) || id <= 0) {
			throw new HttpError(404, 'ID was not provided correctly');
		}
	
		try {
			const deletedTask = await db!.connection!.get(
				'DELETE FROM tasks WHERE id = ? RETURNING *', id
			);
	
			if (!deletedTask) {
				throw new HttpError(404, 'Task to delete not found');
			}

			//Audit log
			const userId = (req as any).user ? (req as any).user.id : null;
			if(userId){
				await Audit.log(userId, 'DELETE', 'tasks', id, 'Task deleted');
			}
	
			res.json(deletedTask);
		} 
		catch (error: any) {
			throw new HttpError(400, 'Cannot delete task: ' + error.message);
		}
	});