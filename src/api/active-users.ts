import { Router } from 'express';
import { requireRole } from '../helpers/auth';
import { db } from '../helpers/sysdb';      
import { sessionsdb } from '../helpers/sessionsdb'; 
import { sendMessageToUser } from '../helpers/websocket';

export const activeUsersRouter = Router();

//GET -> Union email + token
activeUsersRouter.get('/', requireRole([0]), async (req, res, next) => {
    try {
        const now = Date.now();

        const activeSessions = await sessionsdb.connection.all(
            'SELECT * FROM sessions WHERE expired > ?', 
            now
        );

        const users = await db.connection!.all('SELECT id, username FROM users');

        const result = activeSessions.map((session: any) => {
            let sessionData;
            try {
                sessionData = JSON.parse(session.sess);
            } 
            catch (e) {
                return null; 
            }

            const userId = sessionData.passport && sessionData.passport.user;

            if (!userId) return null; 

            const user = users.find((u: any) => u.id === userId);
            return {
                token: session.sid,     
                valid_until: session.expired, 
                user_id: userId,
                username: user ? user.username : 'Unknown User',
                isCurrentSession: (session.sid == req.sessionID)
            };
        }).filter((item: any) => item !== null);

        res.json(result);
    } 
    catch (error) {
        next(error);
    }
});


//DELETE -> logout
activeUsersRouter.delete('/:token', requireRole([0]), async (req, res, next) => {
    try {
        const sid = req.params.token;
        const session: any = await sessionsdb.connection.get(
            'SELECT sess FROM sessions WHERE sid = ?', 
            sid
        );

        if (session) {
            try {
                const sessionData = JSON.parse(session.sess);
                const userId = sessionData.passport && sessionData.passport.user;

                if (userId) {
                    console.log(`🔫 Admin expulsando a usuario ID: ${userId}`);
                    
                    sendMessageToUser(userId, { 
                        type: 'forceLogout',
                        data: 'Administrator has closed your session.'
                    });
                }
            } catch (e) {
                console.error('Error parseando sesión al intentar expulsar:', e);
            }
        }

        await sessionsdb.connection.run('DELETE FROM sessions WHERE sid = ?', sid); //Delete session
        res.json({ message: 'User logged out successfully' });
    } 
    catch (error) {
        next(error);
    }
});