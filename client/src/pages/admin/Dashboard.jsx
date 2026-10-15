import { Link } from 'react-router-dom';
import { StatusBadge, Table } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get } from '../../api/client.js';
import { formatDate, personName } from '../../utils/format.js';

// F-19
export default function Dashboard() {
  const { data, error, loading, reload } = useApiData(() => get('/admin/dashboard'), []);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  const c = data.counts;
  const tiles = [
    ['Pending requests', c.pending_bookings, '/admin/requests'],
    ['Extension requests', c.pending_extensions, '/admin/extensions'],
    ['Hall requests', c.pending_hall_bookings, '/admin/requests?tab=hall'],
    ['Guests in house', c.guests_in_house],
    ['Arrivals today', c.arrivals_today],
    ['Free beds tonight', `${c.free_beds_tonight} / ${c.total_beds}`],
  ];
  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Today is ${formatDate(data.today)}`} />
      <div className="grid grid--3">
        {tiles.map(([label, value, to]) => (
          <div key={label} className="stat">
            <p className="stat__label">{to ? <Link to={to}>{label}</Link> : label}</p>
            <p className="stat__value">{value}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-4">Needs your action</h2>
      <Table
        caption="Pending booking requests (earliest check-in first)"
        rowKey="booking_id"
        emptyMessage="Nothing waiting. Well done."
        columns={[
          { key: 'ref', header: 'Ref' },
          { key: 'guest', header: 'Guest', render: (b) => personName(b.user_first_name, b.user_last_name, b.user_email) },
          { key: 'room', header: 'Room', render: (b) => `${b.room_number}, ${b.guest_house_name}` },
          { key: 'dates', header: 'Dates', render: (b) => `${formatDate(b.check_in, { year: false })} → ${formatDate(b.check_out, { year: false })}` },
          { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
          {
            key: 'go',
            header: '',
            render: (b) => (
              <Link className="ui-btn ui-btn--secondary ui-btn--small" to={`/admin/requests/${b.booking_id}`}>
                Review
              </Link>
            ),
          },
        ]}
        rows={data.pending}
      />
    </>
  );
}
