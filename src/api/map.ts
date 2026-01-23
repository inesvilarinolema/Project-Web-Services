import { Router } from 'express';
import { db } from '../helpers/db'; 

export const mapRouter = Router();

mapRouter.get('/', async (req, res, next) => {
    try {
        const teams = await db.connection!.all('SELECT * FROM teams WHERE lat IS NOT NULL AND lon IS NOT NULL');

        if (teams.length < 2) {
            return res.json({ teams, matrix: [] });
        }

        const coordinatesString = teams
            .map((t: any) => `${t.lon},${t.lat}`)
            .join(';');

        const osrmUrl = `http://router.project-osrm.org/table/v1/walking/${coordinatesString}?annotations=distance`;

        console.log(' Consultando OSRM:', osrmUrl);

        const response = await fetch(osrmUrl);
        
        if (!response.ok) {
            throw new Error(`Error OSRM: ${response.statusText}`);
        }

        const data = await response.json();

        
        res.json({teams: teams,matrix: data.distances
        });

    } catch (error) {
        console.error('Error en map-router:', error);
        res.status(500).json({ error: 'Failed to fetch map data' });
    }
});