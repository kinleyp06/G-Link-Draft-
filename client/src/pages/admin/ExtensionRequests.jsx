import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal, Select, StatusBadge, Table, Textarea, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Notice from '../../components/Notice.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { get, post } from '../../api/client.js';
import { formatDate, money, personName } from '../../utils/format.js';

// F-21
export default function ExtensionRequests() {
  const toast = useToast();
  const [status, setStatus] = useState('Pending');
  const { data, error, loading, reload } = useApiData(() => get('/admin/extensions', { status }), [status]);
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [busy, setBusy] = useState(false);

  async function decide(e, approve) {
    if (!approve && !note.trim()) return setNoteError('Give the guest a reason.');
    setBusy(true);
    try {
      await post(`/admin/extensions/${e.stay_extension_id}/${approve ? 'approve' : 'reject'}`, approve ? {} : { note });
      toast.success(approve ? 'Longer stay approved. The guest has been emailed.' : 'Request rejected. The guest has been emailed.');
      setRejecting(null);
      setNote('');
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Extension requests" subtitle="Guests asking to stay longer." />
      <div className="form-narrow">
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: '', label: 'All' }, 'Pending', 'Approved', 'Rejected']} />
      </div>
      {loading && <Loading />}
      <ErrorMessage error={error} onRetry={reload} />
      {data && (
        <>
          <Table
            caption={`${data.extensions.length} request(s)`}
            rowKey="stay_extension_id"
            emptyMessage="No requests."
            columns={[
              { key: 'ref', header: 'Booking', render: (e) => <Link to={`/admin/requests/${e.booking_id}`}>GL-{String(e.booking_id).padStart(4, '0')}</Link> },
              { key: 'guest', header: 'Guest', render: (e) => personName(e.user_first_name, e.user_last_name, e.user_email) },
              { key: 'room', header: 'Room', render: (e) => e.room_number },
              { key: 'now', header: 'Now ends', render: (e) => formatDate(e.current_check_out) },
              { key: 'new', header: 'New end', render: (e) => formatDate(e.new_check_out) },
              { key: 'extra', header: 'Extra', render: (e) => money(e.extra_amount) },
              { key: 'reason', header: 'Reason' },
              { key: 'free', header: 'Room free?', render: (e) => (e.room_free === null ? '' : e.room_free ? 'Yes' : <strong className="free--none">No</strong>) },
              { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
              {
                key: 'act',
                header: '',
                render: (e) =>
                  e.status === 'Pending' && (
                    <div className="actions" style={{ marginTop: 0 }}>
                      <Button size="small" onClick={() => decide(e, true)} disabled={busy || !e.room_free} title={e.room_free ? '' : 'The room is not free for the extra nights'}>
                        Approve
                      </Button>
                      <Button size="small" variant="danger" onClick={() => setRejecting(e)}>
                        Reject
                      </Button>
                    </div>
                  ),
              },
            ]}
            rows={data.extensions}
          />
          {data.extensions.some((e) => e.room_free === false) && (
            <Notice type="warning" title="Room not free">
              Approve is switched off when the room has no free bed for the extra nights. Change the room first, or reject.
            </Notice>
          )}
        </>
      )}
      <Modal
        open={Boolean(rejecting)}
        title="Reject this request?"
        onClose={() => setRejecting(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={() => decide(rejecting, false)}>
              Reject
            </Button>
          </>
        }
      >
        <Textarea label="Reason (the guest will see this)" value={note} onChange={(e) => { setNote(e.target.value); setNoteError(''); }} error={noteError} maxLength={255} required />
      </Modal>
    </>
  );
}
