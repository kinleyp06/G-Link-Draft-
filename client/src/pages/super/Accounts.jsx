import { useState } from 'react';
import { Button, Modal, Select, Table, TextInput, useToast } from '../../components/ui';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { get, patch } from '../../api/client.js';
import { formatDate, personName } from '../../utils/format.js';

const ROLES = ['Guest', 'Incharge', 'Admin', 'Super Admin'];

// F-29
export default function Accounts() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState({ q: '', role: '' });
  const { data, error, loading, reload } = useApiData(() => get('/super/users', filters), [filters.q, filters.role]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await patch(`/super/users/${editing.user_id}`, { role: editing.role, status: editing.status });
      toast.success('Account updated.');
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Accounts" subtitle="Change a person's role, or switch an account off." />
      <form
        className="ui-card"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters({ ...filters, q });
        }}
      >
        <div className="form-row">
          <TextInput label="Search" value={q} onChange={(e) => setQ(e.target.value)} help="Name or email. Press Enter." />
          <Select label="Role" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} options={[{ value: '', label: 'All' }, ...ROLES]} />
        </div>
      </form>
      {loading && <Loading />}
      <ErrorMessage error={error} onRetry={reload} />
      {data && (
        <Table
          caption={`${data.users.length} account(s)`}
          rowKey="user_id"
          emptyMessage="No accounts match."
          columns={[
            { key: 'name', header: 'Name', render: (u) => personName(u.first_name, u.last_name, '(no name yet)') },
            { key: 'email', header: 'Email' },
            { key: 'role', header: 'Role' },
            { key: 'status', header: 'Status' },
            { key: 'verified', header: 'Email verified', render: (u) => (u.email_verified ? 'Yes' : 'No') },
            { key: 'created', header: 'Joined', render: (u) => formatDate(u.created_at) },
            {
              key: 'e',
              header: '',
              render: (u) =>
                u.user_id === me.user_id ? (
                  <span className="muted">You</span>
                ) : (
                  <Button size="small" variant="secondary" onClick={() => setEditing({ ...u })}>
                    Edit
                  </Button>
                ),
            },
          ]}
          rows={data.users}
        />
      )}
      <Modal
        open={Boolean(editing)}
        title={editing ? `Edit ${editing.email}` : ''}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={busy}>
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <>
            <Select label="Role" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} options={ROLES} />
            <Select label="Status" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} options={['Active', 'Inactive']} help="An inactive account cannot sign in." />
          </>
        )}
      </Modal>
    </>
  );
}
