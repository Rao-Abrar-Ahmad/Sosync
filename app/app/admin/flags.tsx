import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Theme from '@/config/theme';
import { adminSubscribeToFlags, adminResolveFlag, getUserDocument } from '@/config/dbutils';
import { formatFirebaseTimestamp } from '@/constants/utils';

export default function FlagManagementScreen() {
  const router = useRouter();
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = adminSubscribeToFlags((data) => {
      setFlags(data);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  const handleResolveFlag = (flagId: string, action: 'RESOLVED' | 'DISMISSED') => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to mark this flag as ${action.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              await adminResolveFlag(flagId, action);
              Alert.alert('Success', `Flag has been ${action.toLowerCase()}.`);
            } catch (error) {
              Alert.alert('Error', 'Failed to resolve flag.');
            }
          }
        }
      ]
    );
  };

  const renderFlagItem = ({ item }: { item: any }) => (
    <View style={styles.flagCard}>
      <View style={styles.flagHeader}>
        <View style={styles.reasonBadge}>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
        <Text style={styles.dateText}>{formatFirebaseTimestamp(item.created_at)}</Text>
      </View>

      <Text style={styles.descriptionText}>
        {item.description || 'No additional description provided.'}
      </Text>

      <View style={styles.reportInfo}>
        <Text style={styles.reportIdLabel}>Report ID: </Text>
        <Text style={styles.reportIdValue}>{item.report_id}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.reviewBtn]}
          onPress={() => router.push(`/report/${item.report_id}` as any)}
        >
          <FontAwesome name="eye" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>Review Report</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.dismissBtn]}
          onPress={() => handleResolveFlag(item.id, 'DISMISSED')}
        >
          <FontAwesome name="times" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>Dismiss</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.resolveBtn]}
          onPress={() => handleResolveFlag(item.id, 'RESOLVED')}
        >
          <FontAwesome name="check" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>Resolve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.variants.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={18} color={Theme.variants.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flagged Content</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={flags}
        renderItem={renderFlagItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="check-circle" size={60} color="#4CAF50" />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySubtitle}>There are no pending flags to review.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Theme.variants.border
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: Theme.typography.geom, fontSize: 18, color: Theme.variants.text, fontWeight: 'bold' },
  listContent: { padding: 16, paddingBottom: 40 },
  flagCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336'
  },
  flagHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reasonBadge: { backgroundColor: '#FFEBEE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  reasonText: { color: '#D32F2F', fontSize: 12, fontFamily: Theme.typography.inter.bold },
  dateText: { fontSize: 12, color: Theme.variants.textMuted, fontFamily: Theme.typography.inter.regular },
  descriptionText: { fontSize: 14, color: Theme.variants.text, fontFamily: Theme.typography.inter.regular, lineHeight: 20, marginBottom: 16 },
  reportInfo: { backgroundColor: '#f1f3f5', padding: 8, borderRadius: 8, marginBottom: 16 },
  reportIdLabel: { fontSize: 11, color: Theme.variants.textMuted, fontFamily: Theme.typography.inter.semibold },
  reportIdValue: { fontSize: 12, color: Theme.variants.text, fontFamily: Theme.typography.inter.regular },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  reviewBtn: { backgroundColor: Theme.variants.primary },
  dismissBtn: { backgroundColor: '#6c757d' },
  resolveBtn: { backgroundColor: '#28a745' },
  actionBtnText: { color: '#fff', fontSize: 12, fontFamily: Theme.typography.inter.bold },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 22, fontFamily: Theme.typography.inter.bold, color: Theme.variants.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, fontFamily: Theme.typography.inter.regular, color: Theme.variants.textMuted, marginTop: 8 },
});
