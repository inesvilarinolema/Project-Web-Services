
import { Request, Response, Router } from 'express';
import { User } from '../model/user'; 
import { broadcast, activeLocks } from './websocket';

export const lockRouter = Router();

/* ->BLOCK 
	Attempts to acquire a lock for a specific resource,
	returns 409 if locked by someone else
*/
lockRouter.post('/:type/:id', (req: Request, res: Response) => {
	
	const {type, id} = req.params;
	const key = `${type}:${id}`; //unique identifier for the resource
	
	const user = req.user as User; 

	//Ensure user is authenticated
	if (!user) {
		res.status(401).json({ message: 'Who are you?' });
		return;
	}

	const existingLock = activeLocks.get(key);

	//Check if resource is already locked
	if (existingLock) {
		
		//A -> If it is locke by me
		// -> Refresh the timestamp and return sucess
		if (existingLock.username === user.username) {
				activeLocks.set(key, { username: user.username, at: Date.now() });
				res.json({ success: true });
				return;
		} 
		
		//B -> The lock belongs to someone else
		// -> Deny the request
		res.status(409).json({ 
			message: `Locked by ${existingLock.username}`,
			lockedBy: existingLock.username 
		});
		return;
	}

	//If the resource is free -> create the lock
	activeLocks.set(key, { username: user.username, at: Date.now() });
	
	//console.log(`LOCK: ${key} locked by ${user.username}`);
	
	//Notify all connected clients via WS 
	broadcast([0, 1], { 
		type: 'lockUpdate', 
		data: { action: 'lock', type, id, username: user.username } 
	});

	res.json({ success: true });
});

/*
-> DELETE
Releases a lock on a resource
*/
lockRouter.delete('/:type/:id', (req: Request, res: Response) => {

	const { type, id } = req.params;
	const key = `${type}:${id}`;
	const user = req.user as User;

	if (!user) { 
			res.status(401).send(); 
			return; 
	}

	const existingLock = activeLocks.get(key);

	//We can only unlock if -> i`m the owner and the lock exists
	if (existingLock && existingLock.username === user.username) {
		activeLocks.delete(key);
		console.log(`UNLOCK: ${key} released by ${user.username}`);
		//Notify clients that the resource is now free
		broadcast([0, 1], { type: 'lockUpdate', data: { type, id } });  
	}
	//Always return success
	res.json({ success: true });
});

/*lockRouter.get('/', (req, res) => {
		res.json(Object.fromEntries(activeLocks));
});*/