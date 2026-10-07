import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, TextInput, PasswordInput, useToast } from '../../components/ui';
import Notice from '../../components/Notice.jsx';
import { useAuth, homeFor } from '../../auth/AuthContext.jsx';
import { isEmail } from '../../utils/forms.js';
import { post } from '../../api/client.js';

// F-04
export default function SignIn() {
  const { login, notice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!isEmail(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Enter your password.';
    setErrors(errs);
    setFormError('');
    setUnverified(false);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      navigate(location.state?.from || homeFor(user), { replace: true });
    } catch (err) {
      setFormError(err.message);
      setUnverified(err.code === 'EMAIL_NOT_VERIFIED');
      setErrors(err.fields || {});
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    try {
      await post('/auth/resend-verification', { email: form.email });
      toast.info('If your account needs verifying, a new link is on its way.');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <h1>Sign in</h1>
      <p className="muted">Book a room at an RUB guest house.</p>
      {notice && !formError && <Notice type="info">{notice}</Notice>}
      <form onSubmit={submit} noValidate>
        <TextInput label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} required />
        <PasswordInput label="Password" autoComplete="current-password" value={form.password} onChange={set('password')} error={errors.password} required />
        {formError && (
          <p className="ui-error" role="alert">
            {formError}
          </p>
        )}
        {unverified && (
          <Button variant="secondary" size="small" onClick={resend}>
            Send the link again
          </Button>
        )}
        <div className="actions">
          <Button type="submit" loading={busy} block>
            Sign in
          </Button>
        </div>
      </form>
      <div className="auth__links">
        <Link to="/sign-up">New here? Create an account</Link>
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
    </>
  );
}
