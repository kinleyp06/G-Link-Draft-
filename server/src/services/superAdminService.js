import { withTransaction } from '../config/db.js';
import * as users from '../models/userModel.js';
import { AppError } from '../utils/AppError.js';
import { Validator } from '../utils/validate.js';
import { ROLES, USER_STATUSES } from '../utils/constants.js';
import { notFound } from './stayRules.js';

// F-29
export async function listUsers(query) {
  const v = new Validator(query);
  const q = v.string('q', { required: false, max: 100 });
  const role = v.oneOf('role', ROLES, { required: false });
  v.done();
  return { users: await users.list({ q, role }) };
}

export async function updateUser(me, id, body) {
  const v = new Validator(body);
  const role = v.oneOf('role', ROLES, { label: 'Role', required: false });
  const status = v.oneOf('status', USER_STATUSES, { label: 'Status', required: false });
  if (!role && !status) v.fail('role', 'Choose a role or a status.');
  v.done();
  if (id === me.user_id) throw new AppError('You cannot change your own role or status.', 409, 'SELF_CHANGE');

  return withTransaction(async (conn) => {
    const target = await users.findById(id, conn);
    if (!target) throw notFound('Account');
    // Only an *active* Super Admin being demoted or switched off reduces the count.
    const losesSuper =
      target.role === 'Super Admin' && target.status === 'Active' && ((role && role !== 'Super Admin') || status === 'Inactive');
    if (losesSuper && (await users.countActiveSuperAdmins(conn)) <= 1) {
      throw new AppError('There must always be at least one active Super Admin.', 409, 'LAST_SUPER_ADMIN');
    }
    await users.updateRoleStatus(id, { role, status }, conn);
    return { user: users.toPublic(await users.findById(id, conn)) };
  });
}
