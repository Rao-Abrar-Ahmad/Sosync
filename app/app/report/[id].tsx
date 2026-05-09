import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MapView, { Marker } from 'react-native-maps';
import { getDisasterReport, DisasterReportDocument, voteOnReport, getUserVoteOnReport, VoteType } from '@/config/dbutils';
import Theme from '@/config/theme';
import { useUser } from '@/context/UserContext';
import { formatDate, formatFirebaseTimestamp, getSeverityColor } from '@/constants/utils';

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const [report, setReport] = useState<DisasterReportDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [userVote, setUserVote] = useState<VoteType | null>(null);

  useEffect(() => {
    if (id) {
      fetchReportDetails(id as string);
    }
  }, [id]);

  const fetchReportDetails = async (reportId: string) => {
    try {
      setLoading(true);
      const data = await getDisasterReport(reportId);
      setReport(data);
      
      if (user) {
        const vote = await getUserVoteOnReport(reportId, user.id as any);
        setUserVote(vote);
      }
    } catch (err) {
      console.error('Error fetching report details:', err);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Theme.variants.primary} />
        <Text style={styles.loadingText}>Loading report details...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.container, styles.center]}>
        <FontAwesome name="exclamation-circle" size={48} color="#F44336" />
        <Text style={styles.errorText}>Report not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleVote = async (voteType: VoteType) => {
    if (!user || !report) return;
    if (userVote === voteType) return;

    try {
      setVoting(true);
      await voteOnReport(report.id, user.id as any, voteType);
      const successMsg = userVote 
        ? `You have changed your vote to ${voteType.toLowerCase()}.`
        : `You have voted to ${voteType.toLowerCase()} this report.`;
      
      Alert.alert('Success', successMsg);
      setUserVote(voteType);
      fetchReportDetails(report.id);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };
  console.log(report)
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <FontAwesome name="chevron-down" size={20} color={Theme.variants.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Title & Status Row */}
        <View style={styles.titleRow}>
          <Text style={styles.typeText}>{report.type}</Text>
          {/* <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
            <Text style={styles.statusText}>{report.status}</Text>
          </View> */}
        </View>

        {/* Date & ID */}
        <Text style={styles.metaText}>
          Reported on: {formatFirebaseTimestamp(report.created_at as any)}
        </Text>

        {/* Severity */}
        {report.severity_level && (
          <View style={styles.severityContainer}>
            <Text style={styles.sectionTitle}>Severity:</Text>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(report.severity_level) }]}>
              <Text style={styles.severityText}>{report.severity_level}</Text>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{report.description}</Text>

        <View style={styles.divider} />

        {/* Media */}
        <Text style={styles.sectionTitle}>Attachments</Text>
        {report.media && report.media.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
            {report.media.map((item, idx) => (
              <View key={idx} style={styles.mediaContainer}>
                <Image source={{ uri: item.url }} style={styles.mediaItem} />
                {item.type === 'video' && (
                  <View style={styles.videoOverlay}>
                    <FontAwesome name="play-circle" size={32} color="#fff" />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noMediaContainer}>
            <FontAwesome name="image" size={32} color={Theme.variants.border} />
            <Text style={styles.noMediaText}>No attachments provided.</Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* Location Map */}
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.addressText}>{report.address || 'Address not provided'}</Text>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: report.latitude,
              longitude: report.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            pitchEnabled={false}
            rotateEnabled={false}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={{ latitude: report.latitude, longitude: report.longitude }} />
          </MapView>
        </View>

        <View style={styles.divider} />

        {/* Validation / Voting */}
        <Text style={styles.sectionTitle}>Community Validation</Text>
        <Text style={styles.validationHelpText}>
          Help the community by validating this report. Is this information accurate?
        </Text>
        <View style={styles.votingContainer}>
          <TouchableOpacity
            style={[
              styles.voteButton, 
              styles.voteConfirm, 
              voting && { opacity: 0.5 },
              userVote === 'CONFIRM' && styles.activeVoteConfirm
            ]}
            onPress={() => handleVote('CONFIRM')}
            disabled={voting || userVote === 'CONFIRM'}
          >
            <FontAwesome name="thumbs-up" size={20} color="#fff" />
            <Text style={styles.voteButtonText}>Confirm ({report.confirm_count || 0})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.voteButton, 
              styles.voteDismiss, 
              voting && { opacity: 0.5 },
              userVote === 'DISMISS' && styles.activeVoteDismiss
            ]}
            onPress={() => handleVote('DISMISS')}
            disabled={voting || userVote === 'DISMISS'}
          >
            <FontAwesome name="thumbs-down" size={20} color="#fff" />
            <Text style={styles.voteButtonText}>Dismiss ({report.dismiss_count || 0})</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontFamily: Theme.typography.inter.regular, color: Theme.variants.textMuted },
  errorText: { marginTop: 12, fontFamily: Theme.typography.inter.bold, fontSize: 18, color: '#F44336' },
  backButton: { marginTop: 20, backgroundColor: Theme.variants.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { color: '#fff', fontFamily: Theme.typography.inter.bold },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Theme.variants.border },
  headerIcon: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontFamily: Theme.typography.geom, fontSize: 20, color: Theme.variants.text, fontWeight: 'bold' },
  content: { padding: 16, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeText: { fontFamily: Theme.typography.inter.bold, fontSize: 24, color: Theme.variants.text },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: '#fff', fontFamily: Theme.typography.inter.bold, fontSize: 12 },
  metaText: { fontFamily: Theme.typography.inter.regular, fontSize: 13, color: Theme.variants.textMuted, marginBottom: 4 },
  severityContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  severityText: { color: '#fff', fontFamily: Theme.typography.inter.bold, fontSize: 12 },
  divider: { height: 1, backgroundColor: Theme.variants.border, marginVertical: 20 },
  sectionTitle: { fontFamily: Theme.typography.inter.bold, fontSize: 16, color: Theme.variants.text, marginBottom: 12 },
  descriptionText: { fontFamily: Theme.typography.inter.regular, fontSize: 15, color: Theme.variants.text, lineHeight: 22 },
  mediaScroll: { flexGrow: 0 },
  mediaContainer: { position: 'relative', marginRight: 12 },
  mediaItem: { width: 140, height: 140, borderRadius: 12, backgroundColor: Theme.variants.border },
  videoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12 },
  noMediaContainer: { padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, borderWidth: 1, borderColor: Theme.variants.border, borderStyle: 'dashed' },
  noMediaText: { marginTop: 8, fontFamily: Theme.typography.inter.regular, color: Theme.variants.textMuted },
  addressText: { fontFamily: Theme.typography.inter.regular, fontSize: 14, color: Theme.variants.text, marginBottom: 12 },
  mapContainer: { height: 200, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Theme.variants.border },
  map: { flex: 1 },
  validationHelpText: { fontFamily: Theme.typography.inter.regular, fontSize: 13, color: Theme.variants.textMuted, marginBottom: 16 },
  votingContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  voteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 8 },
  voteConfirm: { backgroundColor: '#4CAF50' },
  voteDismiss: { backgroundColor: '#F44336' },
  voteButtonText: { color: '#fff', fontFamily: Theme.typography.inter.bold, fontSize: 16 },
  activeVoteConfirm: { borderWidth: 3, borderColor: '#1B5E20', backgroundColor: '#43A047' },
  activeVoteDismiss: { borderWidth: 3, borderColor: '#B71C1C', backgroundColor: '#E53935' },
});
