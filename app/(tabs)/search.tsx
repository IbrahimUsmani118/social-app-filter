import { SearchScreen } from '#/screens/Search';

export default function Search() {
  // Use the existing SearchScreen component
  return <SearchScreen route={{ name: 'Search', params: {} } as any} navigation={{} as any} />;
}
