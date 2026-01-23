
import { Request, Response, Router } from 'express';
import { User } from '../model/user'; 
import { broadcast, activeLocks } from './websocket';

export const lockRouter = Router();


//BLOCK (when we want to block)
lockRouter.post('/:type/:id', (req: Request, res: Response) => {
  
  const {type, id} = req.params;
  const key = `${type}:${id}`; 
  
  const user = req.user as User; 

  if (!user) {
    res.status(401).json({ message: 'Who are you?' });
    return;
  }

  const existingLock = activeLocks.get(key);

  //IF IT IS ALREADY BLOCK?
  if (existingLock) {
    
    //If it is my lock -> ok
    if (existingLock.username === user.username) {
        activeLocks.set(key, { username: user.username, at: Date.now() });
        res.json({ success: true });
        return;
    } 
    
    //The lock belongs to someone else -> error
    res.status(409).json({ 
        message: `Locked by ${existingLock.username}`,
        lockedBy: existingLock.username 
    });
    return;
  }

  //IF IT ISN`T BLOK -> we can block it
  activeLocks.set(key, { username: user.username, at: Date.now() });
  
  console.log(`LOCK: ${key} locked by ${user.username}`);

  broadcast([0, 1], { 
      type: 'lockUpdate', 
      data: { action: 'lock', type, id, username: user.username } 
  });

  res.json({ success: true });
});

//UNLOCK -> when we finish
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

    broadcast([0, 1], { type: 'lockUpdate', data: { type, id } });  
  }
  
  res.json({ success: true });
});

//ESTO SE PUEDE BORRAR DESPUES
lockRouter.get('/', (req, res) => {
    res.json(Object.fromEntries(activeLocks));
});