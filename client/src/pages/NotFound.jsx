import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';

export default function NotFound() {
  return (
    <div className="container">
      <PageHeader title="Page not found" subtitle="The link may be old or mistyped." />
      <Link to="/">Go to the start page</Link>
    </div>
  );
}
