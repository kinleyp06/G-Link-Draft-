import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, useToast } from '../../components/ui';
import { post } from '../../api/client.js';

// F-06
export default function CheckEmail() {
  const email = useLocation().state?.email;
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function resend() {
    setBusy(true);
    try {
      await post('/auth/resend-verification', { email });
      toast.success('We sent a new link.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Check your email</h1>
      <p>
        We sent a link to <strong>{email || 'your email'}</strong>.
      </p>
      <p>Click the link to verify your account. It works for 24 hours. Check your spam folder too.</p>
      {email && (
        <Button variant="secondary" onClick={resend} loading={busy}>
          Resend email
        </Button>
      )}
      <div className="auth__links">
        <Link to="/sign-in">Back to sign in</Link>
      </div>
    </>
  );
}
