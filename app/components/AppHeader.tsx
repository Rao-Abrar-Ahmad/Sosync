import React from "react";
import { Text, View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Theme from "@/config/theme";
import { useUser } from "@/context/UserContext";

const AppHeader = () => {
  const router = useRouter();
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  // Get user's first name or email
  const displayName = user?.displayName
    ? user.displayName : user?.email?.split("@")[0] || "User";

  // Format greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };
  //console.log(user)
  return (
    <View style={[styles.container, { paddingTop: (insets.top + 6) }]}>
      <View style={styles.leftSection}>
        {/* User Avatar & Info */}
        <TouchableOpacity
          style={styles.userInfoContainer}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome name="user" size={16} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.userTextContainer}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Right Section - Action Buttons */}
      <View style={styles.rightSection}>
        {/* Notification Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/(tabs)/notification")}
          activeOpacity={0.7}
        >
          <View style={styles.notificationWrapper}>
            <FontAwesome
              name="bell"
              size={20}
              color={Theme.variants.steelBlue}
            />
            {/* Optional: Notification Badge */}
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Profile Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.7}
        >
          <FontAwesome
            name="cog"
            size={20}
            color={Theme.variants.steelBlue}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: Theme.variants.border,
  },

  leftSection: {
    flex: 1,
  },

  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  avatarContainer: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Theme.variants.alabaster,
  },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: 22,
  },

  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 22,
    backgroundColor: Theme.variants.steelBlue,
    justifyContent: "center",
    alignItems: "center",
  },

  userTextContainer: {
    justifyContent: "center",
    flex: 1,
  },

  greeting: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 12,
    letterSpacing: 0.3,
    color: Theme.variants.textMuted,
    textTransform: "uppercase",
    marginBottom: 0,
  },

  userName: {
    fontFamily: Theme.typography.inter.semibold,
    fontSize: 14,
    color: Theme.variants.text,
  },

  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    minWidth: 36,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },

  notificationWrapper: {
    position: "relative",
  },

  notificationBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: Theme.variants.warning,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  badgeText: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
  },
});

export default AppHeader;
