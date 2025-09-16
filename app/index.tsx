import { Redirect } from 'expo-router';
import { useSession } from '#/state/session';

export default function Index() {
  const { hasSession } = useSession();
  
  if (hasSession) {
    return <Redirect href="/(tabs)" />;
  }
  
  return <Redirect href="/login" />;
}
