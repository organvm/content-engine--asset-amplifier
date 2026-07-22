import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import type { ContentUnit } from '../services/api.js';
import { contentService } from '../services/api.js';

interface Props {
  brandId: string;
}

export default function ReviewQueue({ brandId }: Props) {
  const [units, setUnits] = useState<ContentUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContent = () => {
    setLoading(true);
    setError(null);
    contentService.list(brandId, { approval_status: 'pending' })
      .then(setUnits)
      .catch((err: Error) => setError(err.message ?? 'Failed to load content'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadContent(); }, [brandId]);

  const handleApprove = async (id: string) => {
    await contentService.approve(brandId, id);
    loadContent();
  };

  const handleReject = async (id: string) => {
    await contentService.reject(brandId, id);
    loadContent();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
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
      <Text style={styles.title}>Review Queue</Text>
      <FlatList
        data={units}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.platform}>{item.platform.replace(/_/g, ' ')}</Text>
              <Text style={[styles.score, { color: item.nc_score >= 0.75 ? '#4ade80' : '#facc15' }]}>
                {Math.round(item.nc_score * 100)}%
              </Text>
            </View>
            <Text style={styles.caption} numberOfLines={3}>{item.caption}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
                <Text style={styles.btnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No pending content to review.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  platform: { color: '#6366f1', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  score: { fontSize: 13, fontWeight: 'bold' },
  caption: { color: '#ccc', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  approveBtn: { backgroundColor: '#166534', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 20 },
  rejectBtn: { backgroundColor: '#7f1d1d', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 20 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  empty: { color: '#555', textAlign: 'center', marginTop: 40 },
  errorText: { color: '#ef4444', textAlign: 'center', marginTop: 40, fontSize: 14 },
});
