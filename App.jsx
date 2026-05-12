import React, {useEffect} from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RootNavigator} from '@navigation/RootNavigator';
import {COLORS} from '@constants/colors';
import {useHistoryStore} from '@store/historyStore';
import {useMemoryStore} from '@store/memoryStore';
import {useProfileStore} from '@store/profileStore';

/**
 * HydrationGate reads all MMKV data synchronously on the first render, so
 * every screen shows locally-cached content immediately — no loading spinner.
 * It then fires background network refreshes in parallel after mount.
 *
 * MMKV reads are synchronous, so there is no loading state; children render
 * on the very first pass with already-populated store data.
 */
function HydrationGate({children}) {
  const hydrateHistory = useHistoryStore(s => s.hydrate);
  const hydrateMemories = useMemoryStore(s => s.hydrate);
  const hydrateProfile = useProfileStore(s => s.hydrate);

  // Run once on mount. Both hydrate() calls are synchronous MMKV reads
  // followed by an async background network refresh.
  useEffect(() => {
    hydrateHistory();
    hydrateMemories();
    hydrateProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
}

const App = () => {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <HydrationGate>
          <RootNavigator />
        </HydrationGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default App;
