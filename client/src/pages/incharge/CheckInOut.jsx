import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Modal, Select, StatusBadge, Table, TextInput, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import DefinitionList from '../../components/DefinitionList.jsx';
import Notice from '../../components/Notice.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get, post } from '../../api/client.js';
import { formatDate, formatDateTime, money, todayStr } from '../../utils/format.js';
import { applyServerError } from '../../utils/forms.js';
import { guestName, stayState } from './InchargeBookings.jsx';

// F-28
export default function CheckInOut() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const id = Number(params.get('booking') || 0);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const results = useApiData(() => (search ? get('/incharge/bookings', { range: 'all', q: search }) : Promise.resolve(null)), [search]);
  const detail = useApiData(() => (id ? get(`/bookings/${id}`) : Promise.resolve(null)), [id]);
  const [pay, setPay] = useState({ amount: '', method: 'Cash', reference_no: '' });
  const [payErrors, setPayErrors] = useState({});
  const [busy, setBusy] = useState('');
  const [confirmOut, setConfirmOut] = useState(false);

  async function act(action) {
    setBusy(action);
    try {
      await post(`/incharge/bookings/${id}/${action}`);
      toast.success(action === 'check-in' ? 'Checked in.' : 'Checked out. The stay is completed.');
      setConfirmOut(false);
      detail.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  }

  async function recordPayment(e) {
    e.preventDefault();
    const b = detail.data.booking;
    const errs = {};
    const n = Number(pay.amount);
    if (!(n > 0)) errs.amount = 'Enter the amount received.';
    else if (n > b.amount_due) errs.amount = `Only ${money(b.amount_due)} is due.`;
    if (pay.method !== 'Cash' && !pay.reference_no.trim()) errs.reference_no = 'Enter the receipt or reference number.';
    setPayErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy('pay');
    try {
      await post('/incharge/payments', { booking_id: id, amount: n, method: pay.method, reference_no: pay.reference_no || undefined });
      toast.success(`Payment of ${money(n)} recorded.`);
      setPay({ amount: '', method: 'Cash', reference_no: '' });
      detail.reload();
    } catch (err) {
      applyServerError(err, setPayErrors, toast);
    } finally {
      setBusy('');
    }
  }

  const b = detail.data?.booking;
  const today = todayStr();
  const canIn = b && b.status === 'Approved' && !b.checked_in_at && today >= b.check_in && today < b.check_out;
  const canOut = b && b.status === 'Approved' && b.checked_in_at && !b.checked_out_at;

  return (
    <>
      <PageHeader title="Check-in / check-out" />
      <form
        className="ui-card form-narrow"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q.trim());
        }}
      >
        <TextInput label="Find booking" value={q} onChange={(e) => setQ(e.target.value)} help="Ref (GL-0012), name, email or CID" />
        <Button type="submit" variant="secondary">
          Find
        </Button>
      </form>
      {results.loading && search && <Loading />}
      {results.data && (
        <Table
          caption="Results"
          rowKey="booking_id"
          emptyMessage="No approved booking matches."
          columns={[
            { key: 'ref', header: 'Ref' },
            { key: 'guest', header: 'Guest', render: guestName },
            { key: 'room', header: 'Room', render: (r) => r.room_number },
            { key: 'dates', header: 'Dates', render: (r) => `${formatDate(r.check_in, { year: false })} → ${formatDate(r.check_out, { year: false })}` },
            {
              key: 'go',
              header: '',
              render: (r) => (
                <Button size="small" variant="secondary" onClick={() => setParams({ booking: String(r.booking_id) })}>
                  Open
                </Button>
              ),
            },
          ]}
          rows={results.data.bookings}
        />
      )}

      {id > 0 && detail.loading && <Loading />}
      <ErrorMessage error={detail.error} onRetry={detail.reload} />
      {b && (
        <section className="ui-card mt-4">
          <h2>
            {b.ref} · {guestName(b)} <StatusBadge status={b.status} />
          </h2>
          <DefinitionList
            items={[
              ['Room', `${b.room_number} (${b.room_type}), ${b.guest_house_name}`],
              ['Dates', `${formatDate(b.check_in)} → ${formatDate(b.check_out)}`],
              ['Beds', b.beds],
              ['Phone', b.user_phone_number],
              ['Stay', stayState(b)],
              ['Checked in', b.checked_in_at && formatDateTime(b.checked_in_at)],
              ['Checked out', b.checked_out_at && formatDateTime(b.checked_out_at)],
              ['Bill', `${money(b.total_amount)} · paid ${money(b.amount_paid)} · due ${money(b.amount_due)}`],
            ]}
          />
          {detail.data.guests.length > 0 && (
            <p className="mt-4">
              <strong>Other guests:</strong> {detail.data.guests.map((g) => `${g.full_name}${g.citizenship_id ? ` (${g.citizenship_id})` : ''}`).join(', ')}
            </p>
          )}
          {b.status === 'Approved' && !b.checked_in_at && today < b.check_in && <Notice>Check-in opens on {formatDate(b.check_in)}.</Notice>}
          {b.status !== 'Approved' && b.status !== 'Completed' && <Notice type="warning">This booking is {b.status}; it cannot be checked in.</Notice>}
          <div className="actions">
            <Button onClick={() => act('check-in')} disabled={!canIn} loading={busy === 'check-in'}>
              Check in
            </Button>
            <Button onClick={() => setConfirmOut(true)} disabled={!canOut}>
              Check out
            </Button>
          </div>

          {['Approved', 'Completed'].includes(b.status) && b.amount_due > 0 && (
            <form onSubmit={recordPayment} noValidate className="mt-4">
              <h3>Record payment</h3>
              <div className="form-row">
                <TextInput label="Amount (Nu.)" type="number" min={0} step="0.01" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} error={payErrors.amount} help={`Due: ${money(b.amount_due)}`} required />
                <Select label="Payment method" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} options={['Cash', 'Bank Transfer', 'mBoB']} />
                <TextInput label="Receipt / ref no." value={pay.reference_no} onChange={(e) => setPay({ ...pay, reference_no: e.target.value })} error={payErrors.reference_no} maxLength={50} required={pay.method !== 'Cash'} />
              </div>
              <Button type="submit" variant="secondary" loading={busy === 'pay'}>
                Record payment
              </Button>
            </form>
          )}
          {detail.data.payments.length > 0 && (
            <Table
              caption="Payments"
              rowKey="payment_id"
              columns={[
                { key: 'when', header: 'When', render: (p) => formatDateTime(p.paid_at) },
                { key: 'amount', header: 'Amount', render: (p) => money(p.amount) },
                { key: 'method', header: 'Method' },
                { key: 'reference_no', header: 'Receipt / ref' },
              ]}
              rows={detail.data.payments}
            />
          )}
        </section>
      )}
      <Modal
        open={confirmOut}
        title="Check out?"
        onClose={() => setConfirmOut(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOut(false)}>
              Go back
            </Button>
            <Button onClick={() => act('check-out')} loading={busy === 'check-out'}>
              Check out
            </Button>
          </>
        }
      >
        {b && b.amount_due > 0 ? (
          <Notice type="warning">{money(b.amount_due)} is still due. Record the payment first if the guest has paid.</Notice>
        ) : (
          <p>The bill is paid.</p>
        )}
        <p>This marks the stay as completed and frees the beds.</p>
      </Modal>
    </>
  );
}
