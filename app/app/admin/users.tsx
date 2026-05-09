import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import Theme from '@/config/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { adminGetAllUsers, adminUpdateUserRole, UserDocument } from '@/config/dbutils';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminUserManagement() {
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserDocument[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const data = await adminGetAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(u => 
      (u.first_name + ' ' + u.last_name).toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  const toggleRole = (user: UserDocument) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    Alert.alert(
      'Change Role',
      `Are you sure you want to change ${user.first_name}'s role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: async () => {
            try {
              await adminUpdateUserRole(user.id as any, newRole);
              fetchUsers();
            } catch (err) {
              Alert.alert('Error', 'Failed to update role.');
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: UserDocument }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{item.first_name[0]}{item.last_name[0]}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.userName}>{item.first_name} {item.last_name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: item.role === 'ADMIN' ? '#4A90E2' : '#eee' }]}>
            <Text style={[styles.roleText, { color: item.role === 'ADMIN' ? '#fff' : '#666' }]}>{item.role}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.actionBtn} onPress={() => toggleRole(item)}>
        <FontAwesome name="exchange" size={16} color={Theme.variants.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchBar}>
        <FontAwesome name="search" size={16} color="#aaa" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search name or email..."
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <FontAwesome name="times-circle" size={16} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Theme.variants.primary} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id as string}
          renderItem={renderUserItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyTxt}>No users found matching "{search}"</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: Theme.typography.inter.regular,
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarTxt: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  details: {
    flex: 1,
  },
  userName: {
    fontFamily: Theme.typography.inter.semibold,
    fontSize: 15,
    color: Theme.variants.text,
  },
  userEmail: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 13,
    color: Theme.variants.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  actionBtn: {
    padding: 10,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
  },
  emptyTxt: {
    textAlign: 'center',
    marginTop: 40,
    color: Theme.variants.textMuted,
    fontFamily: Theme.typography.inter.regular,
  },
});
