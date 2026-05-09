import { DisasterReportDocument } from '@/config/dbutils'
import Theme from '@/config/theme';
import { formatDate, getDisasterIcon, getDisasterMarkerColor, getSeverityColor, getStatusColor } from '@/constants/utils';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react'
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    Image,
} from 'react-native';

const ReportCard = ({ item }: { item: DisasterReportDocument }) => {
    const router = useRouter();
    return (
        <TouchableOpacity
            style={[styles.reportCard, { borderLeftColor: getDisasterMarkerColor(item.type) + "70", shadowColor: getDisasterMarkerColor(item?.type) }]}
            activeOpacity={0.8}
            onPress={() => router.push(`/report/${item.id}` as any)}
        >
            {/* Top Section - Type and Status */}
            <View style={styles.reportHeader}>
                <View style={styles.typeContainer}>
                    <View
                        style={[
                            styles.typeIconContainer,
                            { backgroundColor: getDisasterMarkerColor(item.type) + "20" },
                        ]}
                    >
                        <FontAwesome
                            name={getDisasterIcon(item.type)}
                            size={24}
                            color={getDisasterMarkerColor(item.type)}
                        />
                    </View>
                    <View>
                        <Text style={styles.reportType}>{item.type}</Text>
                    </View>
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

            {/* Description */}
            <Text style={styles.description} numberOfLines={2}>
                {item.description}
            </Text>

            {/* Location and Severity Row */}
            <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                    <FontAwesome name="map-marker" size={14} color={Theme.variants.textMuted} />
                    <Text style={styles.infoText}>
                        {item.address}
                    </Text>
                </View>


            </View>

            {/* Media Thumbnails */}
            {item.media && item.media.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardMediaScroll}>
                    {item.media.map((mediaItem, idx) => (
                        <View key={idx} style={styles.cardMediaItemWrapper}>
                            <Image source={{ uri: mediaItem.url }} style={styles.cardMediaImage} />
                            {mediaItem.type === 'video' && (
                                <View style={styles.cardVideoOverlay}>
                                    <FontAwesome name="play" size={16} color="#fff" />
                                </View>
                            )}
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Footer - Votes & Date */}
            <View style={styles.cardFooter}>
                <View style={styles.voteCounts}>
                    <View style={styles.voteBadge}>
                        <FontAwesome name="thumbs-up" size={12} color="#4CAF50" />
                        <Text style={styles.voteText}>{item.confirm_count || 0}</Text>
                    </View>
                    <View style={styles.voteBadge}>
                        <FontAwesome name="thumbs-down" size={12} color="#F44336" />
                        <Text style={styles.voteText}>{item.dismiss_count || 0}</Text>
                    </View>
                </View>
                <Text style={styles.date}>{formatDate(item?.created_at)}</Text>
            </View>
        </TouchableOpacity>
    )
}


const styles = StyleSheet.create({
    reportCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Theme.variants.border,
        borderLeftWidth: 6,
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
    cardMediaScroll: {
        flexGrow: 0,
        marginBottom: 12,
    },
    cardMediaItemWrapper: {
        marginRight: 8,
        position: 'relative',
    },
    cardMediaImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: Theme.variants.border,
    },
    cardVideoOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
    },
    address: {
        fontFamily: Theme.typography.inter.regular,
        fontSize: 12,
        color: Theme.variants.textMuted,
        marginBottom: 12,
        lineHeight: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    voteCounts: {
        flexDirection: 'row',
        gap: 8,
    },
    voteBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    voteText: {
        fontFamily: Theme.typography.inter.bold,
        fontSize: 11,
        color: Theme.variants.text,
    },
    date: {
        fontFamily: Theme.typography.inter.regular,
        fontSize: 11,
        color: Theme.variants.textMuted,
    },
});

export default ReportCard