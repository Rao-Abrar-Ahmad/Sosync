import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@/context/UserContext';
import Theme from '@/config/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading } = useUser();

  return (
    <LinearGradient
      colors={Theme.backgrounds.white as any}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!loading}
      >
        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Theme.variants.primary} />
            <Text style={styles.loadingText}>Loading your profile...</Text>
          </View>
        )}

        {/* Header Greeting */}
        <View style={[styles.header, loading && styles.opacityReduced]}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.first_name || 'User'}! 👋</Text>
            <Text style={styles.subheading}>Report disasters and save lives</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, loading && styles.opacityReduced]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          {/* Create Report Card */}
          <TouchableOpacity
            style={[styles.actionCard, loading && styles.buttonDisabled]}
            onPress={() => router.push('/create-report')}
            activeOpacity={0.8}
            disabled={loading}
          >
            <LinearGradient
              colors={[Theme.variants.primary, '#1976d2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionCardGradient}
            >
              <View style={styles.actionCardContent}>
                <View style={styles.iconContainer}>
                  <FontAwesome name="plus-circle" size={24} color="#fff" />
                </View>
                <View style={styles.actionCardText}>
                  <Text style={[styles.actionCardTitle, { color: '#fff' }]}>Create Report</Text>
                  <Text style={[styles.actionCardDescription, { color: '#fff' }]}>
                    Report a disaster in your area
                  </Text>
                </View>
                <FontAwesome name="arrow-right" size={18} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* View Reports Card */}
          <TouchableOpacity
            style={[styles.actionCard, loading && styles.buttonDisabled]}
            onPress={() => router.push('/(tabs)/reports')}
            activeOpacity={0.8}
            disabled={loading}
          >
            <View style={styles.actionCardBorder}>
              <View style={styles.actionCardContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: '#f0f7ff' },
                  ]}
                >
                  <FontAwesome
                    name="list"
                    size={24}
                    color={Theme.variants.primary}
                  />
                </View>
                <View style={styles.actionCardText}>
                  <Text style={styles.actionCardTitle}>View Reports</Text>
                  <Text style={styles.actionCardDescription}>
                    See all disaster reports
                  </Text>
                </View>
                <FontAwesome name="arrow-right" size={20} color={Theme.variants.primary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={[styles.section, loading && styles.opacityReduced]}>
          <Text style={styles.sectionTitle}>Features</Text>

          <View style={styles.featureGrid}>
            {/* Real-time Alerts */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <FontAwesome name="bell" size={16} color={Theme.variants.primary} />
              </View>
              <Text style={styles.featureTitle}>Real-time Alerts</Text>
              <Text style={styles.featureDescription}>
                Get instant disaster alerts
              </Text>
            </View>

            {/* Location Tracking */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <FontAwesome name="map-marker" size={16} color={Theme.variants.primary} />
              </View>
              <Text style={styles.featureTitle}>Location Tracking</Text>
              <Text style={styles.featureDescription}>
                Find disasters near you
              </Text>
            </View>

            {/* Community Reports */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <FontAwesome name="users" size={16} color={Theme.variants.primary} />
              </View>
              <Text style={styles.featureTitle}>Community Reports</Text>
              <Text style={styles.featureDescription}>
                Verify reports together
              </Text>
            </View>

            {/* Emergency SOS */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <FontAwesome name="phone" size={16} color={Theme.variants.primary} />
              </View>
              <Text style={styles.featureTitle}>Emergency SOS</Text>
              <Text style={styles.featureDescription}>
                Call for help quickly
              </Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, loading && styles.opacityReduced]}>
          <FontAwesome name="info-circle" size={20} color={Theme.variants.primary} />
          <Text style={styles.infoText}>
            Help your community by reporting disasters. Every report makes a difference.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 32,
  },
  greeting: {
    fontFamily: Theme.typography.geom,
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.variants.text,
    marginBottom: 4,
  },
  subheading: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 14,
    color: Theme.variants.textMuted,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.variants.text,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionCardGradient: {
    borderRadius: 12,
  },
  actionCardBorder: {
    borderWidth: 1.5,
    borderColor: Theme.variants.border,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 16,
    fontWeight: '600',
    color: Theme.variants.text,
    marginBottom: 2,
  },
  actionCardDescription: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 13,
    color: Theme.variants.textMuted,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48.5%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.variants.border,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 24,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 13,
    fontWeight: '600',
    color: Theme.variants.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  featureDescription: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 11,
    color: Theme.variants.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: Theme.variants.primary,
    marginTop: 20,
  },
  infoText: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 13,
    color: Theme.variants.text,
    flex: 1,
    lineHeight: 18,
  },
  // Loading States
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 14,
    color: Theme.variants.text,
    marginTop: 16,
    textAlign: 'center',
  },
  opacityReduced: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
  buttonDisabled: {
    opacity: 0.6,
    pointerEvents: 'none',
  },
});
