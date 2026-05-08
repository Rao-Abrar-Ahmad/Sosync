import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, ScrollView, Alert, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Theme from '@/config/theme';
import { useUser } from '@/context/UserContext';
import {
  addEmergencyContact, getEmergencyContacts, updateEmergencyContact,
  deleteEmergencyContact, isValidPhoneNumber,
  EmergencyContactDocument, EmergencyContactInput,
} from '@/config/dbutils';

type FormData = { name: string; phone: string; email: string };
const emptyForm: FormData = { name: '', phone: '', email: '' };

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [contacts, setContacts] = useState<EmergencyContactDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContactDocument | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadContacts = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const data = await getEmergencyContacts(user.uid);
      setContacts(data);
    } catch { Alert.alert('Error', 'Failed to load contacts.'); }
    finally { setLoading(false); }
  }, [user?.uid]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const validateForm = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    else if (!isValidPhoneNumber(form.phone)) e.phone = 'Invalid phone (min 10 digits)';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Invalid email format';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAdd = () => { setEditingContact(null); setForm(emptyForm); setFormErrors({}); setModalVisible(true); };
  const openEdit = (c: EmergencyContactDocument) => {
    setEditingContact(c);
    setForm({ name: c.name, phone: c.phone_number, email: c.email || '' });
    setFormErrors({}); setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user?.uid) return;
    setSubmitting(true);
    try {
      if (editingContact) {
        await updateEmergencyContact(editingContact.id, {
          name: form.name.trim(), phone_number: form.phone.trim(),
          email: form.email.trim() || undefined,
        });
      } else {
        const input: EmergencyContactInput = {
          user_id: user.uid, name: form.name.trim(),
          phone_number: form.phone.trim(), email: form.email.trim() || undefined,
          is_active: true,
        };
        await addEmergencyContact(input);
      }
      setModalVisible(false);
      await loadContacts();
    } catch { Alert.alert('Error', 'Failed to save contact.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = (c: EmergencyContactDocument) => {
    Alert.alert('Delete Contact', `Remove ${c.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteEmergencyContact(c.id); await loadContacts(); }
          catch { Alert.alert('Error', 'Failed to delete.'); }
        }
      },
    ]);
  };

  const renderFormField = (label: string, key: keyof FormData, icon: string, placeholder: string, keyboard?: any) => (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={[styles.formInput, formErrors[key] && styles.formInputErr]}>
        <FontAwesome name={icon as any} size={15} color={Theme.variants.textMuted} style={styles.formIcon} />
        <TextInput
          style={styles.formTextInput}
          value={form[key]}
          onChangeText={(t) => { setForm(p => ({ ...p, [key]: t })); setFormErrors(p => ({ ...p, [key]: undefined })); }}
          placeholder={placeholder}
          placeholderTextColor={Theme.variants.textMuted}
          keyboardType={keyboard}
          autoCapitalize={key === 'email' ? 'none' : 'words'}
        />
      </View>
      {formErrors[key] && <Text style={styles.formErr}>{formErrors[key]}</Text>}
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome name="arrow-left" size={20} color={Theme.variants.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
            <FontAwesome name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Theme.variants.primary} />
          </View>
        ) : contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <FontAwesome name="users" size={48} color={Theme.variants.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Emergency Contacts</Text>
            <Text style={styles.emptyDesc}>Add people you trust who will be notified during SOS alerts.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openAdd} activeOpacity={0.8}>
              <FontAwesome name="plus" size={14} color="#fff" />
              <Text style={styles.emptyBtnTxt}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.listCount}>{contacts.length} contact{contacts.length > 1 ? 's' : ''}</Text>
            {contacts.map((c) => (
              <View key={c.id} style={styles.card}>
                <View style={styles.cardAvatar}>
                  <Text style={styles.cardInitial}>{c.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{c.name}</Text>
                  <View style={styles.cardDetail}>
                    <FontAwesome name="phone" size={12} color={Theme.variants.textMuted} />
                    <Text style={styles.cardDetailTxt}>{c.phone_number}</Text>
                  </View>
                  {c.email && (
                    <View style={styles.cardDetail}>
                      <FontAwesome name="envelope" size={11} color={Theme.variants.textMuted} />
                      <Text style={styles.cardDetailTxt}>{c.email}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => openEdit(c)} style={styles.cardActionBtn}>
                    <FontAwesome name="pencil" size={16} color={Theme.variants.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(c)} style={styles.cardActionBtn}>
                    <FontAwesome name="trash" size={16} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <View style={{ height: 100, backgroundColor: '#fff' }} />
          </ScrollView>
        )}


      </View>
      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingContact ? 'Edit Contact' : 'Add Contact'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={22} color={Theme.variants.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderFormField('Name *', 'name', 'user', 'Full name')}
              {renderFormField('Phone Number *', 'phone', 'phone', '+92 300 1234567', 'phone-pad')}
              {renderFormField('Email', 'email', 'envelope', 'email@example.com', 'email-address')}
            </ScrollView>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalSaveBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit} disabled={submitting} activeOpacity={0.8}>
                {submitting ? <ActivityIndicator size="small" color="#fff" /> :
                  <Text style={styles.modalSaveTxt}>{editingContact ? 'Update' : 'Add Contact'}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)} disabled={submitting}>
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Theme.variants.border, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Theme.variants.text, fontFamily: Theme.typography.inter.bold, backgroundColor: '#fff' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.variants.primary, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  // Empty State
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, backgroundColor: '#fff' },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Theme.variants.text, fontFamily: Theme.typography.inter.bold, marginBottom: 8, backgroundColor: '#fff' },
  emptyDesc: { fontSize: 14, color: Theme.variants.textMuted, textAlign: 'center', fontFamily: Theme.typography.inter.regular, marginBottom: 24, lineHeight: 20, backgroundColor: '#fff' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.variants.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, gap: 8 },
  emptyBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '600', fontFamily: Theme.typography.inter.semibold },
  // List
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff' },
  listContent: { flexGrow: 1, paddingBottom: 40, backgroundColor: '#fff' },
  listCount: { fontSize: 13, color: Theme.variants.textMuted, fontFamily: Theme.typography.inter.medium, marginBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Theme.variants.border, gap: 12 },
  cardAvatar: { width: 36, height: 36, borderRadius: 23, backgroundColor: Theme.variants.primary, justifyContent: 'center', alignItems: 'center' },
  cardInitial: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: Theme.typography.inter.bold },
  cardInfo: { flex: 1, backgroundColor: 'transparent' },
  cardName: { fontSize: 16, fontWeight: '600', color: Theme.variants.text, fontFamily: Theme.typography.inter.semibold, marginBottom: 4, backgroundColor: 'transparent' },
  cardDetail: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, backgroundColor: 'transparent' },
  cardDetailTxt: { fontSize: 13, color: Theme.variants.textMuted, fontFamily: Theme.typography.inter.regular },
  cardActions: { flexDirection: 'row', gap: 8, backgroundColor: 'transparent' },
  cardActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.variants.border },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: '#fff' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Theme.variants.text, fontFamily: Theme.typography.inter.bold, backgroundColor: '#fff' },
  formField: { marginBottom: 16, backgroundColor: '#fff' },
  formLabel: { fontSize: 14, fontWeight: '600', color: Theme.variants.text, marginBottom: 6, fontFamily: Theme.typography.inter.semibold, backgroundColor: '#fff' },
  formInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, borderWidth: 1.5, borderColor: Theme.variants.border, paddingHorizontal: 14, height: 50 },
  formInputErr: { borderColor: '#ff4444', backgroundColor: '#fff5f5' },
  formIcon: { marginRight: 10, width: 20, textAlign: 'center' },
  formTextInput: { flex: 1, fontSize: 15, color: Theme.variants.text, fontFamily: Theme.typography.inter.regular },
  formErr: { fontSize: 12, color: '#ff4444', marginTop: 4, fontFamily: Theme.typography.inter.regular, backgroundColor: '#fff' },
  modalBtns: { gap: 10, paddingTop: 10, backgroundColor: '#fff' },
  modalSaveBtn: { alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.variants.primary, paddingVertical: 15, borderRadius: 12 },
  modalSaveTxt: { color: '#fff', fontSize: 16, fontWeight: '600', fontFamily: Theme.typography.inter.semibold },
  modalCancelBtn: { alignItems: 'center', paddingVertical: 10 },
  modalCancelTxt: { color: Theme.variants.textMuted, fontSize: 14, fontFamily: Theme.typography.inter.medium },
});
