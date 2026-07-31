import { groupDescriptorFields, settingDescriptorFields } from './config.js';

export const pages = [{
  outputPath: 'config/descriptors.md',
  context: { groupDescriptorFields, settingDescriptorFields }
}];
