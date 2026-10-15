import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, TextInput, useToast } from '../../components/ui';
import Notice from '../../components/Notice.jsx';
import { post } from '../../api/client.js';
import { isEmail } from '../../utils/forms.js';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!isEmail(email)) return setError('Enter a valid email address.');
    setError('');
    setBusy(true);
    try {
      const r = await post('/auth/forgot-password', { email });
      setDone(r.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Forgot password</h1>
      {done ? (
        <Notice type="success">{done}</Notice>
      ) : (
        <form onSubmit={submit} noValidate>
          <p className="muted">We will email you a link to choose a new password.</p>
          <TextInput label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} required />
          <Button type="submit" loading={busy} block>
            Send reset link
          </Button>
        </form>
      )}
      <div className="auth__links">
        <Link to="/sign-in">Back to sign in</Link>
      </div>
    </>
  );
}
