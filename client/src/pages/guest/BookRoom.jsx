import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Checkbox, DatePicker, Select, Table, TextInput, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Notice from '../../components/Notice.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { get, post } from '../../api/client.js';
import { addDaysStr, formatDate, GUEST_TYPES, money, todayStr } from '../../utils/format.js';
import { applyServerError } from '../../utils/forms.js';

const STEPS = ['Details', 'Guests', 'Shared room', 'Bill'];
const blankGuest = () => ({ full_name: '', gender: '', citizenship_id: '', phone_number: '' });

// F-11 booking form, F-12 extra guests, F-13 shared-room notice, F-14 bill
export default function BookRoom() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { profileComplete } = useAuth();
  const room = useApiData(() => get(`/rooms/${id}`), [id]);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    check_in: params.get('check_in') || todayStr(1),
    check_out: params.get('check_out') || todayStr(2),
    guest_type: '',
    purpose: '',
    share_room: true,
  });
  const [guests, setGuests] = useState([]);
  const [understood, setUnderstood] = useState(false);
  const [errors, setErrors] = useState({});
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);

  if (room.loading) return <Loading />;
  if (room.error) return <ErrorMessage error={room.error} onRetry={room.reload} />;
  const r = room.data.room;
  const back = { to: `/rooms/${r.room_id}?check_in=${form.check_in}&check_out=${form.check_out}`, label: `Room ${r.room_number}` };

  if (!profileComplete) {
    return (
      <>
        <PageHeader back={back} title={`Book room ${r.room_number}`} />
        <Notice type="warning" title="Complete your profile first">
          <p>We need your name and phone number before you can book.</p>
          <Link to="/profile" state={{ returnTo: `/rooms/${r.room_id}/book?check_in=${form.check_in}&check_out=${form.check_out}` }}>
            Go to my profile
          </Link>
        </Notice>
      </>
    );
  }

  const willShare = r.room_type === 'Dormitory' || (r.room_type === 'Double' && form.share_room && 1 + guests.length < r.total_beds);
  const maxGuests = r.total_beds - 1;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setGuest = (i, k) => (e) => setGuests((list) => list.map((g, j) => (j === i ? { ...g, [k]: e.target.value } : g)));
  const payload = () => ({
    room_id: r.room_id,
    ...form,
    guests: guests.map((g) => Object.fromEntries(Object.entries(g).filter(([, v]) => v))),
  });

  function checkDetails() {
    const errs = {};
    if (!form.check_in) errs.check_in = 'Choose a check-in date.';
    else if (form.check_in < todayStr()) errs.check_in = 'Check-in cannot be in the past.';
    if (!form.check_out) errs.check_out = 'Choose a check-out date.';
    else if (form.check_out <= form.check_in) errs.check_out = 'Check-out must be after check-in.';
    if (!form.guest_type) errs.guest_type = 'Choose your guest type.';
    if (form.purpose.length > 255) errs.purpose = 'Keep it under 255 characters.';
    return errs;
  }

  function checkGuests() {
    const errs = {};
    guests.forEach((g, i) => {
      if (!g.full_name.trim()) errs[`guests[${i}].full_name`] = 'Enter the full name.';
      if (g.phone_number && !/^\+?\d{7,15}$/.test(g.phone_number)) errs[`guests[${i}].phone_number`] = 'Digits only, e.g. 17123456.';
    });
    return errs;
  }

  async function loadQuote() {
    setBusy(true);
    try {
      const q = await post('/bookings/quote', payload());
      setQuote(q);
      setStep(3);
    } catch (err) {
      applyServerError(err, setErrors, toast);
    } finally {
      setBusy(false);
    }
  }

  async function next(e) {
    e?.preventDefault();
    const errs = step === 0 ? checkDetails() : step === 1 ? checkGuests() : {};
    if (step === 2 && !understood) errs.understood = 'Tick the box to continue.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (step === 0) setStep(1);
    else if (step === 1) (willShare ? setStep(2) : loadQuote());
    else if (step === 2) loadQuote();
  }

  async function send() {
    setBusy(true);
    try {
      const { booking } = await post('/bookings', payload());
      toast.success(`Booking ${booking.ref} sent. We will email you when it is approved.`);
      navigate(`/bookings/${booking.booking_id}`);
    } catch (err) {
      applyServerError(err, setErrors, toast);
      if (err.code === 'NOT_ENOUGH_BEDS') setStep(0);
    } finally {
      setBusy(false);
    }
  }

  const visibleSteps = STEPS.filter((s) => s !== 'Shared room' || willShare);
  const current = STEPS[step];

  return (
    <>
      <PageHeader back={back} title={`Book room ${r.room_number}`} subtitle={`${r.guest_house_name} · ${r.room_type} · ${r.total_beds} bed(s)`} />
      <ol className="steps" aria-label="Booking steps">
        {visibleSteps.map((s) => (
          <li key={s} aria-current={s === current ? 'step' : undefined}>
            {visibleSteps.indexOf(s) + 1}. {s}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <form className="ui-card form-narrow" onSubmit={next} noValidate>
          <h2>Your stay</h2>
          <div className="form-row">
            <DatePicker
              label="Check-in"
              value={form.check_in}
              min={todayStr()}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({ ...f, check_in: v, check_out: f.check_out > v ? f.check_out : v ? addDaysStr(v, 1) : '' }));
              }}
              error={errors.check_in}
              required
            />
            <DatePicker label="Check-out" value={form.check_out} min={form.check_in} onChange={set('check_out')} error={errors.check_out} required />
          </div>
          <Select label="Guest type" placeholder="Choose…" options={GUEST_TYPES} value={form.guest_type} onChange={set('guest_type')} error={errors.guest_type} help="The rate depends on this. Staff may be asked for an ID at check-in." required />
          <TextInput label="Purpose of visit" value={form.purpose} onChange={set('purpose')} error={errors.purpose} maxLength={255} />
          {r.room_type === 'Double' && (
            <Checkbox label="I agree to share the room with other guests if beds are free" checked={form.share_room} onChange={set('share_room')} help="Untick to have the whole room. It must then be completely free on your dates." />
          )}
          <p className="muted">Bringing someone? Add them on the next step.</p>
          <div className="actions">
            <Button type="submit">Next: guests</Button>
            <Link className="ui-btn ui-btn--secondary" to={back.to}>
              Cancel
            </Link>
          </div>
        </form>
      )}

      {step === 1 && (
        <form className="ui-card" onSubmit={next} noValidate>
          <h2>Who is staying?</h2>
          <p className="muted">One bed per person. You are guest 1. This room has {r.total_beds} bed(s).</p>
          {guests.map((g, i) => (
            <fieldset key={i} className="guest-card">
              <div className="guest-card__head">
                <h3>Guest {i + 2}</h3>
                <Button variant="danger" size="small" onClick={() => setGuests(guests.filter((_, j) => j !== i))}>
                  Remove
                </Button>
              </div>
              <div className="form-row">
                <TextInput label="Full name" value={g.full_name} onChange={setGuest(i, 'full_name')} error={errors[`guests[${i}].full_name`]} maxLength={50} required />
                <Select label="Gender" placeholder="Choose…" options={['Male', 'Female', 'Other']} value={g.gender} onChange={setGuest(i, 'gender')} />
              </div>
              <div className="form-row">
                <TextInput label="CID / passport no." value={g.citizenship_id} onChange={setGuest(i, 'citizenship_id')} error={errors[`guests[${i}].citizenship_id`]} maxLength={20} />
                <TextInput label="Phone" type="tel" value={g.phone_number} onChange={setGuest(i, 'phone_number')} error={errors[`guests[${i}].phone_number`]} maxLength={15} />
              </div>
            </fieldset>
          ))}
          {guests.length < maxGuests ? (
            <Button variant="secondary" onClick={() => setGuests([...guests, blankGuest()])}>
              + Add another guest
            </Button>
          ) : (
            <p className="muted">The room is full with {guests.length + 1} people.</p>
          )}
          <div className="actions mt-4">
            <Button type="submit" loading={busy}>
              {willShare ? 'Next' : 'Next: bill'}
            </Button>
            <Button variant="secondary" onClick={() => setStep(0)}>
              Back
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form className="ui-card form-narrow" onSubmit={next} noValidate>
          <h2>This room is shared</h2>
          <Notice type="warning">
            <p>
              Room {r.room_number} has {r.total_beds} beds. Other guests may stay in the same room on your dates.
            </p>
            <p>Your belongings are your own responsibility. Ask the incharge about lockers.</p>
          </Notice>
          <Checkbox label="I understand that I will share the room" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} error={errors.understood} />
          <div className="actions">
            <Button type="submit" loading={busy}>
              Continue
            </Button>
            <Link className="ui-btn ui-btn--secondary" to="/rooms">
              Choose another room
            </Link>
          </div>
        </form>
      )}

      {step === 3 && quote && (
        <section className="ui-card">
          <h2>Your bill</h2>
          {!quote.available && (
            <Notice type="danger">
              Only {quote.free_beds} bed(s) are free {quote.share_room ? '' : 'and you asked for the whole room '}on these dates. Go back and change the dates or the number of guests.
            </Notice>
          )}
          <Table
            caption={`${formatDate(quote.check_in)} → ${formatDate(quote.check_out)}`}
            rowKey="item"
            columns={[
              { key: 'item', header: 'Item' },
              { key: 'nights', header: 'Nights' },
              { key: 'beds', header: 'Beds' },
              { key: 'rate', header: 'Rate' },
              { key: 'amount', header: 'Amount' },
            ]}
            rows={[
              { item: `Room ${quote.room.room_number} (${quote.guest_type})`, nights: quote.nights, beds: quote.beds, rate: money(quote.rate), amount: money(quote.total) },
              { item: 'Total', nights: '', beds: '', rate: '', amount: <strong>{money(quote.total)}</strong> },
            ]}
          />
          <p className="bill-sum mt-4">
            {quote.nights} night(s) × {quote.beds} bed(s) × {money(quote.rate)} = <strong>Total {money(quote.total)}</strong>
          </p>
          <p className="muted">Pay at the guest house when you check in. Your booking needs admin approval; we will email you.</p>
          <div className="actions">
            <Button onClick={send} loading={busy} disabled={!quote.available}>
              Send booking request
            </Button>
            <Button variant="secondary" onClick={() => setStep(willShare ? 2 : 1)}>
              Back
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
