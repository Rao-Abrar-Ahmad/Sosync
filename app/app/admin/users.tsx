import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Theme from '@/config/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { adminGetAllUsers, adminUpdateUserRole, adminUpdateUserDetails, adminUpdateUserStatus, UserDocument } from '@/config/dbutils';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminUserManagement() {
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserDocument[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDocument | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [updating, setUpdating] = useState(false);

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

  const toggleUserStatus = (user: UserDocument) => {
    const newStatus = user.is_active === false;
    Alert.alert(
      newStatus ? 'Activate Account' : 'Suspend Account',
      `Are you sure you want to ${newStatus ? 'activate' : 'suspend'} ${user.first_name}'s account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: newStatus ? 'Activate' : 'Suspend', 
          style: newStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await adminUpdateUserStatus(user.id, newStatus);
              fetchUsers();
            } catch (err) {
              Alert.alert('Error', 'Failed to update account status.');
            }
          }
        }
      ]
    );
  };

  const handleEditPress = (user: UserDocument) => {
    setEditingUser(user);
    setEditFirstName(user.first_name);
    setEditLastName(user.last_name);
    setEditPhone(user.phone_number || '');
    setEditModalVisible(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!editFirstName.trim() || !editLastName.trim()) {
      Alert.alert('Error', 'First and last name are required.');
      return;
    }

    setUpdating(true);
    try {
      await adminUpdateUserDetails(editingUser.id, {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        phone_number: editPhone.trim(),
      });
      setEditModalVisible(false);
      fetchUsers();
      Alert.alert('Success', 'User information updated successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to update user information.');
    } finally {
      setUpdating(false);
    }
  };

  const renderUserItem = ({ item }: { item: UserDocument }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{item.first_name?.[0]}{item.last_name?.[0]}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.userName}>{item.first_name} {item.last_name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.userMeta}>
            <Text style={styles.userPhone}>{item.phone_number || 'No phone'}</Text>
            <View style={[styles.roleBadge, { backgroundColor: item.role === 'ADMIN' ? '#4A90E2' : '#eee' }]}>
              <Text style={[styles.roleText, { color: item.role === 'ADMIN' ? '#fff' : '#666' }]}>{item.role}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.actionGroup}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditPress(item)}>
          <FontAwesome name="edit" size={16} color={Theme.variants.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { marginLeft: 10 }]} onPress={() => toggleRole(item)}>
          <FontAwesome name="exchange" size={16} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, { marginLeft: 10, backgroundColor: item.is_active === false ? '#4caf5015' : '#f4433615' }]} 
          onPress={() => toggleUserStatus(item)}
        >
          <FontAwesome 
            name={item.is_active === false ? "unlock" : "lock"} 
            size={16} 
            color={item.is_active === false ? "#4caf50" : "#f44336"} 
          />
        </TouchableOpacity>
      </View>
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

      {/* Edit User Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User Info</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <FontAwesome name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="First Name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Last Name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity 
                style={[styles.updateBtn, updating && { opacity: 0.7 }]} 
                onPress={handleUpdateUser}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.updateBtnTxt}>Update User</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  userPhone: {
    fontFamily: Theme.typography.inter.medium,
    fontSize: 12,
    color: Theme.variants.text,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Theme.typography.inter.bold,
    color: Theme.variants.text,
  },
  modalForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: Theme.typography.inter.semibold,
    color: Theme.variants.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: Theme.typography.inter.regular,
    borderWidth: 1,
    borderColor: '#eee',
  },
  updateBtn: {
    backgroundColor: Theme.variants.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  updateBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Theme.typography.inter.bold,
  },
});
