import { MessagesInboxScreen } from '#/screens/Messages/Inbox';

export default function Messages() {
  // Use the existing MessagesInboxScreen component
  return <MessagesInboxScreen route={{ name: 'MessagesInbox', params: {} } as any} navigation={{} as any} />;
}
