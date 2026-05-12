/**
 * Project-level autolinking overrides.
 *
 * react-native-mmkv v4 ships an `AndroidManifest.xml` without a `package`
 * attribute (it relies on `namespace` in build.gradle instead). The classic
 * `@react-native-community/cli` autodetection still uses the legacy package
 * heuristic, so it returns `android: null` for MMKV and the React Gradle
 * plugin never links the native module. The result at runtime is:
 *
 *   `NitroModulesProxy.createHybridObject('MMKVFactory')` threw an unknown
 *   std::runtime_error error
 *
 * because libNitroMmkv.so was never compiled into the APK.
 *
 * This file forces explicit Android linking for MMKV by replicating the same
 * shape the CLI produces for `react-native-nitro-modules`.
 */
const path = require('path');

const mmkvAndroid = path.resolve(
  __dirname,
  'node_modules/react-native-mmkv/android',
);

module.exports = {
  dependencies: {
    'react-native-mmkv': {
      platforms: {
        android: {
          sourceDir: mmkvAndroid,
          packageImportPath: 'import com.margelo.nitro.mmkv.NitroMmkvPackage;',
          packageInstance: 'new NitroMmkvPackage()',
        },
      },
    },
  },
};
