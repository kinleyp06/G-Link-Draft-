import * as admin from '../services/adminService.js';
import * as catalog from '../services/catalogService.js';
import { idParam } from '../utils/validate.js';

const id = (req) => idParam(req.params.id);

export const dashboard = async (req, res) => res.json(await admin.dashboard());
export const listBookings = async (req, res) => res.json(await admin.listBookings(req.query));
export const approve = async (req, res) => res.json(await admin.approve(req.user, id(req), req.body));
export const reject = async (req, res) => res.json(await admin.reject(req.user, id(req), req.body));
export const cancel = async (req, res) => res.json(await admin.cancelBooking(req.user, id(req), req.body));
export const roomsForBooking = async (req, res) => res.json(await admin.roomsForBooking(id(req)));
export const changeRoom = async (req, res) => res.json(await admin.changeRoom(req.user, id(req), req.body));
export const international = async (req, res) => res.status(201).json(await admin.internationalBooking(req.user, req.body));
export const availability = async (req, res) => res.json(await catalog.listRooms(req.query, { allowPast: true }));

export const listExtensions = async (req, res) => res.json(await admin.listExtensions(req.query));
export const approveExtension = async (req, res) => res.json(await admin.decideExtension(req.user, id(req), true, req.body));
export const rejectExtension = async (req, res) => res.json(await admin.decideExtension(req.user, id(req), false, req.body));

export const listBlocks = async (req, res) => res.json(await admin.listBlocks());
export const createBlock = async (req, res) => res.status(201).json(await admin.createBlock(req.user, req.body));
export const deleteBlock = async (req, res) => res.json(await admin.deleteBlock(id(req)));

export const catalogAll = async (req, res) => res.json(await admin.catalogAll());
export const createGuestHouse = async (req, res) => res.status(201).json(await admin.saveGuestHouse(null, req.body));
export const updateGuestHouse = async (req, res) => res.json(await admin.saveGuestHouse(id(req), req.body));
export const createRoom = async (req, res) => res.status(201).json(await admin.saveRoom(null, req.body));
export const updateRoom = async (req, res) => res.json(await admin.saveRoom(id(req), req.body));
export const createHall = async (req, res) => res.status(201).json(await admin.saveHall(null, req.body));
export const updateHall = async (req, res) => res.json(await admin.saveHall(id(req), req.body));

export const saveRates = async (req, res) => res.json(await admin.saveRates(req.user, req.body));

export const listHallBookings = async (req, res) => res.json(await admin.listHallBookings(req.query));
export const approveHall = async (req, res) => res.json(await admin.decideHall(req.user, id(req), true, req.body));
export const rejectHall = async (req, res) => res.json(await admin.decideHall(req.user, id(req), false, req.body));
