// Mock for ExpoBackgroundNotificationHandler
export const BackgroundNotificationHandler = {
  getAllPrefsAsync: async () => ({}),
  getBoolAsync: async (_: string) => false,
  getStringAsync: async (_: string) => '',
  getStringArrayAsync: async (_: string) => [],
  setBoolAsync: async (_: string, __: boolean) => {},
  setStringAsync: async (_: string, __: string) => {},
  setStringArrayAsync: async (_: string, __: string[]) => {},
  addToStringArrayAsync: async (_: string, __: string) => {},
  removeFromStringArrayAsync: async (_: string, __: string) => {},
  addManyToStringArrayAsync: async (_: string, __: string[]) => {},
  removeManyFromStringArrayAsync: async (_: string, __: string[]) => {},
  setBadgeCountAsync: async (_: number) => {},
}

export default BackgroundNotificationHandler
