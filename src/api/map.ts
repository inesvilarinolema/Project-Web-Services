import { Router } from 'express';
import { db } from '../helpers/db'; 

export const mapRouter = Router();

/**
 *GET /
 *Retrieves teams with coordinates and calculates a distance matrix between them
 *Uses USRM public API to get walking distances
 */

//Use backend-> security: API urls and logic hidden from client
//           -> efficiency: server processes coordinate string format required befor sending a clean JSON to frontend
mapRouter.get('/', async (req, res, next) => {
	try {
		//Fetch teams that have valid GPS coordenates
		const teams = await db.connection!.all('SELECT * FROM teams WHERE latitude IS NOT NULL AND longitude IS NOT NULL');

		//Need at least 2 points to calculate a distance
		if (teams.length < 2) {
			return res.json({ teams, matrix: [] });
		}

		//Format coordinates for OSRM API
		const coordsString = teams.map((t: any) => `${t.longitude},${t.latitude}`).join(';');

		const url = `http://router.project-osrm.org/table/v1/walking/${coordsString}?annotations=distance`;

		const response = await fetch(url);
		if (!response.ok) throw new Error('Error in OSRM API');
		
		//Return combined data to frontend (matrix 2D array of distances in meters)
		const data = await response.json();
		res.json({
			teams: teams,
			matrix: data.distances
		});

	} 
	catch (error) {
		next(error);
	}
});