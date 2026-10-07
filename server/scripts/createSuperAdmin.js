// Creates (or promotes) the first Super Admin. Passwords never go in Git or in a seed file.
// Usage:  npm run create-super-admin -- admin@rub.edu.bt
// It asks for the password (or reads SUPER_ADMIN_PASSWORD from the environment).
import 'dotenv/config';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { Validator } from '../src/utils/validate.js';
import { hashPassword } from '../src/services/authService.js';
import * as users from '../src/models/userModel.js';
import { closePool } from '../src/config/db.js';

async function main() {
  const email = process.argv[2];
  let password = process.env.SUPER_ADMIN_PASSWORD;
  if (!password) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    password = await rl.question('Password for the Super Admin (8+ characters, letters and numbers): ');
    rl.close();
  }
  const v = new Validator({ email, password });
  const cleanEmail = v.email('email');
  v.password('password');
  if (!v.ok) {
    console.error(Object.values(v.fields).join('\n'));
    process.exitCode = 1;
    return;
  }
  const existing = await users.findByEmail(cleanEmail);
  const hash = await hashPassword(password);
  if (existing) {
    await users.setPassword(existing.user_id, hash);
    await users.updateRoleStatus(existing.user_id, { role: 'Super Admin', status: 'Active' });
    await users.markVerified(existing.user_id);
    console.log(`${cleanEmail} is now a Super Admin (password updated).`);
  } else {
    await users.create({ email: cleanEmail, passwordHash: hash, role: 'Super Admin', emailVerified: true });
    console.log(`Super Admin ${cleanEmail} created. Sign in and complete the profile.`);
  }
}

main()
  .catch((err) => {
    console.error(`Could not create the Super Admin: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => closePool());
