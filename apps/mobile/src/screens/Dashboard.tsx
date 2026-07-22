import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import type { Brand } from '../services/api.js';
import { brandService } from '../services/api.js';

interface Props {
  onSelectBrand: (brandId: string, brandName: string) => void;
}

export default function Dashboard({ onSelectBrand }: Props) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    brandService.list()
      .then(setBrands)
      .catch((err: Error) => setError(err.message ?? 'Failed to load brands'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading brands...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cronus Metabolus</Text>
      <Text style={styles.subtitle}>Select a brand to manage</Text>
      <FlatList
        data={brands}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.brandCard}
            onPress={() => onSelectBrand(item.id, item.name)}
          >
            <Text style={styles.brandName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.brandDescription}>{item.description}</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No brands found. Create one in the dashboard.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },
  loadingText: { color: '#888', marginTop: 12, fontSize: 14 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 24 },
  brandCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  brandName: { color: '#fff', fontSize: 18, fontWeight: '600' },
  brandDescription: { color: '#888', fontSize: 13, marginTop: 4 },
  empty: { color: '#555', textAlign: 'center', marginTop: 40, fontSize: 14 },
  errorText: { color: '#ef4444', textAlign: 'center', marginTop: 40, fontSize: 14 },
});
