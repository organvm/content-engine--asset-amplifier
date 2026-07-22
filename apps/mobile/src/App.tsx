import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import Dashboard from './screens/Dashboard.js';
import ReviewQueue from './screens/ReviewQueue.js';

export default function App() {
  const [activeBrand, setActiveBrand] = useState<{ id: string; name: string } | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
      {activeBrand ? (
        <ReviewQueue brandId={activeBrand.id} key={activeBrand.id} />
      ) : (
        <Dashboard onSelectBrand={(id, name) => setActiveBrand({ id, name })} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
});
