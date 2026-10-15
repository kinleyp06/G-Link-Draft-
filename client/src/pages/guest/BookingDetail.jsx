import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Modal, StatusBadge, Table, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import DefinitionList from '../../components/DefinitionList.jsx';
import Notice from '../../components/Notice.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { get, post } from '../../api/client.js';
import { formatDate, formatDateTime, money, nights, personName, todayStr } from '../../utils/format.js';

// F-16 (guests see their own; staff open it from their lists)
export default function BookingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { data, error, loading, reload } = useApiData(() => get(`/bookings/${id}`), [id]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  const { booking: b, guests, extensions, payments, sharing } = data;
  const mine = b.user_id === user.user_id;
  const canCancel = mine && ['Pending', 'Approved'].includes(b.status) && !b.checked_in_at;
  const canExtend = mine && b.status === 'Approved' && !extensions.some((e) => e.status === 'Pending') && b.check_out >= todayStr();

  async function cancel() {
    setBusy(true);
    try {
      await post(`/bookings/${b.booking_id}/cancel`);
      toast.success('Booking cancelled.');
      setConfirm(false);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        back={mine ? { to: '/bookings', label: 'My bookings' } : undefined}
        title={
          <>
            Booking {b.ref} <StatusBadge status={b.status} />
          </>
        }
        subtitle={`Made on ${formatDateTime(b.created_at)}`}
      />
      {b.status === 'Pending' && <Notice type="warning">Waiting for an admin to approve. We will email you.</Notice>}
      {b.status === 'Rejected' && <Notice type="danger" title="Rejected">{b.admin_note}</Notice>}
      {b.status === 'Cancelled' && b.admin_note && <Notice>{b.admin_note}</Notice>}
      {b.status === 'Approved' && b.admin_note && <Notice type="success" title="Note from the admin">{b.admin_note}</Notice>}
      {sharing.bookings > 0 && (
        <Notice type="warning" title="Shared room">
          {sharing.beds} other guest(s) will also stay in this room during your dates.
        </Notice>
      )}

      <div className="grid grid--2">
        <section className="ui-card">
          <h2>Stay</h2>
          <DefinitionList
            items={[
              ['Room', `${b.room_number} (${b.room_type}), ${b.guest_house_name}`],
              ['Dates', `${formatDate(b.check_in)} → ${formatDate(b.check_out)}`],
              ['Nights', nights(b.check_in, b.check_out)],
              ['Beds', b.beds],
              ['Shared room', b.share_room ? 'Yes' : 'No'],
              ['Purpose', b.purpose],
              ['Checked in', b.checked_in_at && formatDateTime(b.checked_in_at)],
              ['Checked out', b.checked_out_at && formatDateTime(b.checked_out_at)],
            ]}
          />
        </section>
        <section className="ui-card">
          <h2>Bill</h2>
          <DefinitionList
            items={[
              ['Guest type', b.guest_type],
              ['Rate', `${money(b.rate_amount)} per bed per night`],
              ['Total', money(b.total_amount)],
              ['Paid', money(b.amount_paid)],
              ['Still due', money(b.amount_due)],
            ]}
          />
          {b.amount_due > 0 && b.status === 'Approved' && <p className="muted">Pay at the guest house when you check in.</p>}
        </section>
      </div>

      <section className="ui-card">
        <h2>Guests</h2>
        <ol>
          {!b.is_international && <li>{personName(b.user_first_name, b.user_last_name, b.user_email)} (account holder)</li>}
          {guests.map((g) => (
            <li key={g.booking_guest_id}>
              {g.full_name}
              {g.nationality && g.nationality !== 'Bhutanese' ? ` · ${g.nationality}` : ''}
            </li>
          ))}
        </ol>
      </section>

      {extensions.length > 0 && (
        <section className="ui-card">
          <h2>Requests to stay longer</h2>
          <Table
            rowKey="stay_extension_id"
            columns={[
              { key: 'new', header: 'New check-out', render: (e) => formatDate(e.new_check_out) },
              { key: 'extra', header: 'Extra cost', render: (e) => money(e.extra_amount) },
              { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
              { key: 'note', header: 'Note', render: (e) => e.admin_note || '' },
            ]}
            rows={extensions}
          />
        </section>
      )}

      {payments.length > 0 && (
        <section className="ui-card">
          <h2>Payments</h2>
          <Table
            rowKey="payment_id"
            columns={[
              { key: 'when', header: 'When', render: (p) => formatDateTime(p.paid_at) },
              { key: 'amount', header: 'Amount', render: (p) => money(p.amount) },
              { key: 'method', header: 'Method' },
              { key: 'reference_no', header: 'Receipt / ref' },
            ]}
            rows={payments}
          />
        </section>
      )}

      {(canExtend || canCancel) && (
        <div className="actions">
          {canExtend && (
            <Link className="ui-btn ui-btn--secondary" to={`/bookings/${b.booking_id}/extend`}>
              Ask to stay longer
            </Link>
          )}
          {canCancel && (
            <Button variant="danger" onClick={() => setConfirm(true)}>
              Cancel booking
            </Button>
          )}
        </div>
      )}

      <Modal
        open={confirm}
        title="Cancel this booking?"
        onClose={() => setConfirm(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Keep booking
            </Button>
            <Button variant="danger" onClick={cancel} loading={busy}>
              Cancel booking
            </Button>
          </>
        }
      >
        <p>
          Booking {b.ref} for {formatDate(b.check_in)} → {formatDate(b.check_out)} will be cancelled and the beds freed for others.
        </p>
      </Modal>
    </>
  );
}
