import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { BareShell } from '../components/WizardShell';
import { useSession } from '../lib/auth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <BareShell>
        <div style={{ fontSize: 15, color: 'var(--bs-ink-soft)' }}>Loading…</div>
      </BareShell>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ next: location.pathname }} replace />;
  }

  return <>{children}</>;
}
