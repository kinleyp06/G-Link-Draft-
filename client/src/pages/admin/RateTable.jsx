import { useEffect, useState } from 'react';
import { Button, Table, TextInput, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Notice from '../../components/Notice.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get, put } from '../../api/client.js';
import { ALL_GUEST_TYPES, formatDateTime } from '../../utils/format.js';
import { applyServerError } from '../../utils/forms.js';

const key = (t, r) => `${t}|${r}`;

// F-26
export default function RateTable() {
  const toast = useToast();
  const { data, error, loading, reload } = useApiData(() => get('/rates'), []);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setValues(Object.fromEntries(data.rates.map((r) => [key(r.guest_type, r.rate_type), String(r.amount)])));
  }, [data]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  const lastChange = data.rates.map((r) => r.updated_at).sort().at(-1);

  async function save(e) {
    e.preventDefault();
    const errs = {};
    const rates = [];
    for (const t of ALL_GUEST_TYPES) {
      for (const r of ['Room', 'Hall']) {
        const raw = values[key(t, r)] ?? '';
        const n = Number(raw);
        if (raw === '' || Number.isNaN(n) || n < 0) errs[key(t, r)] = 'Enter an amount (0 or more).';
        else if (Math.round(n * 100) !== n * 100) errs[key(t, r)] = 'At most 2 decimals.';
        else rates.push({ guest_type: t, rate_type: r, amount: n });
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await put('/admin/rates', { rates });
      toast.success('Rates saved.');
      reload();
    } catch (err) {
      applyServerError(err, setErrors, toast);
    } finally {
      setBusy(false);
    }
  }

  const cell = (t, r) => (
    <div className="rate-input">
      <TextInput
        label={`${t}, ${r === 'Room' ? 'room per bed per night' : 'hall per day'} (Nu.)`}
        className="rate-field"
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        value={values[key(t, r)] ?? ''}
        onChange={(e) => setValues({ ...values, [key(t, r)]: e.target.value })}
        error={errors[key(t, r)]}
      />
    </div>
  );

  return (
    <>
      <PageHeader title="Rate table" subtitle={`Amounts in Ngultrum. Last change: ${formatDateTime(lastChange)}`} />
      <form onSubmit={save} noValidate>
        <Table
          caption="Rates"
          rowKey="type"
          columns={[
            { key: 'type', header: 'Guest type' },
            { key: 'room', header: 'Room / bed / night', render: (row) => cell(row.type, 'Room') },
            { key: 'hall', header: 'Hall / day', render: (row) => cell(row.type, 'Hall') },
          ]}
          rows={ALL_GUEST_TYPES.map((type) => ({ type }))}
        />
        <Notice>New rates apply to new bookings only. Existing bookings keep the rate they were made with.</Notice>
        <Button type="submit" loading={busy}>
          Save rates
        </Button>
      </form>
    </>
  );
}
