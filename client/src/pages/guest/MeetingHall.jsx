import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, DatePicker, Select, StatusBadge, Table, TextInput, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Notice from '../../components/Notice.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { get, post } from '../../api/client.js';
import { formatDate, GUEST_TYPES, money, todayStr } from '../../utils/format.js';
import { applyServerError } from '../../utils/forms.js';

// F-18
export default function MeetingHall() {
  const toast = useToast();
  const { profileComplete } = useAuth();
  const halls = useApiData(() => get('/halls'), []);
  const mine = useApiData(() => get('/hall-bookings/mine'), []);
  const [form, setForm] = useState({ hall_id: '', event_date: todayStr(1), start_time: '09:00', end_time: '13:00', attendees: '', purpose: '', guest_type: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const hallId = form.hall_id || String(halls.data?.halls[0]?.hall_id || '');
  const slots = useApiData(() => (hallId && form.event_date ? get('/hall-bookings/slots', { hall_id: hallId, date: form.event_date }) : Promise.resolve({ slots: [] })), [hallId, form.event_date]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (halls.loading) return <Loading />;
  if (halls.error) return <ErrorMessage error={halls.error} onRetry={halls.reload} />;
  const list = halls.data.halls;
  const hall = list.find((h) => String(h.hall_id) === hallId);

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.event_date) errs.event_date = 'Choose a date.';
    else if (form.event_date < todayStr()) errs.event_date = 'The date cannot be in the past.';
    if (!form.start_time) errs.start_time = 'Choose a start time.';
    if (!form.end_time || form.end_time <= form.start_time) errs.end_time = 'End time must be after start time.';
    const n = Number(form.attendees);
    if (!Number.isInteger(n) || n < 1) errs.attendees = 'Enter the number of people.';
    else if (hall && n > hall.capacity) errs.attendees = `The hall seats ${hall.capacity}.`;
    if (!form.purpose.trim()) errs.purpose = 'Enter the purpose.';
    if (!form.guest_type) errs.guest_type = 'Choose your guest type.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const { hall_booking } = await post('/hall-bookings', { ...form, hall_id: Number(hallId), attendees: n });
      toast.success(`Request ${hall_booking.ref} sent. We will email you when the admin decides.`);
      mine.reload();
      slots.reload();
    } catch (err) {
      applyServerError(err, setErrors, toast);
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id) {
    try {
      await post(`/hall-bookings/${id}/cancel`);
      toast.success('Hall booking cancelled.');
      mine.reload();
      slots.reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <PageHeader title="Meeting hall" />
      {list.length === 0 && <Notice>No meeting hall can be booked right now.</Notice>}
      {hall && (
        <section className="ui-card">
          <h2>{hall.name}</h2>
          <p>
            {hall.guest_house_name} · seats {hall.capacity}. {hall.description}
          </p>
          <p className="muted">
            Rate per day:{' '}
            {Object.entries(halls.data.rates)
              .filter(([t]) => t !== 'International')
              .map(([t, a]) => `${t} ${money(a)}`)
              .join(' · ')}
          </p>
        </section>
      )}
      {list.length > 0 && !profileComplete && (
        <Notice type="warning">
          Add your name and phone number in your <Link to="/profile">profile</Link> before booking.
        </Notice>
      )}
      {list.length > 0 && profileComplete && (
        <form className="ui-card" onSubmit={submit} noValidate>
          <h2>Request the hall</h2>
          {list.length > 1 && (
            <Select label="Hall" value={hallId} onChange={set('hall_id')} options={list.map((h) => ({ value: String(h.hall_id), label: h.name }))} />
          )}
          <div className="form-row">
            <DatePicker label="Date" min={todayStr()} value={form.event_date} onChange={set('event_date')} error={errors.event_date} required />
            <TextInput label="From" type="time" value={form.start_time} onChange={set('start_time')} error={errors.start_time} required />
            <TextInput label="To" type="time" value={form.end_time} onChange={set('end_time')} error={errors.end_time} required />
          </div>
          {slots.data?.slots.length > 0 && (
            <Notice type="warning">
              Already taken that day: {slots.data.slots.map((s) => `${s.start_time}–${s.end_time}`).join(', ')}
            </Notice>
          )}
          <div className="form-row">
            <TextInput label="Number of people" type="number" min={1} value={form.attendees} onChange={set('attendees')} error={errors.attendees} required />
            <Select label="Guest type" placeholder="Choose…" options={GUEST_TYPES} value={form.guest_type} onChange={set('guest_type')} error={errors.guest_type} required />
          </div>
          <TextInput label="Purpose" value={form.purpose} onChange={set('purpose')} error={errors.purpose} maxLength={255} required />
          <Button type="submit" loading={busy}>
            Request hall
          </Button>
        </form>
      )}
      <section className="ui-card">
        <h2>My hall bookings</h2>
        {mine.loading && <Loading />}
        <ErrorMessage error={mine.error} onRetry={mine.reload} />
        {mine.data && (
          <Table
            rowKey="hall_booking_id"
            emptyMessage="No hall bookings yet."
            columns={[
              { key: 'ref', header: 'Ref' },
              { key: 'date', header: 'Date', render: (h) => formatDate(h.event_date) },
              { key: 'time', header: 'Time', render: (h) => `${h.start_time}–${h.end_time}` },
              { key: 'purpose', header: 'Purpose' },
              { key: 'total', header: 'Total', render: (h) => money(h.total_amount) },
              { key: 'status', header: 'Status', render: (h) => <StatusBadge status={h.status} /> },
              {
                key: 'act',
                header: '',
                render: (h) =>
                  ['Pending', 'Approved'].includes(h.status) && (
                    <Button variant="secondary" size="small" onClick={() => cancel(h.hall_booking_id)}>
                      Cancel
                    </Button>
                  ),
              },
            ]}
            rows={mine.data.hall_bookings}
          />
        )}
      </section>
    </>
  );
}
