import { useState } from 'react';
import {
  Button,
  TextInput,
  PasswordInput,
  Select,
  DatePicker,
  Table,
  Modal,
  StatusBadge,
  useToast,
} from '../../components/ui';

const COLOURS = [
  ['Brand', '--color-brand', '#2e4a7a'],
  ['Soft', '--color-brand-soft', '#e3ebf6'],
  ['Success', '--color-success', '#1e7b34'],
  ['Danger', '--color-danger', '#b03a3a'],
  ['Warning', '--color-warning', '#b45309'],
  ['Info', '--color-info', '#3b5b92'],
  ['Text', '--color-text', '#1a1a1a'],
  ['Muted', '--color-muted', '#666666'],
  ['Border', '--color-border', '#c8ceda'],
  ['Background', '--color-bg', '#f5f7fb'],
];

const STATUSES = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'];

const SAMPLE_ROWS = [
  { id: 1, guest: 'Pema Wangmo', room: 'A-101', check_in: '2026-10-12', check_out: '2026-10-14', status: 'Pending' },
  { id: 2, guest: 'Karma Dorji', room: 'B-203', check_in: '2026-10-15', check_out: '2026-10-18', status: 'Approved' },
  { id: 3, guest: 'Sonam Choden', room: 'A-102', check_in: '2026-10-02', check_out: '2026-10-04', status: 'Completed' },
];

// F-01: one page that shows every shared UI part. Use it to check the look and behaviour.
export default function StyleGuide() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function checkEmail(e) {
    e.preventDefault();
    if (!email.trim()) setEmailError('Enter your email address.');
    else if (!/^\S+@\S+\.\S+$/.test(email)) setEmailError('Enter a valid email address, like name@rub.edu.bt.');
    else {
      setEmailError('');
      toast.success('Email looks good.');
    }
  }

  function fakeSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Saved.');
    }, 1200);
  }

  return (
    <main className="container">
      <h1>G-Link style guide</h1>
      <p className="muted">F-01 · Every shared part in one place. Build pages from these parts.</p>

      <section className="ui-card" aria-labelledby="sg-colours">
        <h2 id="sg-colours">Colours</h2>
        <div className="sg-swatches">
          {COLOURS.map(([name, variable, hex]) => (
            <div key={variable} className="sg-swatch">
              <span className="sg-swatch__colour" style={{ background: `var(${variable})` }} />
              <strong>{name}</strong>
              <code>{hex}</code>
            </div>
          ))}
        </div>
        <h3>Booking status</h3>
        <div className="sg-row">
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </section>

      <section className="ui-card" aria-labelledby="sg-type">
        <h2 id="sg-type">Type</h2>
        <h1>Heading 1 · 32px</h1>
        <h2>Heading 2 · 24px</h2>
        <h3>Heading 3 · 20px</h3>
        <p>Body text · 16px. The quick brown fox jumps over the lazy dog.</p>
        <p className="muted">Muted text · for hints and less important details.</p>
      </section>

      <section className="ui-card" aria-labelledby="sg-buttons">
        <h2 id="sg-buttons">Buttons</h2>
        <div className="sg-row">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button loading={saving} onClick={fakeSave}>
            {saving ? 'Saving…' : 'Click to load'}
          </Button>
          <Button disabled>Disabled</Button>
          <Button size="small" variant="secondary">
            Small
          </Button>
        </div>
      </section>

      <section className="ui-card" aria-labelledby="sg-forms">
        <h2 id="sg-forms">Form fields</h2>
        <form onSubmit={checkEmail} noValidate className="sg-form">
          <TextInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            help="Use your RUB email if you have one."
            required
            autoComplete="email"
          />
          <TextInput label="With an error" defaultValue="abc" error="This is how an error looks." />
          <PasswordInput label="Password" help="At least 8 characters." autoComplete="new-password" />
          <Select label="Gender" placeholder="Choose…" options={['Male', 'Female', 'Other']} />
          <DatePicker label="Check-in date" min="2026-10-07" />
          <TextInput label="Disabled" defaultValue="Cannot change" disabled />
          <Button type="submit">Check email</Button>
        </form>
      </section>

      <section className="ui-card" aria-labelledby="sg-table">
        <h2 id="sg-table">Table</h2>
        <Table
          caption="Booking requests"
          columns={[
            { key: 'guest', header: 'Guest' },
            { key: 'room', header: 'Room' },
            { key: 'check_in', header: 'Check-in' },
            { key: 'check_out', header: 'Check-out' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            {
              key: 'actions',
              header: 'Actions',
              render: () => (
                <Button size="small" variant="secondary">
                  Review
                </Button>
              ),
            },
          ]}
          rows={SAMPLE_ROWS}
        />
        <h3 className="sg-gap">Empty table</h3>
        <Table columns={[{ key: 'a', header: 'Room' }, { key: 'b', header: 'Beds' }]} rows={[]} emptyMessage="No rooms found." />
      </section>

      <section className="ui-card" aria-labelledby="sg-feedback">
        <h2 id="sg-feedback">Modal and toast</h2>
        <div className="sg-row">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Button variant="secondary" onClick={() => toast.success('Booking approved.')}>
            Success toast
          </Button>
          <Button variant="secondary" onClick={() => toast.error('Could not save. Try again.')}>
            Error toast
          </Button>
          <Button variant="secondary" onClick={() => toast.info('Your email has been sent.')}>
            Info toast
          </Button>
        </div>
      </section>

      <Modal
        open={modalOpen}
        title="Reject booking?"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setModalOpen(false);
                toast.info('Booking rejected.');
              }}
            >
              Reject
            </Button>
          </>
        }
      >
        <p>Press Escape or click outside this box to close it.</p>
        <TextInput label="Reason" help="The guest will see this reason." />
      </Modal>
    </main>
  );
}
