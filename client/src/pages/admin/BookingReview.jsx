import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Modal, StatusBadge, Table, Textarea, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import DefinitionList from '../../components/DefinitionList.jsx';
import Notice from '../../components/Notice.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get, post } from '../../api/client.js';
import { formatDate, formatDateTime, money, nights, personName } from '../../utils/format.js';

// F-20 review: Approve / Reject
export default function BookingReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, error, loading, reload } = useApiData(() => get(`/bookings/${id}`), [id]);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [confirm, setConfirm] = useState(null); // 'reject' | 'cancel'
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  const { booking: b, guests, extensions, payments } = data;
  const n = nights(b.check_in, b.check_out);

  async function act(action) {
    if (action !== 'approve' && !note.trim()) {
      setNoteError(action === 'reject' ? 'Give the guest a reason for rejecting.' : 'Give a reason for cancelling.');
      setConfirm(null);
      return;
    }
    setBusy(true);
    try {
      await post(`/admin/bookings/${b.booking_id}/${action}`, { note: note.trim() || undefined });
      toast.success(`Booking ${b.ref} ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'cancelled'}. The guest has been emailed.`);
      setConfirm(null);
      if (action === 'approve' || action === 'reject') navigate('/admin/requests');
      else reload();
    } catch (err) {
      toast.error(err.message);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        back={{ to: '/admin/requests', label: 'Booking requests' }}
        title={
          <>
            Review {b.ref} <StatusBadge status={b.status} />
          </>
        }
        subtitle={`Sent ${formatDateTime(b.created_at)}`}
      />
      <div className="grid grid--2">
        <section className="ui-card">
          <h2>Guest</h2>
          <DefinitionList
            items={
              b.is_international
                ? [['Booked by admin', b.user_email], ['Guest type', 'International']]
                : [
                    ['Name', personName(b.user_first_name, b.user_last_name)],
                    ['Email', b.user_email],
                    ['Phone', b.user_phone_number],
                    ['Guest type', b.guest_type],
                    ['Purpose', b.purpose],
                  ]
            }
          />
        </section>
        <section className="ui-card">
          <h2>Stay</h2>
          <DefinitionList
            items={[
              ['Room', `${b.room_number} (${b.room_type}), ${b.guest_house_name}`],
              ['Dates', `${formatDate(b.check_in)} → ${formatDate(b.check_out)} (${n} night${n === 1 ? '' : 's'})`],
              ['Beds', `${b.beds} of ${b.total_beds}`],
              ['Shares room', b.share_room ? 'Yes' : 'No, whole room'],
            ]}
          />
        </section>
      </div>
      <section className="ui-card">
        <h2>Bill</h2>
        <p>
          {n} night(s) × {b.beds} bed(s) × {money(b.rate_amount)} = <strong>{money(b.total_amount)}</strong>
          {b.amount_paid > 0 && ` · paid ${money(b.amount_paid)}, due ${money(b.amount_due)}`}
        </p>
      </section>
      {guests.length > 0 && (
        <section className="ui-card">
          <h2>People on this booking</h2>
          <Table
            rowKey="booking_guest_id"
            columns={[
              { key: 'full_name', header: 'Name' },
              { key: 'gender', header: 'Gender' },
              { key: 'citizenship_id', header: 'CID / passport' },
              { key: 'nationality', header: 'Nationality' },
              { key: 'phone_number', header: 'Phone' },
            ]}
            rows={guests}
          />
        </section>
      )}
      {(extensions.length > 0 || payments.length > 0) && (
        <Notice>
          {extensions.length} extension request(s), {payments.length} payment(s). <Link to={`/bookings/${b.booking_id}`}>See full history</Link>
        </Notice>
      )}
      {b.admin_note && <Notice title="Note">{b.admin_note}</Notice>}

      {b.status === 'Pending' && (
        <section className="ui-card">
          <Textarea label="Note to guest (needed when rejecting)" value={note} onChange={(e) => { setNote(e.target.value); setNoteError(''); }} error={noteError} maxLength={255} />
          <div className="actions">
            <Button onClick={() => act('approve')} loading={busy}>
              Approve
            </Button>
            <Button variant="danger" onClick={() => setConfirm('reject')}>
              Reject
            </Button>
            <Link className="ui-btn ui-btn--secondary" to={`/admin/change-room?booking=${b.booking_id}`}>
              Change room
            </Link>
          </div>
        </section>
      )}
      {b.status === 'Approved' && !b.checked_in_at && (
        <section className="ui-card">
          <Textarea label="Reason (needed to cancel)" value={note} onChange={(e) => { setNote(e.target.value); setNoteError(''); }} error={noteError} maxLength={255} />
          <div className="actions">
            <Link className="ui-btn ui-btn--secondary" to={`/admin/change-room?booking=${b.booking_id}`}>
              Change room
            </Link>
            <Button variant="danger" onClick={() => setConfirm('cancel')}>
              Cancel booking
            </Button>
          </div>
        </section>
      )}

      <Modal
        open={Boolean(confirm)}
        title={confirm === 'reject' ? `Reject ${b.ref}?` : `Cancel ${b.ref}?`}
        onClose={() => setConfirm(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Go back
            </Button>
            <Button variant="danger" loading={busy} onClick={() => act(confirm)}>
              {confirm === 'reject' ? 'Reject' : 'Cancel booking'}
            </Button>
          </>
        }
      >
        <p>The guest will get an email{note.trim() ? ` with your note: “${note.trim()}”` : ''}.</p>
      </Modal>
    </>
  );
}
