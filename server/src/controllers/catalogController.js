import * as catalog from '../services/catalogService.js';
import { idParam } from '../utils/validate.js';

export const guestHouses = async (req, res) => res.json(await catalog.listGuestHouses());
export const rooms = async (req, res) => res.json(await catalog.listRooms(req.query));
export const room = async (req, res) => res.json(await catalog.getRoom(idParam(req.params.id, 'room'), req.query));
export const halls = async (req, res) => res.json(await catalog.listHalls());
export const rates = async (req, res) => res.json(await catalog.listRates());
