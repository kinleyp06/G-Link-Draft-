import { useState } from 'react';
import { Button, DatePicker, Select, Table, TextInput, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { del, get, post } from '../../api/client.js';
import { addDaysStr, formatDate, todayStr } from '../../utils/format.js';
import { applyServerError } from '../../utils/forms.js';

// F-23
export default function BlockRooms() {
  const toast = useToast();
  const catalog = useApiData(() => get('/admin/catalog'), []);
  const blocks = useApiData(() => get('/admin/room-blocks'), []);
  const [form, setForm] = useState({ room_id: '', beds: '1', start_date: todayStr(), end_date: todayStr(1), reason: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const rooms = (catalog.data?.rooms || []).filter((r) => r.status === 'Active');
  const room = rooms.find((r) => String(r.room_id) === form.room_id);

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.room_id) errs.room_id = 'Choose a room.';
    const beds = Number(form.beds);
    if (!Number.isInteger(beds) || beds < 1) errs.beds = 'At least 1 bed.';
    else if (room && beds > room.total_beds) errs.beds = `Room ${room.room_number} has ${room.total_beds} bed(s).`;
    if (form.end_date <= form.start_date) errs.end_date = '"To" must be after "From".';
    if (!form.reason.trim()) errs.reason = 'Enter a reason.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await post('/admin/room-blocks', { ...form, room_id: Number(form.room_id), beds });
      toast.success('Beds blocked.');
      setForm({ ...form, reason: '' });
      blocks.reload();
    } catch (err) {
      applyServerError(err, setErrors, toast);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      await del(`/admin/room-blocks/${id}`);
      toast.success('Block removed.');
      blocks.reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <PageHeader title="Block rooms or beds" subtitle="Blocked beds cannot be booked on those dates (repairs, reserved for events…)." />
      {catalog.loading ? (
        <Loading />
      ) : (
        <form className="ui-card" onSubmit={submit} noValidate>
          <div className="form-row">
            <Select label="Room" placeholder="Choose…" value={form.room_id} onChange={set('room_id')} error={errors.room_id} options={rooms.map((r) => ({ value: String(r.room_id), label: `${r.room_number} · ${r.guest_house_name} (${r.total_beds} beds)` }))} required />
            <TextInput label={`Beds to block${room ? ` (of ${room.total_beds})` : ''}`} type="number" min={1} max={room?.total_beds} value={form.beds} onChange={set('beds')} error={errors.beds} required />
          </div>
          <div className="form-row">
            <DatePicker label="From" min={todayStr()} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value, end_date: form.end_date > e.target.value ? form.end_date : addDaysStr(e.target.value, 1) })} error={errors.start_date} required />
            <DatePicker label="To (first free day)" min={form.start_date} value={form.end_date} onChange={set('end_date')} error={errors.end_date} required />
          </div>
          <TextInput label="Reason" value={form.reason} onChange={set('reason')} error={errors.reason} maxLength={255} required />
          <Button type="submit" loading={busy}>
            Block
          </Button>
        </form>
      )}
      {blocks.loading && <Loading />}
      <ErrorMessage error={blocks.error} onRetry={blocks.reload} />
      {blocks.data && (
        <Table
          caption="Current and upcoming blocks"
          rowKey="room_block_id"
          emptyMessage="No blocks."
          columns={[
            { key: 'room', header: 'Room', render: (k) => `${k.room_number}, ${k.guest_house_name}` },
            { key: 'beds', header: 'Beds' },
            { key: 'from', header: 'From', render: (k) => formatDate(k.start_date) },
            { key: 'to', header: 'To', render: (k) => formatDate(k.end_date) },
            { key: 'reason', header: 'Reason' },
            {
              key: 'x',
              header: '',
              render: (k) => (
                <Button size="small" variant="secondary" onClick={() => remove(k.room_block_id)}>
                  Remove
                </Button>
              ),
            },
          ]}
          rows={blocks.data.blocks}
        />
      )}
    </>
  );
}
