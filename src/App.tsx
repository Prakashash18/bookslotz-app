import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Landing from './organiser/Landing';
import AuthScreen from './organiser/AuthScreen';
import { RequireAuth } from './organiser/RequireAuth';
import OrganiserWizard from './organiser/OrganiserWizard';
import OrganiserEventPage from './organiser/OrganiserEventPage';
import MyEvents from './organiser/MyEvents';
import PublicBookingFlow from './public-site/PublicBookingFlow';
import PublicDone from './public-site/PublicDone';
import PublicManageFlow from './public-site/PublicManageFlow';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthScreen />} />
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
