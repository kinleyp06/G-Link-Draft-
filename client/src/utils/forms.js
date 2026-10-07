// Reads a server error and shows field messages under their boxes, or a toast for the rest.
export function applyServerError(err, setErrors, toast) {
  const fields = err?.fields || {};
  if (Object.keys(fields).length > 0) {
    setErrors?.(fields);
    toast?.error(err.message);
  } else {
    toast?.error(err?.message || 'Something went wrong. Please try again.');
  }
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function passwordProblem(value) {
  if (!value) return 'Enter a password.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Password must have letters and numbers.';
  return '';
}
