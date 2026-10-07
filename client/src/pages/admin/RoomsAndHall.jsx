import { useState } from 'react';
import { Button, Modal, Select, Table, TextInput, Textarea, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get, post, put } from '../../api/client.js';
import { applyServerError } from '../../utils/forms.js';

const KINDS = {
  rooms: { label: 'Rooms', one: 'room', id: 'room_id', path: '/admin/rooms' },
  halls: { label: 'Hall', one: 'hall', id: 'hall_id', path: '/admin/halls' },
  guest_houses: { label: 'Guest houses', one: 'guest house', id: 'guest_house_id', path: '/admin/guest-houses' },
};

const EMPTY = {
  rooms: { guest_house_id: '', room_number: '', room_type: '', total_beds: '1', description: '', status: 'Active' },
  halls: { guest_house_id: '', name: '', capacity: '', description: '', status: 'Active' },
  guest_houses: { name: '', location: '', description: '', contact_phone: '', status: 'Active' },
};

// F-25
export default function RoomsAndHall() {
  const toast = useToast();
  const [tab, setTab] = useState('rooms');
  const { data, error, loading, reload } = useApiData(() => get('/admin/catalog'), []);
  const [editing, setEditing] = useState(null); // { kind, id, form }
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  const houses = data.guest_houses.map((g) => ({ value: String(g.guest_house_id), label: g.name }));
  const k = KINDS[tab];

  const open = (row) => {
    setErrors({});
    const form = row
      ? Object.fromEntries(Object.keys(EMPTY[tab]).map((key) => [key, row[key] === null || row[key] === undefined ? '' : String(row[key])]))
      : { ...EMPTY[tab], ...(houses[0] && 'guest_house_id' in EMPTY[tab] ? { guest_house_id: houses[0].value } : {}) };
    setEditing({ kind: tab, id: row?.[k.id], form });
  };
  const set = (key) => (e) => setEditing((ed) => ({ ...ed, form: { ...ed.form, [key]: e.target.value } }));

  async function save(e) {
    e.preventDefault();
    const f = editing.form;
    const errs = {};
    if (editing.kind === 'rooms') {
      if (!f.room_number.trim()) errs.room_number = 'Enter the room number.';
      if (!f.room_type) errs.room_type = 'Choose the room type.';
      const beds = Number(f.total_beds);
      if (!Number.isInteger(beds) || beds < 1 || beds > 20) errs.total_beds = 'Between 1 and 20 beds.';
      else if (f.room_type === 'Single' && beds !== 1) errs.total_beds = 'A single room has 1 bed.';
    }
    if (editing.kind === 'halls') {
      if (!f.name.trim()) errs.name = 'Enter the hall name.';
      if (!(Number(f.capacity) >= 1)) errs.capacity = 'Enter how many people it seats.';
    }
    if (editing.kind === 'guest_houses') {
      if (!f.name.trim()) errs.name = 'Enter the name.';
      if (!f.location.trim()) errs.location = 'Enter the location.';
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const body = Object.fromEntries(Object.entries(f).map(([key, v]) => [key, v === '' ? null : ['guest_house_id', 'total_beds', 'capacity'].includes(key) ? Number(v) : v]));
    setBusy(true);
    try {
      const kind = KINDS[editing.kind];
      if (editing.id) await put(`${kind.path}/${editing.id}`, body);
      else await post(kind.path, body);
      toast.success(`${kind.one[0].toUpperCase()}${kind.one.slice(1)} saved.`);
      setEditing(null);
      reload();
    } catch (err) {
      applyServerError(err, setErrors, toast);
    } finally {
      setBusy(false);
    }
  }

  const edit = (row) => (
    <Button size="small" variant="secondary" onClick={() => open(row)}>
      Edit
    </Button>
  );
  const tables = {
    rooms: {
      columns: [
        { key: 'room_number', header: 'Room' },
        { key: 'guest_house_name', header: 'Guest house' },
        { key: 'room_type', header: 'Type' },
        { key: 'total_beds', header: 'Beds' },
        { key: 'status', header: 'Status', render: (r) => r.status },
        { key: 'e', header: '', render: edit },
      ],
      rows: data.rooms,
    },
    halls: {
      columns: [
        { key: 'name', header: 'Hall' },
        { key: 'guest_house_name', header: 'Guest house' },
        { key: 'capacity', header: 'Seats' },
        { key: 'status', header: 'Status', render: (r) => r.status },
        { key: 'e', header: '', render: edit },
      ],
      rows: data.halls,
    },
    guest_houses: {
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'location', header: 'Location' },
        { key: 'contact_phone', header: 'Phone' },
        { key: 'status', header: 'Status', render: (r) => r.status },
        { key: 'e', header: '', render: edit },
      ],
      rows: data.guest_houses,
    },
  };

  const f = editing?.form;
  return (
    <>
      <PageHeader title="Rooms and hall" actions={<Button onClick={() => open(null)}>+ Add {k.one}</Button>} />
      <div className="tabs" role="group" aria-label="Show">
        {Object.entries(KINDS).map(([key, v]) => (
          <Button key={key} variant="secondary" size="small" aria-pressed={tab === key} onClick={() => setTab(key)}>
            {v.label}
          </Button>
        ))}
      </div>
      <Table caption={k.label} rowKey={k.id} columns={tables[tab].columns} rows={tables[tab].rows} emptyMessage={`No ${k.label.toLowerCase()} yet.`} />

      <Modal
        open={Boolean(editing)}
        title={editing ? `${editing.id ? 'Edit' : 'Add'} ${KINDS[editing.kind].one}` : ''}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" form="catalog-form" loading={busy}>
              Save
            </Button>
          </>
        }
      >
        {f && (
          <form id="catalog-form" onSubmit={save} noValidate>
            {'guest_house_id' in f && <Select label="Guest house" value={f.guest_house_id} onChange={set('guest_house_id')} options={houses} error={errors.guest_house_id} required />}
            {editing.kind === 'rooms' && (
              <>
                <div className="form-row">
                  <TextInput label="Room number" value={f.room_number} onChange={set('room_number')} error={errors.room_number} maxLength={10} required />
                  <Select label="Type" placeholder="Choose…" value={f.room_type} onChange={set('room_type')} options={['Single', 'Double', 'Dormitory']} error={errors.room_type} required />
                  <TextInput label="Beds" type="number" min={1} max={20} value={f.total_beds} onChange={set('total_beds')} error={errors.total_beds} required />
                </div>
              </>
            )}
            {editing.kind === 'halls' && (
              <div className="form-row">
                <TextInput label="Name" value={f.name} onChange={set('name')} error={errors.name} maxLength={100} required />
                <TextInput label="Seats" type="number" min={1} value={f.capacity} onChange={set('capacity')} error={errors.capacity} required />
              </div>
            )}
            {editing.kind === 'guest_houses' && (
              <>
                <TextInput label="Name" value={f.name} onChange={set('name')} error={errors.name} maxLength={100} required />
                <TextInput label="Location" value={f.location} onChange={set('location')} error={errors.location} maxLength={100} required />
                <TextInput label="Contact phone" type="tel" value={f.contact_phone} onChange={set('contact_phone')} error={errors.contact_phone} maxLength={11} />
              </>
            )}
            <Textarea label="Description" value={f.description} onChange={set('description')} error={errors.description} maxLength={500} />
            <Select label="Status" value={f.status} onChange={set('status')} options={['Active', 'Inactive']} help="Inactive ones are hidden from guests." />
          </form>
        )}
      </Modal>
    </>
  );
}
