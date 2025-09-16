import { HomeScreen } from '#/view/screens/Home';

export default function Home() {
  // Use the existing HomeScreen component
  return <HomeScreen route={{ name: 'Home', params: {} } as any} navigation={{} as any} />;
}
