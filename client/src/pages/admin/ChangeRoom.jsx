import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Select, TextInput, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Notice from '../../components/Notice.jsx';
import DefinitionList from '../../components/DefinitionList.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get, post } from '../../api/client.js';
import { formatDate, personName } from '../../utils/format.js';
import { applyServerError } from '../../utils/forms.js';

const parseRef = (s) => Number(/^\s*(?:gl-?)?0*(\d+)\s*$/i.exec(s || '')?.[1] || 0);

// F-24
export default function ChangeRoom() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const id = Number(params.get('booking') || 0);
  const [refInput, setRefInput] = useState(id ? `GL-${String(id).padStart(4, '0')}` : '');
  const [refError, setRefError] = useState('');
  const [form, setForm] = useState({ room_id: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const options = useApiData(() => (id ? get(`/admin/bookings/${id}/rooms`) : Promise.resolve(null)), [id]);

  function find(e) {
    e.preventDefault();
    const n = parseRef(refInput);
    if (!n) return setRefError('Enter a booking ref like GL-0012.');
    setRefError('');
    setForm({ room_id: '', reason: '' });
    setParams({ booking: String(n) });
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.room_id) return setErrors({ room_id: 'Choose the new room.' });
    setBusy(true);
    try {
      const { booking } = await post(`/admin/bookings/${id}/change-room`, { room_id: Number(form.room_id), reason: form.reason || undefined });
      toast.success(`${booking.ref} moved to room ${booking.room_number}. The guest has been emailed.`);
      setForm({ room_id: '', reason: '' });
      options.reload();
    } catch (err) {
      applyServerError(err, setErrors, toast);
    } finally {
      setBusy(false);
    }
  }

  const b = options.data?.booking;
  const fits = (options.data?.rooms || []).filter((r) => r.fits);
  const movable = b && ['Pending', 'Approved'].includes(b.status);

  return (
    <>
      <PageHeader title="Change room" />
      <form className="ui-card form-narrow" onSubmit={find} noValidate>
        <TextInput label="Booking ref" value={refInput} onChange={(e) => setRefInput(e.target.value)} error={refError} help="e.g. GL-0012" />
        <Button type="submit" variant="secondary">
          Find booking
        </Button>
      </form>
      {options.loading && id > 0 && <Loading />}
      <ErrorMessage error={options.error} onRetry={options.reload} />
      {b && (
        <section className="ui-card">
          <h2>Current</h2>
          <DefinitionList
            items={[
              ['Booking', `${b.ref} · ${b.status}`],
              ['Guest', b.is_international ? 'International guest' : personName(b.user_first_name, b.user_last_name, b.user_email)],
              ['Room', `${b.room_number} (${b.room_type}), ${b.guest_house_name}`],
              ['Dates', `${formatDate(b.check_in)} → ${formatDate(b.check_out)}`],
              ['Beds', b.beds],
            ]}
          />
          {!movable ? (
            <Notice type="warning">A {b.status} booking cannot be moved.</Notice>
          ) : fits.length === 0 ? (
            <Notice type="warning">No other room has {b.beds} free bed(s) on these dates.</Notice>
          ) : (
            <form onSubmit={submit} noValidate className="mt-4">
              <Select
                label="Move to room"
                placeholder="Choose…"
                value={form.room_id}
                onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                error={errors.room_id}
                options={fits.map((r) => ({ value: String(r.room_id), label: `${r.room_number} · ${r.guest_house_name} · ${r.room_type} (${r.free_beds} free)` }))}
                help="Only rooms with enough free beds on these dates are listed."
                required
              />
              <TextInput label="Reason (sent to the guest)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} maxLength={255} />
              <Button type="submit" loading={busy}>
                Change room
              </Button>
            </form>
          )}
        </section>
      )}
    </>
  );
}
