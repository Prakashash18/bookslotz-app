import { useNavigate } from 'react-router-dom';
import { BareShell } from '../components/WizardShell';
import { useSession } from '../lib/auth';
import { Welcome } from './screens/Welcome';

export default function Landing() {
  const navigate = useNavigate();
  const { session, loading } = useSession();

  function createBooking() {
    if (loading) return;
    if (session) navigate('/new');
    else navigate('/login', { state: { next: '/new' } });
  }

  function signIn() {
    if (loading) return;
    navigate(session ? '/dashboard' : '/login', session ? undefined : { state: { next: '/dashboard' } });
  }

  return (
    <BareShell>
      <Welcome onCreateBooking={createBooking} onSignIn={signIn} />
    </BareShell>
  );
}
