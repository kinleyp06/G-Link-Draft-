import * as bookingService from '../services/bookingService.js';
import * as hallService from '../services/hallService.js';
import { idParam } from '../utils/validate.js';

export const quote = async (req, res) => res.json(await bookingService.quote(req.user, req.body));
export const create = async (req, res) => res.status(201).json(await bookingService.create(req.user, req.body));
export const listMine = async (req, res) => res.json(await bookingService.listMine(req.user, req.query));
export const detail = async (req, res) => res.json(await bookingService.detail(req.user, idParam(req.params.id, 'booking')));
export const cancel = async (req, res) => res.json(await bookingService.cancel(req.user, idParam(req.params.id, 'booking')));
export const requestExtension = async (req, res) =>
  res.status(201).json(await bookingService.requestExtension(req.user, idParam(req.params.id, 'booking'), req.body));

export const createHall = async (req, res) => res.status(201).json(await hallService.create(req.user, req.body));
export const listMyHall = async (req, res) => res.json(await hallService.listMine(req.user));
export const hallSlots = async (req, res) => res.json(await hallService.takenSlots(req.query));
export const cancelHall = async (req, res) => res.json(await hallService.cancel(req.user, idParam(req.params.id, 'hall booking')));
