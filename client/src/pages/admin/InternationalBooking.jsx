import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox, DatePicker, Select, TextInput, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Notice from '../../components/Notice.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get, post } from '../../api/client.js';
import { addDaysStr, money, nights, todayStr } from '../../utils/format.js';
import { applyServerError } from '../../utils/forms.js';

const blank = () => ({ full_name: '', citizenship_id: '', nationality: '', gender: '', phone_number: '' });

// F-22: admin books for international guests (starts Approved)
export default function InternationalBooking() {
  const navigate = useNavigate();
  const toast = useToast();
  const [dates, setDates] = useState({ check_in: todayStr(1), check_out: todayStr(2) });
  const [roomId, setRoomId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [share, setShare] = useState(false);
  const [guests, setGuests] = useState([blank()]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const rooms = useApiData(() => (dates.check_out > dates.check_in ? get('/rooms', dates) : Promise.resolve(null)), [dates.check_in, dates.check_out]);
  const rate = rooms.data?.rates?.International;
  const room = rooms.data?.rooms.find((r) => String(r.room_id) === roomId);
  const setGuest = (i, k) => (e) => setGuests((list) => list.map((g, j) => (j === i ? { ...g, [k]: e.target.value } : g)));

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!roomId) errs.room_id = 'Choose a room.';
    if (dates.check_out <= dates.check_in) errs.check_out = 'Check-out must be after check-in.';
    guests.forEach((g, i) => {
      if (!g.full_name.trim()) errs[`guests[${i}].full_name`] = 'Enter the full name.';
      if (!g.citizenship_id.trim()) errs[`guests[${i}].citizenship_id`] = 'Enter the passport number.';
      if (!g.nationality.trim()) errs[`guests[${i}].nationality`] = 'Enter the nationality.';
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const { booking } = await post('/admin/bookings/international', {
        room_id: Number(roomId),
        ...dates,
        purpose,
        share_room: share,
        guests: guests.map((g) => Object.fromEntries(Object.entries(g).filter(([, v]) => v))),
      });
      toast.success(`Booking ${booking.ref} created and approved.`);
      navigate(`/admin/requests/${booking.booking_id}`);
    } catch (err) {
      applyServerError(err, setErrors, toast);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Book for an international guest" subtitle={rate !== undefined ? `International rate: ${money(rate)} per bed per night` : undefined} />
      <form className="ui-card" onSubmit={submit} noValidate>
        <h2>Stay</h2>
        <div className="form-row">
          <DatePicker label="Check-in" min={todayStr()} value={dates.check_in} onChange={(e) => setDates({ check_in: e.target.value, check_out: dates.check_out > e.target.value ? dates.check_out : addDaysStr(e.target.value, 1) })} error={errors.check_in} required />
          <DatePicker label="Check-out" min={dates.check_in} value={dates.check_out} onChange={(e) => setDates({ ...dates, check_out: e.target.value })} error={errors.check_out} required />
          <Select
            label="Room"
            placeholder={rooms.loading ? 'Loading…' : 'Choose…'}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            error={errors.room_id}
            options={(rooms.data?.rooms || []).map((r) => ({ value: String(r.room_id), label: `${r.room_number} · ${r.guest_house_name} (${r.free_beds} free)` }))}
            required
          />
        </div>
        <TextInput label="Purpose of visit" value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={255} />
        {room?.room_type === 'Double' && guests.length < room.total_beds && <Checkbox label="Guest agrees to share the room" checked={share} onChange={(e) => setShare(e.target.checked)} />}

        <h2 className="mt-4">Guests</h2>
        {guests.map((g, i) => (
          <fieldset key={i} className="guest-card">
            <div className="guest-card__head">
              <h3>Guest {i + 1}</h3>
              {guests.length > 1 && (
                <Button variant="danger" size="small" onClick={() => setGuests(guests.filter((_, j) => j !== i))}>
                  Remove
                </Button>
              )}
            </div>
            <div className="form-row">
              <TextInput label="Full name" value={g.full_name} onChange={setGuest(i, 'full_name')} error={errors[`guests[${i}].full_name`]} maxLength={50} required />
              <TextInput label="Passport no." value={g.citizenship_id} onChange={setGuest(i, 'citizenship_id')} error={errors[`guests[${i}].citizenship_id`]} maxLength={20} required />
            </div>
            <div className="form-row">
              <TextInput label="Nationality" value={g.nationality} onChange={setGuest(i, 'nationality')} error={errors[`guests[${i}].nationality`]} maxLength={50} required />
              <Select label="Gender" placeholder="Choose…" options={['Male', 'Female', 'Other']} value={g.gender} onChange={setGuest(i, 'gender')} />
              <TextInput label="Phone" type="tel" value={g.phone_number} onChange={setGuest(i, 'phone_number')} error={errors[`guests[${i}].phone_number`]} maxLength={15} />
            </div>
          </fieldset>
        ))}
        {(!room || guests.length < room.total_beds) && (
          <Button variant="secondary" onClick={() => setGuests([...guests, blank()])}>
            + Add another guest
          </Button>
        )}
        {room && rate !== undefined && dates.check_out > dates.check_in && (
          <Notice>
            Bill: {nights(dates.check_in, dates.check_out)} night(s) × {guests.length} bed(s) × {money(rate)} ={' '}
            <strong>{money(nights(dates.check_in, dates.check_out) * guests.length * rate)}</strong>
          </Notice>
        )}
        <div className="actions">
          <Button type="submit" loading={busy}>
            Create booking (approved)
          </Button>
        </div>
      </form>
    </>
  );
}
