import { Router } from 'express';
import { requireRole } from '../helpers/auth';
import { db } from '../helpers/sysdb'; //System DB (users)     
import { sessionsdb } from '../helpers/sessionsdb';  //Session store DB
import { sendMessageToUser } from '../helpers/websocket';

export const activeUsersRouter = Router();

/**
 * GET /
 * Retrieves a list of all currently active sessions
 * Access -> Admin
 */
activeUsersRouter.get('/', requireRole([0]), async (req, res, next) => {
    try {
        const now = Date.now();

        //Get raw active sessions from sessions store
        const activeSessions = await sessionsdb.connection.all(
            'SELECT * FROM sessions WHERE expired > ?', 
            now
        );

        //Gett all users to map IDs to usernames
        const users = await db.connection!.all('SELECT id, username FROM users');

        //Process and map the data
        const result = activeSessions.map((session: any) => {
            let sessionData;
            try {
                sessionData = JSON.parse(session.sess);
            } 
            catch (e) {
                return null; 
            }

            //Extract user id 
            const userId = sessionData.passport && sessionData.passport.user;

            if (!userId) return null; 

            const user = users.find((u: any) => u.id === userId);
            return {
                token: session.sid,     
                valid_until: session.expired, 
                user_id: userId,
                username: user ? user.username : 'Unknown User',
                isCurrentSession: (session.sid == req.sessionID) //Flag if this is the admins own session
            };
        }).filter((item: any) => item !== null);

        res.json(result);
    } 
    catch (error) {
        next(error);
    }
});


/**
 * DELETE /:token
 * Force log out a user by destroying their session ID
 * Access -> Admin
 */
activeUsersRouter.delete('/:token', requireRole([0]), async (req, res, next) => {
    try {
        const sid = req.params.token;

        //Retrieve the sessions to identify the user
        const session: any = await sessionsdb.connection.get(
            'SELECT sess FROM sessions WHERE sid = ?', 
            sid
        );

        if (session) {
            try {
                const sessionData = JSON.parse(session.sess);
                const userId = sessionData.passport && sessionData.passport.user;

                if (userId) {
                    //console.log(`Admin expelling user ID: ${userId}`);
                    
                    //Real time notification via WS, tell the user's browser to redirect to login inmediately
                    sendMessageToUser(userId, { 
                        type: 'forceLogout',
                        data: 'Administrator has closed your session.'
                    });
                }
            } catch (e) {
                console.error('Error parseando sesión al intentar expulsar:', e);
            }
        }

        //Delete the session from the database
        await sessionsdb.connection.run('DELETE FROM sessions WHERE sid = ?', sid); //Delete session
        res.json({ message: 'User logged out successfully' });
    } 
    catch (error) {
        next(error);
    }
});