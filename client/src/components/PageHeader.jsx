import { Link } from 'react-router-dom';

export default function PageHeader({ title, subtitle, back, actions }) {
  return (
    <header className="page-header">
      {back && (
        <Link className="page-header__back" to={back.to}>
          ← {back.label}
        </Link>
      )}
      <div className="page-header__row">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
    </header>
  );
}
