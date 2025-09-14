import {NativeModule, requireNativeModule} from 'expo'

declare class EmojiPickerModuleClass extends NativeModule {}

let EmojiPickerModule: any
try {
  EmojiPickerModule = requireNativeModule<EmojiPickerModuleClass>('EmojiPicker')
} catch (error) {
  console.warn('EmojiPicker native module not available, using mock')
  EmojiPickerModule = {
    // Mock implementation
  }
}

export default EmojiPickerModule
