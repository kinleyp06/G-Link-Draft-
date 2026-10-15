import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, PasswordInput, Select, TextInput, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Notice from '../../components/Notice.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { patch, post } from '../../api/client.js';
import { applyServerError, passwordProblem } from '../../utils/forms.js';

// F-08 profile (also where everyone adds name and phone after sign up)
export default function Profile() {
  const { user, profileComplete, setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const returnTo = useLocation().state?.returnTo;
  const [form, setForm] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone_number: user.phone_number || '',
    citizenship_id: user.citizenship_id || '',
    gender: user.gender || '',
    sid: user.sid || '',
    department: user.department || '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current_password: '', new_password: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwBusy, setPwBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Enter your first name.';
    if (!form.last_name.trim()) errs.last_name = 'Enter your last name.';
    if (!/^\+?\d{7,11}$/.test(form.phone_number)) errs.phone_number = 'Digits only, e.g. 17123456.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const data = await patch('/users/me', form);
      setUser(data.user, data.profile_complete);
      toast.success('Profile saved.');
      if (returnTo) navigate(returnTo);
    } catch (err) {
      applyServerError(err, setErrors, toast);
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    const errs = {};
    if (!pw.current_password) errs.current_password = 'Enter your current password.';
    const p = passwordProblem(pw.new_password);
    if (p) errs.new_password = p;
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setPwBusy(true);
    try {
      await post('/users/me/password', pw);
      toast.success('Password changed.');
      setPw({ current_password: '', new_password: '' });
    } catch (err) {
      applyServerError(err, setPwErrors, toast);
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Profile" subtitle={user.email} />
      {!profileComplete && <Notice type="warning">Add your name and phone number so you can book.</Notice>}
      <form className="ui-card form-narrow" onSubmit={save} noValidate>
        <h2>Your details</h2>
        <div className="form-row">
          <TextInput label="First name" value={form.first_name} onChange={set('first_name')} error={errors.first_name} maxLength={20} autoComplete="given-name" required />
          <TextInput label="Last name" value={form.last_name} onChange={set('last_name')} error={errors.last_name} maxLength={20} autoComplete="family-name" required />
        </div>
        <div className="form-row">
          <TextInput label="Phone number" type="tel" value={form.phone_number} onChange={set('phone_number')} error={errors.phone_number} maxLength={11} autoComplete="tel" required />
          <Select label="Gender" placeholder="Choose…" options={['Male', 'Female', 'Other']} value={form.gender} onChange={set('gender')} error={errors.gender} />
        </div>
        <TextInput label="CID number" value={form.citizenship_id} onChange={set('citizenship_id')} error={errors.citizenship_id} maxLength={20} help="Needed at check-in." />
        <div className="form-row">
          <TextInput label="Staff / student ID" value={form.sid} onChange={set('sid')} error={errors.sid} maxLength={20} />
          <TextInput label="Department" value={form.department} onChange={set('department')} error={errors.department} maxLength={50} />
        </div>
        <Button type="submit" loading={busy}>
          Save profile
        </Button>
      </form>
      <form className="ui-card form-narrow" onSubmit={changePassword} noValidate>
        <h2>Change password</h2>
        <PasswordInput label="Current password" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} error={pwErrors.current_password} required />
        <PasswordInput label="New password" autoComplete="new-password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} error={pwErrors.new_password} help="At least 8 characters, with letters and numbers." required />
        <Button type="submit" variant="secondary" loading={pwBusy}>
          Change password
        </Button>
      </form>
    </>
  );
}
