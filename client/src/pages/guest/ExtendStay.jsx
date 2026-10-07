import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, DatePicker, Textarea, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Notice from '../../components/Notice.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get, post } from '../../api/client.js';
import { addDaysStr, formatDate, money, nights } from '../../utils/format.js';
import { applyServerError } from '../../utils/forms.js';

// F-17
export default function ExtendStay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, error, loading, reload } = useApiData(() => get(`/bookings/${id}`), [id]);
  const [form, setForm] = useState({ new_check_out: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  const b = data.booking;
  const extra = form.new_check_out > b.check_out ? nights(b.check_out, form.new_check_out) : 0;

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.new_check_out) errs.new_check_out = 'Choose the new check-out date.';
    else if (form.new_check_out <= b.check_out) errs.new_check_out = `Choose a date after ${formatDate(b.check_out)}.`;
    if (!form.reason.trim()) errs.reason = 'Tell the admin why.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await post(`/bookings/${b.booking_id}/extensions`, form);
      toast.success('Request sent. We will email you when the admin decides.');
      navigate(`/bookings/${b.booking_id}`);
    } catch (err) {
      applyServerError(err, setErrors, toast);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader back={{ to: `/bookings/${b.booking_id}`, label: `Booking ${b.ref}` }} title="Ask to stay longer" subtitle={`Booking ${b.ref} now ends on ${formatDate(b.check_out)}`} />
      <form className="ui-card form-narrow" onSubmit={submit} noValidate>
        <DatePicker label="New check-out date" min={addDaysStr(b.check_out, 1)} value={form.new_check_out} onChange={(e) => setForm({ ...form, new_check_out: e.target.value })} error={errors.new_check_out} required />
        {extra > 0 && (
          <p>
            {extra} extra night(s) × {b.beds} bed(s) × {money(b.rate_amount)} = <strong>{money(extra * b.beds * b.rate_amount)}</strong>
          </p>
        )}
        <Textarea label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} error={errors.reason} maxLength={255} required />
        <Notice>The admin checks the room is free and approves or rejects. You get an email.</Notice>
        <div className="actions">
          <Button type="submit" loading={busy}>
            Send request
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
