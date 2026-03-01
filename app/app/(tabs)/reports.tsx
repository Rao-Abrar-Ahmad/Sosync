import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllDisasterReports, DisasterReportDocument, DisasterType } from '@/config/dbutils';
import Theme from '@/config/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<DisasterReportDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all reports on mount
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedReports = await getAllDisasterReports();
      setReports(fetchedReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDisasterIcon = (type: DisasterType) => {
    switch (type) {
      case 'FLOOD':
        return 'tint';
      case 'EARTHQUAKE':
        return 'bolt';
      case 'FIRE':
        return 'fire';
      case 'ACCIDENT':
        return 'car';
      case 'LANDSLIDE':
        return 'exclamation';
      default:
        return 'question-circle';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FF9800';
      case 'VERIFIED':
        return '#4CAF50';
      case 'RESOLVED':
        return '#2196F3';
      case 'FALSE_ALARM':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'Low':
        return '#4CAF50';
      case 'Medium':
        return '#FF9800';
      case 'High':
        return '#F44336';
      case 'Critical':
        return '#8B0000';
      default:
        return '#9E9E9E';
    }
  };

  const formatDate = (date: any) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <LinearGradient
      colors={Theme.backgrounds.white as any}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Disaster Reports</Text>
        <Text style={styles.headerSubtitle}>
          {loading ? 'Loading...' : `${reports.length} report${reports.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.variants.primary} />
          <Text style={styles.loadingText}>Fetching disaster reports...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.centerContainer}>
          <FontAwesome name="exclamation-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReports}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!loading && reports.length === 0 && !error && (
        <View style={styles.centerContainer}>
          <FontAwesome name="inbox" size={48} color={Theme.variants.textMuted} />
          <Text style={styles.emptyText}>No disaster reports yet</Text>
          <Text style={styles.emptySubtext}>Be the first to report a disaster in your area</Text>
        </View>
      )}

      {/* Reports List */}
      {!loading && reports.length > 0 && (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.reportCard} activeOpacity={0.8}>
              {/* Top Section - Type and Status */}
              <View style={styles.reportHeader}>
                <View style={styles.typeContainer}>
                  <View
                    style={[
                      styles.typeIconContainer,
                      { backgroundColor: `${Theme.variants.primary}20` },
                    ]}
                  >
                    <FontAwesome
                      name={getDisasterIcon(item.type)}
                      size={24}
                      color={Theme.variants.primary}
                    />
                  </View>
                  <View>
                    <Text style={styles.reportType}>{item.type}</Text>
                    <Text style={styles.reportId}>ID: {item.id.slice(0, 12)}...</Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>

              {/* Location and Severity Row */}
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <FontAwesome name="map-marker" size={14} color={Theme.variants.textMuted} />
                  <Text style={styles.infoText}>
                    {item.latitude.toFixed(3)}, {item.longitude.toFixed(3)}
                  </Text>
                </View>

                {item.severity_level && (
                  <View style={styles.severityContainer}>
                    <View
                      style={[
                        styles.severityDot,
                        { backgroundColor: getSeverityColor(item.severity_level) },
                      ]}
                    />
                    <Text style={styles.infoText}>{item.severity_level}</Text>
                  </View>
                )}
              </View>

              {/* Address */}
              {item.address && (
                <Text style={styles.address} numberOfLines={1}>
                  📍 {item.address}
                </Text>
              )}

              {/* Footer - Date */}
              <Text style={styles.date}>{formatDate(item?.created_at)}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.variants.border,
  },
  headerTitle: {
    fontFamily: Theme.typography.geom,
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.variants.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 13,
    color: Theme.variants.textMuted,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 14,
    color: Theme.variants.text,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: Theme.typography.inter.medium,
    fontSize: 16,
    color: '#F44336',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 18,
    fontWeight: '600',
    color: Theme.variants.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 13,
    color: Theme.variants.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Theme.variants.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.variants.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  typeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportType: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 15,
    fontWeight: '600',
    color: Theme.variants.text,
  },
  reportId: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 11,
    color: Theme.variants.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 13,
    color: Theme.variants.text,
    lineHeight: 18,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 12,
    color: Theme.variants.text,
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  address: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 12,
    color: Theme.variants.textMuted,
    marginBottom: 10,
  },
  date: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 11,
    color: Theme.variants.textMuted,
    textAlign: 'right',
  },
});
