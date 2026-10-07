import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Modal, Select, StatusBadge, Table, Textarea, TextInput, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get, post } from '../../api/client.js';
import { formatDate, money, personName } from '../../utils/format.js';

const STATUSES = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'];

// F-20 list (room bookings and meeting hall requests)
export default function BookingRequests() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'hall' ? 'hall' : 'room';
  const status = params.get('status') ?? 'Pending';
  const [q, setQ] = useState(params.get('q') || '');
  const houses = useApiData(() => get('/guest-houses'), []);
  const guestHouseId = params.get('guest_house_id') || '';

  const update = (changes) => {
    const next = Object.fromEntries(Object.entries({ tab, status, q: params.get('q') || '', guest_house_id: guestHouseId, ...changes }).filter(([, v]) => v !== ''));
    if (next.tab === 'room') delete next.tab;
    setParams({ ...next, status: changes.status ?? status });
  };

  return (
    <>
      <PageHeader title="Booking requests" />
      <div className="tabs" role="group" aria-label="Kind">
        <Button variant="secondary" size="small" aria-pressed={tab === 'room'} onClick={() => update({ tab: 'room' })}>
          Rooms
        </Button>
        <Button variant="secondary" size="small" aria-pressed={tab === 'hall'} onClick={() => update({ tab: 'hall' })}>
          Meeting hall
        </Button>
      </div>
      <form
        className="ui-card"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q });
        }}
      >
        <div className="form-row">
          <Select label="Status" value={status} onChange={(e) => update({ status: e.target.value })} options={[{ value: '', label: 'All' }, ...STATUSES]} />
          {tab === 'room' && (
            <>
              <Select
                label="Guest house"
                value={guestHouseId}
                onChange={(e) => update({ guest_house_id: e.target.value })}
                placeholder="All"
                options={(houses.data?.guest_houses || []).map((g) => ({ value: String(g.guest_house_id), label: g.name }))}
              />
              <TextInput label="Search" value={q} onChange={(e) => setQ(e.target.value)} help="Name, email, CID or ref (GL-0012)" />
            </>
          )}
        </div>
        {tab === 'room' && <Button type="submit" variant="secondary">Search</Button>}
      </form>
      {tab === 'room' ? <RoomList status={status} q={params.get('q') || ''} guestHouseId={guestHouseId} /> : <HallList status={status} />}
    </>
  );
}

function RoomList({ status, q, guestHouseId }) {
  const { data, error, loading, reload } = useApiData(() => get('/admin/bookings', { status, q, guest_house_id: guestHouseId }), [status, q, guestHouseId]);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  return (
    <Table
      caption={`${data.bookings.length} booking(s)`}
      rowKey="booking_id"
      emptyMessage="No bookings match."
      columns={[
        { key: 'ref', header: 'Ref' },
        { key: 'guest', header: 'Guest', render: (b) => (b.is_international ? 'International guest' : personName(b.user_first_name, b.user_last_name, b.user_email)) },
        { key: 'room', header: 'Room', render: (b) => b.room_number },
        { key: 'in', header: 'Check-in', render: (b) => formatDate(b.check_in) },
        { key: 'out', header: 'Check-out', render: (b) => formatDate(b.check_out) },
        { key: 'beds', header: 'Beds' },
        { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
        {
          key: 'go',
          header: '',
          render: (b) => (
            <Link className="ui-btn ui-btn--secondary ui-btn--small" to={`/admin/requests/${b.booking_id}`}>
              {b.status === 'Pending' ? 'Review' : 'Open'}
            </Link>
          ),
        },
      ]}
      rows={data.bookings}
    />
  );
}

function HallList({ status }) {
  const toast = useToast();
  const { data, error, loading, reload } = useApiData(() => get('/admin/hall-bookings', { status }), [status]);
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [busy, setBusy] = useState(false);

  async function decide(h, approve) {
    if (!approve && !note.trim()) return setNoteError('Give the guest a reason.');
    setBusy(true);
    try {
      await post(`/admin/hall-bookings/${h.hall_booking_id}/${approve ? 'approve' : 'reject'}`, approve ? {} : { note });
      toast.success(`Hall booking ${h.ref} ${approve ? 'approved' : 'rejected'}.`);
      setRejecting(null);
      setNote('');
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  return (
    <>
      <Table
        caption={`${data.hall_bookings.length} hall booking(s)`}
        rowKey="hall_booking_id"
        emptyMessage="No hall bookings match."
        columns={[
          { key: 'ref', header: 'Ref' },
          { key: 'who', header: 'Booked by', render: (h) => personName(h.user_first_name, h.user_last_name, h.user_email) },
          { key: 'hall', header: 'Hall', render: (h) => h.hall_name },
          { key: 'date', header: 'Date', render: (h) => formatDate(h.event_date) },
          { key: 'time', header: 'Time', render: (h) => `${h.start_time}–${h.end_time}` },
          { key: 'people', header: 'People', render: (h) => h.attendees },
          { key: 'purpose', header: 'Purpose' },
          { key: 'total', header: 'Total', render: (h) => money(h.total_amount) },
          { key: 'status', header: 'Status', render: (h) => <StatusBadge status={h.status} /> },
          {
            key: 'act',
            header: '',
            render: (h) =>
              h.status === 'Pending' && (
                <div className="actions" style={{ marginTop: 0 }}>
                  <Button size="small" onClick={() => decide(h, true)} disabled={busy}>
                    Approve
                  </Button>
                  <Button size="small" variant="danger" onClick={() => setRejecting(h)}>
                    Reject
                  </Button>
                </div>
              ),
          },
        ]}
        rows={data.hall_bookings}
      />
      <Modal
        open={Boolean(rejecting)}
        title={`Reject ${rejecting?.ref}?`}
        onClose={() => setRejecting(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={() => decide(rejecting, false)}>
              Reject
            </Button>
          </>
        }
      >
        <Textarea label="Reason (the guest will see this)" value={note} onChange={(e) => setNote(e.target.value)} error={noteError} maxLength={255} required />
      </Modal>
    </>
  );
}
