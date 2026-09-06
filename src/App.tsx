import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Landing from './organiser/Landing';
import AuthScreen from './organiser/AuthScreen';
import ResetPassword from './organiser/ResetPassword';
import { RequireAuth } from './organiser/RequireAuth';
import OrganiserWizard from './organiser/OrganiserWizard';
import OrganiserEventPage from './organiser/OrganiserEventPage';
import MyEvents from './organiser/MyEvents';
import PublicBookingFlow from './public-site/PublicBookingFlow';
import PublicDone from './public-site/PublicDone';
import PublicManageFlow from './public-site/PublicManageFlow';

/**
 * Supabase's password-recovery email redirects to whatever "Site URL" is
 * configured in the dashboard if our requested redirectTo isn't in the
 * project's Redirect URLs allowlist — which can land the user on the wrong
 * page/origin entirely. supabase-js still processes the recovery token from
 * the URL hash regardless of path, so catching the PASSWORD_RECOVERY event
 * here and routing to /reset-password works even when that misconfiguration
 * sends the link somewhere else first.
 */
function AuthRecoveryRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthRecoveryRedirect />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthScreen />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/new"
          element={
            <RequireAuth>
              <OrganiserWizard />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <MyEvents />
            </RequireAuth>
          }
        />
        <Route path="/e/:eventId" element={<OrganiserEventPage />} />
        <Route path="/b/:slug" element={<PublicBookingFlow />} />
        <Route path="/b/:slug/booked/:manageToken" element={<PublicDone />} />
        <Route path="/b/:slug/m/:manageToken" element={<PublicManageFlow />} />
      </Routes>
    </BrowserRouter>
  );
}
