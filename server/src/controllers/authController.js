import * as auth from '../services/authService.js';
import * as userService from '../services/userService.js';

export const signup = async (req, res) => res.status(201).json(await auth.signup(req.body));
export const verifyEmail = async (req, res) => res.json(await auth.verifyEmail(req.body));
export const resendVerification = async (req, res) => res.json(await auth.resendVerification(req.body));
export const login = async (req, res) => res.json(await auth.login(req.body));
export const forgotPassword = async (req, res) => res.json(await auth.forgotPassword(req.body));
export const resetPassword = async (req, res) => res.json(await auth.resetPassword(req.body));
export const me = async (req, res) => res.json({ user: req.user, profile_complete: userService.profileComplete(req.user) });
export const updateProfile = async (req, res) => {
  const user = await userService.updateProfile(req.user, req.body);
  res.json({ user, profile_complete: userService.profileComplete(user) });
};
export const changePassword = async (req, res) => res.json(await auth.changePassword(req.user, req.body));
