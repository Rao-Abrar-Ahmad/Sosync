import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import Theme from '@/config/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { getAllDisasterReports, adminUpdateReportStatus, DisasterReportDocument, ReportStatus } from '@/config/dbutils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate, getStatusColor } from '@/constants/utils';
import { useRouter } from 'expo-router';

export default function AdminReportManagement() {
  const router = useRouter();
  const [reports, setReports] = useState<DisasterReportDocument[]>([]);
  const [filter, setFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const data = await getAllDisasterReports();
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = filter === 'ALL' 
    ? reports 
    : reports.filter(r => r.status === filter);

  const updateStatus = (reportId: string, status: ReportStatus) => {
    Alert.alert(
      'Update Status',
      `Change report status to ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              await adminUpdateReportStatus(reportId, status);
              fetchReports();
            } catch (err) {
              Alert.alert('Error', 'Failed to update report.');
            }
          }
        }
      ]
    );
  };

  const renderReportItem = ({ item }: { item: DisasterReportDocument }) => (
    <TouchableOpacity 
      style={styles.reportCard} 
      onPress={() => router.push(`/admin/report/${item.id}` as any)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.reportType}>{item.type}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.locationRow}>
        <FontAwesome name="map-marker" size={12} color={Theme.variants.textMuted} />
        <Text style={styles.locationTxt} numberOfLines={1}>
          {item.address || `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
        </Text>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        <View style={styles.voteStats}>
          <Text style={styles.voteTxt}>✅ {item.confirm_count || 0}</Text>
          <Text style={styles.voteTxt}>❌ {item.dismiss_count || 0}</Text>
        </View>
      </View>

      <View style={styles.adminActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.id, 'VERIFIED')}>
          <FontAwesome name="check" size={14} color="#4caf50" />
          <Text style={[styles.actionTxt, { color: '#4caf50' }]}>Verify</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.id, 'FALSE_ALARM')}>
          <FontAwesome name="times" size={14} color="#f44336" />
          <Text style={[styles.actionTxt, { color: '#f44336' }]}>False Alarm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.id, 'RESOLVED')}>
          <FontAwesome name="flag-checkered" size={14} color="#2196f3" />
          <Text style={[styles.actionTxt, { color: '#2196f3' }]}>Resolve</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['ALL', 'PENDING', 'VERIFIED', 'RESOLVED', 'FALSE_ALARM'].map((f) => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f as any)}
            >
              <Text style={[styles.filterTxt, filter === f && styles.filterTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Theme.variants.primary} />
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id}
          renderItem={renderReportItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyTxt}>No reports found in this category.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  filterWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterScroll: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterBtnActive: {
    backgroundColor: Theme.variants.primary,
  },
  filterTxt: {
    fontSize: 12,
    fontFamily: Theme.typography.inter.medium,
    color: '#666',
  },
  filterTxtActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
    gap: 16,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportType: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 16,
    color: Theme.variants.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  description: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 14,
    color: Theme.variants.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationTxt: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 12,
    color: Theme.variants.textMuted,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  date: {
    fontSize: 12,
    color: '#aaa',
  },
  voteStats: {
    flexDirection: 'row',
    gap: 10,
  },
  voteTxt: {
    fontSize: 12,
    color: Theme.variants.text,
    fontFamily: Theme.typography.inter.medium,
  },
  adminActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    gap: 6,
  },
  actionTxt: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyTxt: {
    textAlign: 'center',
    marginTop: 60,
    color: Theme.variants.textMuted,
  }
});
