import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, TextInput, PasswordInput, useToast } from '../../components/ui';
import { post } from '../../api/client.js';
import { applyServerError, isEmail, passwordProblem } from '../../utils/forms.js';

// F-05: only email and password now; the profile comes later.
export default function SignUp() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!isEmail(form.email)) errs.email = 'Enter a valid email address.';
    const pw = passwordProblem(form.password);
    if (pw) errs.password = pw;
    if (form.confirm !== form.password) errs.confirm = 'The two passwords are not the same.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await post('/auth/signup', { email: form.email, password: form.password });
      navigate('/check-email', { state: { email: form.email.trim() } });
    } catch (err) {
      applyServerError(err, setErrors, toast);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Create an account</h1>
      <p className="muted">Only your email and a password now. You add your name and phone before booking.</p>
      <form onSubmit={submit} noValidate>
        <TextInput label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} help="Use your RUB email if you have one." required />
        <PasswordInput label="Password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} help="At least 8 characters, with letters and numbers." required />
        <PasswordInput label="Confirm password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} required />
        <Button type="submit" loading={busy} block>
          Create account
        </Button>
      </form>
      <div className="auth__links">
        <Link to="/sign-in">Already have an account? Sign in</Link>
      </div>
    </>
  );
}
