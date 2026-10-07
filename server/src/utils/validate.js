import { AppError } from './AppError.js';
import { isValidDate } from './dates.js';

// Collects problems per field, then throws one 400 error listing them all.
//   const v = new Validator(req.body);
//   const email = v.email('email');
//   v.done();
export class Validator {
  constructor(source = {}) {
    this.source = source ?? {};
    this.fields = {};
  }

  fail(field, message) {
    if (!this.fields[field]) this.fields[field] = message;
    return undefined;
  }

  raw(field) {
    const value = this.source[field];
    return typeof value === 'string' ? value.trim() : value;
  }

  string(field, { label = field, required = true, max = 255, min = 0 } = {}) {
    const value = this.raw(field);
    if (value === undefined || value === null || value === '') {
      return required ? this.fail(field, `${label} is required.`) : null;
    }
    if (typeof value !== 'string') return this.fail(field, `${label} must be text.`);
    if (value.length < min) return this.fail(field, `${label} must be at least ${min} characters.`);
    if (value.length > max) return this.fail(field, `${label} must be ${max} characters or fewer.`);
    return value;
  }

  email(field, { label = 'Email' } = {}) {
    const value = this.string(field, { label, max: 100 });
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return this.fail(field, 'Enter a valid email address.');
    return value?.toLowerCase();
  }

  password(field, { label = 'Password' } = {}) {
    const value = this.source[field];
    if (typeof value !== 'string' || value === '') return this.fail(field, `${label} is required.`);
    if (value.length < 8) return this.fail(field, `${label} must be at least 8 characters.`);
    if (value.length > 72) return this.fail(field, `${label} must be 72 characters or fewer.`);
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return this.fail(field, `${label} must have letters and numbers.`);
    return value;
  }

  int(field, { label = field, required = true, min = -Infinity, max = Infinity } = {}) {
    const value = this.source[field];
    if (value === undefined || value === null || value === '') {
      return required ? this.fail(field, `${label} is required.`) : null;
    }
    const n = Number(value);
    if (!Number.isInteger(n)) return this.fail(field, `${label} must be a whole number.`);
    if (n < min || n > max) return this.fail(field, `${label} must be between ${min} and ${max}.`);
    return n;
  }

  money(field, { label = field } = {}) {
    const value = this.source[field];
    const n = Number(value);
    if (value === undefined || value === null || value === '' || Number.isNaN(n)) return this.fail(field, `${label} is required.`);
    if (n < 0) return this.fail(field, `${label} cannot be negative.`);
    if (Math.round(n * 100) !== n * 100) return this.fail(field, `${label} can have at most 2 decimal places.`);
    if (n > 99999999) return this.fail(field, `${label} is too large.`);
    return n;
  }

  date(field, { label = field, required = true } = {}) {
    const value = this.raw(field);
    if (value === undefined || value === null || value === '') {
      return required ? this.fail(field, `${label} is required.`) : null;
    }
    if (!isValidDate(value)) return this.fail(field, `${label} must be a date like 2026-10-12.`);
    return value;
  }

  time(field, { label = field } = {}) {
    const value = this.raw(field);
    if (!value) return this.fail(field, `${label} is required.`);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return this.fail(field, `${label} must be a time like 09:30.`);
    return value;
  }

  oneOf(field, allowed, { label = field, required = true } = {}) {
    const value = this.raw(field);
    if (value === undefined || value === null || value === '') {
      return required ? this.fail(field, `${label} is required.`) : null;
    }
    if (!allowed.includes(value)) return this.fail(field, `${label} must be one of: ${allowed.join(', ')}.`);
    return value;
  }

  bool(field, { fallback = false } = {}) {
    const value = this.source[field];
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 1 || value === '1') return true;
    if (value === 'false' || value === 0 || value === '0') return false;
    return this.fail(field, `${field} must be true or false.`);
  }

  phone(field, { label = 'Phone number', required = false, max = 11 } = {}) {
    const value = this.string(field, { label, required, max });
    if (value && !/^\+?\d{7,15}$/.test(value)) return this.fail(field, `${label} must be digits only, e.g. 17123456.`);
    return value;
  }

  // Merges problems from a nested list, e.g. guests[0].full_name
  merge(prefix, other) {
    for (const [k, msg] of Object.entries(other.fields)) this.fail(`${prefix}.${k}`, msg);
  }

  get ok() {
    return Object.keys(this.fields).length === 0;
  }

  done() {
    if (!this.ok) {
      const first = Object.values(this.fields)[0];
      throw new AppError(first, 400, 'VALIDATION_ERROR', this.fields);
    }
  }
}

export function idParam(value, label = 'id') {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new AppError(`Invalid ${label}.`, 400, 'VALIDATION_ERROR');
  return n;
}
