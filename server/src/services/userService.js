import * as users from '../models/userModel.js';
import { AppError } from '../utils/AppError.js';
import { Validator } from '../utils/validate.js';
import { GENDERS } from '../utils/constants.js';

// Name and phone are needed before booking (sign up only asks for email and password).
export function profileComplete(user) {
  return Boolean(user.first_name && user.last_name && user.phone_number);
}

// F-08 profile page
export async function updateProfile(user, body) {
  const v = new Validator(body);
  const fields = {
    first_name: v.string('first_name', { label: 'First name', max: 20 }),
    last_name: v.string('last_name', { label: 'Last name', max: 20 }),
    phone_number: v.phone('phone_number', { required: true }),
    citizenship_id: v.string('citizenship_id', { label: 'CID', required: false, max: 20 }),
    gender: v.oneOf('gender', GENDERS, { label: 'Gender', required: false }),
    sid: v.string('sid', { label: 'Staff / student ID', required: false, max: 20 }),
    department: v.string('department', { label: 'Department', required: false, max: 50 }),
  };
  if (fields.citizenship_id && !/^[A-Za-z0-9-]+$/.test(fields.citizenship_id)) v.fail('citizenship_id', 'CID can only have letters, numbers and dashes.');
  v.done();
  try {
    await users.updateProfile(user.user_id, fields);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('Another account already uses this CID.', 409, 'CID_TAKEN', { citizenship_id: 'Another account already uses this CID.' });
    }
    throw err;
  }
  return users.toPublic(await users.findById(user.user_id));
}
