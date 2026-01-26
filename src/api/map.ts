import { Router } from 'express';
import { db } from '../helpers/db'; 

export const mapRouter = Router();

mapRouter.get('/', async (req, res, next) => {
    try {
        const teams = await db.connection!.all('SELECT * FROM teams WHERE latitude IS NOT NULL AND longitude IS NOT NULL');

        if (teams.length < 2) {
            return res.json({ teams, matrix: [] });
        }

        const coordsString = teams
            .map((t: any) => `${t.longitude},${t.latitude}`)
            .join(';');

        const url = `http://router.project-osrm.org/table/v1/walking/${coordsString}?annotations=distance`;

        console.log('Consultando OSRM:', url);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error en OSRM API');
        
        const data = await response.json();
        res.json({
            teams: teams,
            matrix: data.distances
        });

    } catch (error) {
        next(error);
    }
});