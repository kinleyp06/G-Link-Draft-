import { Button } from './ui';

// A failed load, in plain words, with a "Try again" button.
export default function ErrorMessage({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="notice notice--danger" role="alert">
      <p>{error.message || 'Something went wrong.'}</p>
      {onRetry && (
        <Button variant="secondary" size="small" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
