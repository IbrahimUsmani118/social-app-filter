import { NotificationsActivityListScreen } from '#/screens/Notifications/ActivityList';

export default function Notifications() {
  // Use the existing NotificationsActivityListScreen component
  return <NotificationsActivityListScreen route={{ name: 'NotificationsActivityList', params: { posts: '' } } as any} navigation={{} as any} />;
}
