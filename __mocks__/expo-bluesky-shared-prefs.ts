// Mock for ExpoBlueskySharedPrefs
export const ExpoBlueskySharedPrefs = {
  getStringAsync: async (_: string) => '',
  setStringAsync: async (_: string, __: string) => {},
  getBooleanAsync: async (_: string) => false,
  setBooleanAsync: async (_: string, __: boolean) => {},
  getIntAsync: async (_: string) => 0,
  setIntAsync: async (_: string, __: number) => {},
  removeAsync: async (_: string) => {},
  clearAsync: async () => {},
}

export default ExpoBlueskySharedPrefs
