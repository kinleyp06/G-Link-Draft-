import { Link } from 'react-router-dom';
import { Table } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get } from '../../api/client.js';
import { formatDate, money, personName } from '../../utils/format.js';
import { guestName } from './InchargeBookings.jsx';

const columns = [
  { key: 'ref', header: 'Ref' },
  { key: 'guest', header: 'Guest', render: guestName },
  { key: 'room', header: 'Room', render: (b) => `${b.room_number}, ${b.guest_house_name}` },
  { key: 'dates', header: 'Dates', render: (b) => `${formatDate(b.check_in, { year: false })} → ${formatDate(b.check_out, { year: false })}` },
  { key: 'beds', header: 'Beds' },
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
];

// The incharge's day at a glance
export default function Today() {
  const { data, error, loading, reload } = useApiData(() => get('/incharge/today'), []);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  return (
    <>
      <PageHeader title="Today" subtitle={formatDate(data.today)} />
      <div className="grid grid--4">
        {[
          ['Arriving', data.arrivals.length],
          ['Leaving', data.departures.length],
          ['In house', data.in_house.reduce((s, b) => s + b.beds, 0) + ' guest(s)'],
          ['Hall events', data.hall_today.length],
        ].map(([label, value]) => (
          <div key={label} className="stat">
            <p className="stat__label">{label}</p>
            <p className="stat__value">{value}</p>
          </div>
        ))}
      </div>
      {data.overdue.length > 0 && (
        <>
          <h2 className="mt-4">Should have left</h2>
          <Table caption="Checked in, check-out date passed" rowKey="booking_id" columns={columns} rows={data.overdue} />
        </>
      )}
      <h2 className="mt-4">Arriving today</h2>
      <Table rowKey="booking_id" columns={columns} rows={data.arrivals} emptyMessage="Nobody else is arriving today." />
      <h2 className="mt-4">Leaving today</h2>
      <Table rowKey="booking_id" columns={columns} rows={data.departures} emptyMessage="Nobody is leaving today." />
      <h2 className="mt-4">In the house</h2>
      <Table rowKey="booking_id" columns={columns} rows={data.in_house} emptyMessage="No guests checked in." />
      <h2 className="mt-4">Meeting hall today</h2>
      <Table
        rowKey="hall_booking_id"
        emptyMessage="No hall events today."
        columns={[
          { key: 'ref', header: 'Ref' },
          { key: 'hall_name', header: 'Hall' },
          { key: 'time', header: 'Time', render: (h) => `${h.start_time}–${h.end_time}` },
          { key: 'who', header: 'Booked by', render: (h) => personName(h.user_first_name, h.user_last_name, h.user_email) },
          { key: 'attendees', header: 'People' },
          { key: 'due', header: 'Due', render: (h) => (h.amount_due > 0 ? money(h.amount_due) : 'Paid') },
        ]}
        rows={data.hall_today}
      />
    </>
  );
}
