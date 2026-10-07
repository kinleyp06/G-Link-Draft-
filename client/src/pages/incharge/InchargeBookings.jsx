import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, StatusBadge, Table, TextInput } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get } from '../../api/client.js';
import { formatDate, money, personName } from '../../utils/format.js';

const RANGES = [
  ['today', 'Today'],
  ['week', 'This week'],
  ['all', 'All approved'],
];

export const guestName = (b) => (b.is_international ? 'International guest' : personName(b.user_first_name, b.user_last_name, b.user_email));

export function stayState(b) {
  if (b.checked_out_at) return 'Checked out';
  if (b.checked_in_at) return 'In house';
  return 'Not arrived';
}

// F-27
export default function InchargeBookings() {
  const [range, setRange] = useState('week');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const { data, error, loading, reload } = useApiData(() => get('/incharge/bookings', { range, q: search }), [range, search]);

  return (
    <>
      <PageHeader title="Bookings" subtitle="Approved stays." />
      <div className="tabs" role="group" aria-label="Show">
        {RANGES.map(([key, label]) => (
          <Button key={key} variant="secondary" size="small" aria-pressed={range === key} onClick={() => setRange(key)}>
            {label}
          </Button>
        ))}
      </div>
      <form
        className="form-narrow"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q);
        }}
      >
        <TextInput label="Search" value={q} onChange={(e) => setQ(e.target.value)} help="Ref, name, email or CID. Press Enter." />
      </form>
      {loading && <Loading />}
      <ErrorMessage error={error} onRetry={reload} />
      {data && (
        <Table
          caption={`${data.bookings.length} booking(s)`}
          rowKey="booking_id"
          emptyMessage="No approved bookings here."
          columns={[
            { key: 'ref', header: 'Ref' },
            { key: 'guest', header: 'Guest', render: guestName },
            { key: 'room', header: 'Room', render: (b) => b.room_number },
            { key: 'in', header: 'Check-in', render: (b) => formatDate(b.check_in) },
            { key: 'out', header: 'Check-out', render: (b) => formatDate(b.check_out) },
            { key: 'beds', header: 'Beds' },
            { key: 'state', header: 'Stay', render: (b) => (b.status === 'Completed' ? <StatusBadge status="Completed" /> : stayState(b)) },
            { key: 'due', header: 'Due', render: (b) => (b.amount_due > 0 ? money(b.amount_due) : 'Paid') },
            {
              key: 'go',
              header: '',
              render: (b) => (
                <Link className="ui-btn ui-btn--secondary ui-btn--small" to={`/incharge/desk?booking=${b.booking_id}`}>
                  Open
                </Link>
              ),
            },
          ]}
          rows={data.bookings}
        />
      )}
    </>
  );
}
