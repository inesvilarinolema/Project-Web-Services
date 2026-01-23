import { HttpError } from "../helpers/errors";
import { COLORS } from "../shared/colors";

// schema for a team
export class Team {
  id: number;
  name: string;
  longname: string;
  color: string;
  has_avatar: boolean;
  lat: number;
  lon: number;

  constructor(name: string, longname: string, color: string, has_avatar: boolean = false, lat: number, lon: number) {

    if (!name || typeof name !== 'string' || name.trim().length === 0)
      throw new HttpError(400, 'Name was not provided correctly');
    if (!name || typeof longname !== 'string' || longname.trim().length === 0)
      throw new HttpError(400, 'Long name was not provided correctly');
    if (!color || typeof color !== 'string' || color.trim().length === 0 || !COLORS.includes(color.trim()))
      throw new HttpError(400, 'Color was not provided correctly');

    if (lat === undefined || lat === null || typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90)  
        throw new HttpError(400, 'Latitude was not provided correctly');
    if (lon === undefined || lon === null || typeof lon !== 'number' || isNaN(lon) || lon < -180 || lon > 180)
        throw new HttpError(400, 'Longitude was not provided correctly');

    this.id = 0; // will be set by the database AUTOINCREMENT
    this.name = name.trim();
    this.longname = longname.trim();
    this.color = color.trim();
    this.has_avatar = has_avatar;
    this.lat = lat;
    this.lon = lon;
  }
}
