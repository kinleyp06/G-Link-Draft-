import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, StatusBadge, Table } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get } from '../../api/client.js';
import { formatDate, money } from '../../utils/format.js';

const TABS = [
  ['upcoming', 'Upcoming'],
  ['past', 'Past'],
  ['', 'All'],
];

// F-15
export default function MyBookings() {
  const [when, setWhen] = useState('upcoming');
  const { data, error, loading, reload } = useApiData(() => get('/bookings/mine', { when }), [when]);

  return (
    <>
      <PageHeader
        title="My bookings"
        actions={
          <Link className="ui-btn ui-btn--primary" to="/rooms">
            Book a room
          </Link>
        }
      />
      <div className="tabs" role="group" aria-label="Show">
        {TABS.map(([key, label]) => (
          <Button key={label} variant="secondary" size="small" aria-pressed={when === key} onClick={() => setWhen(key)}>
            {label}
          </Button>
        ))}
      </div>
      {loading && <Loading />}
      <ErrorMessage error={error} onRetry={reload} />
      {data && (
        <Table
          caption="Bookings"
          rowKey="booking_id"
          emptyMessage={when === 'upcoming' ? 'No upcoming bookings. Find a room to book.' : 'No bookings here.'}
          columns={[
            { key: 'ref', header: 'Ref' },
            { key: 'room', header: 'Room', render: (b) => `${b.room_number}, ${b.guest_house_name}` },
            { key: 'check_in', header: 'Check-in', render: (b) => formatDate(b.check_in) },
            { key: 'check_out', header: 'Check-out', render: (b) => formatDate(b.check_out) },
            { key: 'total', header: 'Total', render: (b) => money(b.total_amount) },
            { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
            {
              key: 'open',
              header: '',
              render: (b) => (
                <Link className="ui-btn ui-btn--secondary ui-btn--small" to={`/bookings/${b.booking_id}`}>
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
