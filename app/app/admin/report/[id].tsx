import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, FlatList, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Theme from '@/config/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  getDisasterReport,
  updateDisasterReport,
  adminGetReportVotes,
  adminRemoveReportMedia,
  DisasterReportDocument,
  ReportStatus,
  DisasterType
} from '@/config/dbutils';
import { formatDate, getStatusColor } from '@/constants/utils';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminReportDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [report, setReport] = useState<DisasterReportDocument | null>(null);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ReportStatus>('PENDING');
  const [severity, setSeverity] = useState('');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportData, votesData] = await Promise.all([
        getDisasterReport(id as string),
        adminGetReportVotes(id as string)
      ]);

      if (reportData) {
        setReport(reportData);
        setDescription(reportData.description);
        setStatus(reportData.status);
        setSeverity(reportData.severity_level || '');
      }
      setVotes(votesData);
    } catch (error) {
      console.error('Error fetching admin report detail:', error);
      Alert.alert('Error', 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!report) return;
    try {
      setSaving(true);
      await updateDisasterReport(report.id, {
        description,
        status,
        severity_level: severity,
      });
      Alert.alert('Success', 'Report updated successfully.');
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update report.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMedia = async (fileName: string) => {
    Alert.alert(
      'Remove Media',
      'Are you sure you want to permanently remove this media item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminRemoveReportMedia(report!.id, fileName);
              fetchData(); // Refresh
            } catch (err) {
              Alert.alert('Error', 'Failed to remove media.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.variants.primary} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.center}>
        <Text>Report not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review Information</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Disaster Type</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyTxt}>{report.type}</Text>
            </View>

            <Text style={styles.label}>Location</Text>
            <Text style={styles.subLabel}>{report.address || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}</Text>
          </View>
        </View>

        {/* Edit Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modify Report</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              multiline
              value={description}
              onChangeText={setDescription}
              placeholder="Enter report description..."
            />

            <Text style={styles.label}>Severity Level</Text>
            <View style={styles.statusRow}>
              {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.statusBtn,
                    severity === level && { backgroundColor: '#333' }
                  ]}
                  onPress={() => setSeverity(level)}
                >
                  <Text style={[styles.statusBtnTxt, severity === level && { color: '#fff' }]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Update Status</Text>
            <View style={styles.statusRow}>
              {(['PENDING', 'VERIFIED', 'RESOLVED', 'FALSE_ALARM'] as ReportStatus[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusBtn,
                    status === s && { backgroundColor: getStatusColor(s) }
                  ]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.statusBtnTxt, status === s && { color: '#fff' }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <FontAwesome name="save" size={16} color="#fff" />
                  <Text style={styles.saveBtnTxt}>Apply Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* Media Moderation Section */}
        {report.media && report.media.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attached Media Moderation</Text>
            <View style={styles.mediaGrid}>
              {report.media.map((item, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Image source={{ uri: item.url }} style={styles.mediaThumb} />
                  <TouchableOpacity
                    style={styles.deleteMediaBtn}
                    onPress={() => handleRemoveMedia(item.file_name)}
                  >
                    <FontAwesome name="trash" size={14} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.mediaTypeBadge}>
                    <Text style={styles.mediaTypeTxt}>{item.type}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        {/* Votes Section */}
        <View style={styles.section}>
          <View style={styles.voteHeader}>
            <Text style={styles.sectionTitle}>Community Votes</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{votes.length} Total</Text>
            </View>
          </View>

          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, { flex: 2 }]}>User</Text>
              <Text style={[styles.columnHeader, { flex: 1.5 }]}>Vote</Text>
              <Text style={[styles.columnHeader, { flex: 2 }]}>Date</Text>
            </View>

            {votes.length === 0 ? (
              <Text style={styles.noVotes}>No votes cast yet.</Text>
            ) : (
              votes.map((vote, idx) => (
                <View key={vote.id} style={[styles.tableRow, idx === votes.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={[styles.cell, { flex: 2 }]} numberOfLines={1}>{vote.user_name}</Text>
                  <View style={[styles.cell as any, { flex: 1.5 }]}>
                    <View style={[
                      styles.voteBadge,
                      { backgroundColor: vote.vote === 'CONFIRM' ? '#e8f5e9' : '#ffebee' }
                    ]}>
                      <Text style={[
                        styles.voteBadgeTxt,
                        { color: vote.vote === 'CONFIRM' ? '#4caf50' : '#f44336' }
                      ]}>{vote.vote}</Text>
                    </View>
                  </View>
                  <Text style={[styles.cell, { flex: 2, fontSize: 11 }]}>{formatDate(vote.created_at)}</Text>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  voteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 18,
    color: Theme.variants.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  label: {
    fontFamily: Theme.typography.inter.semibold,
    fontSize: 13,
    color: Theme.variants.text,
    marginBottom: 6,
  },
  subLabel: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 14,
    color: Theme.variants.textMuted,
    marginBottom: 16,
  },
  readOnlyBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  readOnlyTxt: {
    fontFamily: Theme.typography.inter.medium,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    fontFamily: Theme.typography.inter.regular,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  statusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusBtnTxt: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
  },
  saveBtn: {
    backgroundColor: Theme.variants.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  saveBtnTxt: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 16,
    color: '#fff',
  },
  badge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTxt: {
    fontSize: 12,
    color: '#2196f3',
    fontWeight: 'bold',
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    alignItems: 'center',
  },
  cell: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 13,
    color: Theme.variants.text,
  },
  voteBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  voteBadgeTxt: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  noVotes: {
    padding: 30,
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mediaItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eee',
    position: 'relative',
  },
  mediaThumb: {
    width: '100%',
    height: '100%',
  },
  deleteMediaBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(211, 47, 47, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  mediaTypeBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mediaTypeTxt: {
    fontSize: 9,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
