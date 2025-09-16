// Mock for ExpoPlatformInfo
export const ExpoPlatformInfo = {
  getPlatformInfoAsync: async () => ({
    platform: 'web',
    version: '1.0.0',
    buildNumber: '1',
    isDevice: false,
  }),
  getDeviceInfoAsync: async () => ({
    deviceName: 'Web Browser',
    deviceModel: 'Web',
    systemName: 'Web',
    systemVersion: '1.0.0',
  }),
}

export default ExpoPlatformInfo
