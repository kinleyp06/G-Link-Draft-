import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Loading from '../../components/Loading.jsx';
import Notice from '../../components/Notice.jsx';
import { post } from '../../api/client.js';

// The link in the verification email lands here.
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ status: 'loading', message: '' });
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    post('/auth/verify-email', { token: params.get('token') || '' })
      .then((r) => setState({ status: 'ok', message: r.message }))
      .catch((err) => setState({ status: 'error', message: err.message }));
  }, [params]);

  if (state.status === 'loading') return <Loading label="Checking your link…" />;
  return (
    <>
      <h1>{state.status === 'ok' ? 'Email verified' : 'Link not valid'}</h1>
      <Notice type={state.status === 'ok' ? 'success' : 'danger'}>{state.message}</Notice>
      <div className="auth__links">
        <Link to="/sign-in">{state.status === 'ok' ? 'Sign in now' : 'Back to sign in (you can ask for a new link there)'}</Link>
      </div>
    </>
  );
}
