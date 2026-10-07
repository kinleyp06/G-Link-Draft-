import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, DatePicker, Select } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Notice from '../../components/Notice.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get } from '../../api/client.js';
import { addDaysStr, formatDate, money, todayStr } from '../../utils/format.js';

// F-09: room list with free beds for the chosen dates
export default function Rooms() {
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState({
    guest_house_id: params.get('guest_house_id') || '',
    check_in: params.get('check_in') || todayStr(1),
    check_out: params.get('check_out') || todayStr(2),
  });
  const [errors, setErrors] = useState({});
  const search = Object.fromEntries(params);
  const houses = useApiData(() => get('/guest-houses'), []);
  const rooms = useApiData(() => get('/rooms', { check_in: form.check_in, check_out: form.check_out, ...search }), [params.toString()]);

  function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.check_in) errs.check_in = 'Choose a check-in date.';
    if (!form.check_out) errs.check_out = 'Choose a check-out date.';
    else if (form.check_out <= form.check_in) errs.check_out = 'Check-out must be after check-in.';
    setErrors(errs);
    if (!Object.keys(errs).length) setParams(Object.fromEntries(Object.entries(form).filter(([, v]) => v)));
  }

  const data = rooms.data;
  const q = data ? `?check_in=${data.check_in}&check_out=${data.check_out}` : '';

  return (
    <>
      <PageHeader title="Rooms" subtitle="Choose your dates to see free beds." />
      <form className="ui-card" onSubmit={submit} noValidate>
        <div className="form-row">
          <Select
            label="Guest house"
            value={form.guest_house_id}
            onChange={(e) => setForm({ ...form, guest_house_id: e.target.value })}
            placeholder="All guest houses"
            options={(houses.data?.guest_houses || []).map((g) => ({ value: String(g.guest_house_id), label: g.name }))}
          />
          <DatePicker
            label="Check-in"
            value={form.check_in}
            min={todayStr()}
            onChange={(e) => {
              const v = e.target.value;
              setForm((f) => ({ ...f, check_in: v, check_out: f.check_out && f.check_out > v ? f.check_out : v ? addDaysStr(v, 1) : '' }));
            }}
            error={errors.check_in}
            required
          />
          <DatePicker label="Check-out" value={form.check_out} min={form.check_in || todayStr()} onChange={(e) => setForm({ ...form, check_out: e.target.value })} error={errors.check_out} required />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {rooms.loading && <Loading />}
      <ErrorMessage error={rooms.error} onRetry={rooms.reload} />
      {data && (
        <>
          <p className="muted">
            Free beds for {formatDate(data.check_in)} → {formatDate(data.check_out)}. Room rates are per bed per night:{' '}
            {Object.entries(data.rates)
              .filter(([type]) => type !== 'International')
              .map(([type, amount]) => `${type} ${money(amount)}`)
              .join(' · ')}
            .
          </p>
          {data.rooms.length === 0 && <Notice>No rooms found.</Notice>}
          <div className="grid grid--2">
            {data.rooms.map((r) => (
              <article key={r.room_id} className="ui-card room-card">
                <h3>
                  Room {r.room_number} · {r.room_type}
                </h3>
                <div className="room-card__meta">
                  <span>{r.guest_house_name}</span>
                  <span>{r.total_beds} bed(s)</span>
                  <span className={`free ${r.free_beds === 0 ? 'free--none' : ''}`}>
                    {r.free_beds === 0 ? 'Full on these dates' : `${r.free_beds} free`}
                  </span>
                </div>
                <div className="actions">
                  <Link className="ui-btn ui-btn--secondary ui-btn--small" to={`/rooms/${r.room_id}${q}`}>
                    View
                  </Link>
                  {r.free_beds > 0 && (
                    <Link className="ui-btn ui-btn--primary ui-btn--small" to={`/rooms/${r.room_id}/book${q}`}>
                      Book
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
