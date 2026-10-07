import bcrypt from 'bcryptjs';
import * as users from '../models/userModel.js';
import { AppError } from '../utils/AppError.js';
import { Validator } from '../utils/validate.js';
import { signAuthToken, signEmailToken, verifyToken, resetStampMatches } from '../utils/tokens.js';
import { sendEmail } from '../emails/mailer.js';
import { templates } from '../emails/templates.js';
import { getConfig } from '../config/env.js';

const ROUNDS = 10;
// Compared against when the email is unknown, so a wrong email takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-1', ROUNDS);

export const hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);

function link(path, token) {
  return `${getConfig().clientUrl}${path}?token=${encodeURIComponent(token)}`;
}

async function sendVerification(user) {
  const url = link('/verify-email', signEmailToken(user, 'verify'));
  await sendEmail({ to: user.email, ...templates.verifyEmail({ url }) });
}

// F-05: sign up with email and password only.
export async function signup(body) {
  const v = new Validator(body);
  const email = v.email('email');
  const password = v.password('password');
  v.done();

  const existing = await users.findByEmail(email);
  if (existing && existing.email_verified) {
    throw new AppError('An account with this email already exists. Sign in, or reset your password.', 409, 'EMAIL_TAKEN', {
      email: 'An account with this email already exists.',
    });
  }
  if (existing) {
    // Signed up before but never verified: send a fresh link.
    await sendVerification(existing);
    return { message: 'Check your email for the verification link.' };
  }
  const id = await users.create({ email, passwordHash: await hashPassword(password) });
  await sendVerification(await users.findById(id));
  return { message: 'Check your email for the verification link.' };
}

// F-06: the link in the email.
export async function verifyEmail(body) {
  const payload = verifyToken(body?.token, 'verify');
  const user = await users.findById(payload.sub);
  if (!user) throw new AppError('This link is not valid or has expired. Ask for a new one.', 400, 'INVALID_LINK');
  if (!user.email_verified) await users.markVerified(user.user_id);
  return { message: 'Your email is verified. You can sign in now.' };
}

export async function resendVerification(body) {
  const v = new Validator(body);
  const email = v.email('email');
  v.done();
  const user = await users.findByEmail(email);
  if (user && !user.email_verified) await sendVerification(user);
  // Same answer either way, so nobody can test which emails have accounts.
  return { message: 'If that account needs verifying, a new link is on its way.' };
}

// F-04
export async function login(body) {
  const v = new Validator(body);
  const email = v.email('email');
  const password = typeof body?.password === 'string' ? body.password : v.fail('password', 'Password is required.');
  v.done();

  const user = await users.findByEmail(email);
  const match = await bcrypt.compare(password, user?.password || DUMMY_HASH);
  if (!user || !match) throw new AppError('Email or password is wrong.', 401, 'INVALID_LOGIN');
  if (user.status !== 'Active') throw new AppError('This account is switched off. Contact the guest house admin.', 403, 'ACCOUNT_INACTIVE');
  if (!user.email_verified) {
    throw new AppError('Please verify your email first. Check your inbox for the link.', 403, 'EMAIL_NOT_VERIFIED');
  }
  return { token: signAuthToken(user), user: users.toPublic(user) };
}

export async function forgotPassword(body) {
  const v = new Validator(body);
  const email = v.email('email');
  v.done();
  const user = await users.findByEmail(email);
  if (user && user.status === 'Active') {
    const url = link('/reset-password', signEmailToken(user, 'reset'));
    await sendEmail({ to: user.email, ...templates.resetPassword({ url }) });
  }
  return { message: 'If that email has an account, a reset link is on its way.' };
}

export async function resetPassword(body) {
  const v = new Validator(body);
  const password = v.password('password', { label: 'New password' });
  v.done();
  const payload = verifyToken(body?.token, 'reset');
  const user = await users.findById(payload.sub);
  if (!user || !resetStampMatches(payload, user)) {
    throw new AppError('This link is not valid or has expired. Ask for a new one.', 400, 'INVALID_LINK');
  }
  await users.setPassword(user.user_id, await hashPassword(password));
  // Clicking the emailed link also proves the email address.
  if (!user.email_verified) await users.markVerified(user.user_id);
  return { message: 'Your password is changed. You can sign in now.' };
}

export async function changePassword(user, body) {
  const v = new Validator(body);
  const current = typeof body?.current_password === 'string' ? body.current_password : v.fail('current_password', 'Current password is required.');
  const password = v.password('new_password', { label: 'New password' });
  v.done();
  const full = await users.findById(user.user_id);
  if (!(await bcrypt.compare(current, full.password))) {
    throw new AppError('Current password is wrong.', 400, 'VALIDATION_ERROR', { current_password: 'Current password is wrong.' });
  }
  await users.setPassword(user.user_id, await hashPassword(password));
  return { message: 'Password changed.' };
}
