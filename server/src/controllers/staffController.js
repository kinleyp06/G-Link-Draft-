import * as incharge from '../services/inchargeService.js';
import * as superAdmin from '../services/superAdminService.js';
import { idParam } from '../utils/validate.js';

export const listBookings = async (req, res) => res.json(await incharge.listBookings(req.query));
export const today = async (req, res) => res.json(await incharge.today());
export const checkIn = async (req, res) => res.json(await incharge.checkIn(idParam(req.params.id)));
export const checkOut = async (req, res) => res.json(await incharge.checkOut(idParam(req.params.id)));
export const recordPayment = async (req, res) => res.status(201).json(await incharge.recordPayment(req.user, req.body));

export const listUsers = async (req, res) => res.json(await superAdmin.listUsers(req.query));
export const updateUser = async (req, res) => res.json(await superAdmin.updateUser(req.user, idParam(req.params.id), req.body));
