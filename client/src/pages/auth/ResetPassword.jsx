import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, PasswordInput, useToast } from '../../components/ui';
import { post } from '../../api/client.js';
import { applyServerError, passwordProblem } from '../../utils/forms.js';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    const pw = passwordProblem(form.password);
    if (pw) errs.password = pw;
    if (form.confirm !== form.password) errs.confirm = 'The two passwords are not the same.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const r = await post('/auth/reset-password', { token: params.get('token') || '', password: form.password });
      toast.success(r.message);
      navigate('/sign-in');
    } catch (err) {
      applyServerError(err, setErrors, toast);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Choose a new password</h1>
      <form onSubmit={submit} noValidate>
        <PasswordInput label="New password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} help="At least 8 characters, with letters and numbers." required />
        <PasswordInput label="Confirm new password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} required />
        <Button type="submit" loading={busy} block>
          Save new password
        </Button>
      </form>
      <div className="auth__links">
        <Link to="/forgot-password">Need a new link?</Link>
      </div>
    </>
  );
}
