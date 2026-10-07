import { Link, useParams, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import DefinitionList from '../../components/DefinitionList.jsx';
import Notice from '../../components/Notice.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get } from '../../api/client.js';
import { formatDate, money } from '../../utils/format.js';

// F-10
export default function RoomPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const checkIn = params.get('check_in');
  const checkOut = params.get('check_out');
  const { data, error, loading, reload } = useApiData(() => get(`/rooms/${id}`, { check_in: checkIn, check_out: checkOut }), [id, checkIn, checkOut]);
  const back = { to: `/rooms${checkIn ? `?check_in=${checkIn}&check_out=${checkOut}` : ''}`, label: 'Back to rooms' };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  const { room, rates } = data;
  const shared = room.room_type === 'Dormitory';

  return (
    <>
      <PageHeader back={back} title={`Room ${room.room_number} · ${room.room_type}`} subtitle={room.guest_house_name} />
      <div className="grid grid--2">
        <section className="ui-card">
          <h2>About this room</h2>
          <DefinitionList
            items={[
              ['Guest house', room.guest_house_name],
              ['Where', room.guest_house_location],
              ['Beds', room.total_beds],
              ['Details', room.description],
            ]}
          />
        </section>
        <section className="ui-card">
          <h2>{checkIn ? `For ${formatDate(checkIn)} → ${formatDate(checkOut)}` : 'Rates'}</h2>
          <DefinitionList
            items={[
              ...(room.free_beds !== null ? [['Free beds', `${room.free_beds} of ${room.total_beds}`]] : []),
              ...Object.entries(rates).map(([type, amount]) => [type, `${money(amount)} per bed per night`]),
            ]}
          />
        </section>
      </div>
      {shared && <Notice type="warning">This is a shared room: other guests may stay in it on your dates.</Notice>}
      {room.free_beds === 0 ? (
        <Notice type="danger">This room is full on these dates. Try other dates or another room.</Notice>
      ) : (
        <Link className="ui-btn ui-btn--primary" to={`/rooms/${room.room_id}/book${checkIn ? `?check_in=${checkIn}&check_out=${checkOut}` : ''}`}>
          Book this room
        </Link>
      )}
    </>
  );
}
