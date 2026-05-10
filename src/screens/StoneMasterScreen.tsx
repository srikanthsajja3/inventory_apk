import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, FlatList, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Search, Plus, Edit2, Trash2, Save, ChevronDown, Diamond, Scale, IndianRupee } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  backBtn: { padding: 8, backgroundColor: Theme.colors.surface, borderRadius: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Theme.colors.text.primary },
  addBtn: { backgroundColor: Theme.colors.primary, width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, margin: 20, paddingHorizontal: 15, borderRadius: 15, borderWidth: 1, borderColor: Theme.colors.border },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 10, color: Theme.colors.text.primary, fontSize: 16 },
  list: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: Theme.colors.surface, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Theme.colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  stoneInfo: { flex: 1 },
  stoneName: { fontSize: 16, fontWeight: '800', color: Theme.colors.text.primary },
  categoryBadge: { backgroundColor: Theme.colors.muted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  categoryText: { fontSize: 10, fontWeight: '700', color: Theme.colors.primary, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 8, backgroundColor: Theme.colors.background, borderRadius: 10, borderWidth: 1, borderColor: Theme.colors.border },
  deleteBtn: { borderColor: Theme.colors.status.error + '40' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Theme.colors.background, padding: 12, borderRadius: 12 },
  spec: { alignItems: 'center' },
  specLabel: { fontSize: 9, color: Theme.colors.text.secondary, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  specValue: { fontSize: 13, fontWeight: '800', color: Theme.colors.text.primary },
  rateValue: { color: Theme.colors.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Theme.colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '90%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Theme.colors.text.primary },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: Theme.colors.text.secondary },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, borderRadius: 16, paddingHorizontal: 15, borderWidth: 1, borderColor: Theme.colors.border },
  input: { flex: 1, paddingVertical: 15, marginLeft: 10, color: Theme.colors.text.primary, fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 15 },
  saveBtn: { backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 18, gap: 10, marginTop: 20, marginBottom: Platform.OS === 'ios' ? 20 : 0 },
  saveBtnText: { color: Theme.colors.text.black, fontSize: 16, fontWeight: '800' },
  empty: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: Theme.colors.text.secondary, marginTop: 10, fontSize: 16, fontWeight: '600' }
});

interface StoneMaster {
  id: string;
  name: string;
  category: string;
  sub_category: string | null;
  min_wt: number | null;
  max_wt: number | null;
  rate: number;
}

export default function StoneMasterScreen({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [stones, setStones] = useState<StoneMaster[]>([]);
  const [search, setSearch] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStone, setEditingStone] = useState<StoneMaster | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    category: 'Diamond',
    sub_category: '',
    min_wt: '0',
    max_wt: '999',
    rate: '0'
  });

  useEffect(() => { fetchStones(); }, []);

  const fetchStones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('stone_master').select('*').order('category', { ascending: true }).order('name', { ascending: true });
      if (error) throw error;
      setStones(data || []);
    } catch (error: any) { Alert.alert('Error', error.message); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.rate) { Alert.alert('Error', 'Please fill all required fields'); return; }
    try {
      setSaving(true);
      const payload = {
        name: form.name.toUpperCase().trim(),
        category: form.category,
        sub_category: form.sub_category?.toUpperCase().trim() || null,
        min_wt: parseFloat(form.min_wt) || 0,
        max_wt: parseFloat(form.max_wt) || 0,
        rate: parseFloat(form.rate) || 0
      };
      const { error } = editingStone 
        ? await supabase.from('stone_master').update(payload).eq('id', editingStone.id)
        : await supabase.from('stone_master').insert([payload]);
      if (error) throw error;
      Alert.alert('Success', `Stone ${editingStone ? 'updated' : 'added'} successfully`);
      setIsModalVisible(false);
      setEditingStone(null);
      setForm({ name: '', category: 'Diamond', sub_category: '', min_wt: '0', max_wt: '999', rate: '0' });
      fetchStones();
    } catch (error: any) { Alert.alert('Error', error.message); } finally { setSaving(false); }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Stone', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const { error } = await supabase.from('stone_master').delete().eq('id', id);
            if (error) throw error;
            fetchStones();
          } catch (error: any) { Alert.alert('Error', error.message); }
      }}
    ]);
  };

  const filteredStones = stones.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={Theme.colors.text.primary} /></TouchableOpacity>
          <Text style={styles.title}>Stone Master</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingStone(null); setForm({ name: '', category: 'Diamond', sub_category: '', min_wt: '0', max_wt: '999', rate: '0' }); setIsModalVisible(true); }}>
          <Plus size={24} color={Theme.colors.text.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={20} color={Theme.colors.text.secondary} />
        <TextInput style={styles.searchInput} placeholder="Search stones or categories..." value={search} onChangeText={setSearch} placeholderTextColor={Theme.colors.text.muted} />
      </View>

      <FlatList
        data={filteredStones}
        contentContainerStyle={styles.list}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.stoneInfo}>
                <Text style={styles.stoneName}>{item.name}</Text>
                <View style={styles.categoryBadge}><Text style={styles.categoryText}>{item.category} {item.sub_category ? `(${item.sub_category})` : ''}</Text></View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => {
                  setEditingStone(item);
                  setForm({
                    name: item.name,
                    category: item.category,
                    sub_category: item.sub_category || '',
                    min_wt: String(item.min_wt || 0),
                    max_wt: String(item.max_wt || 0),
                    rate: String(item.rate || 0)
                  });
                  setIsModalVisible(true);
                }}><Edit2 size={18} color={Theme.colors.primary} /></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id, item.name)}><Trash2 size={18} color={Theme.colors.status.error} /></TouchableOpacity>
              </View>
            </View>
            <View style={styles.cardBottom}>
              <View style={styles.spec}><Text style={styles.specLabel}>Min Wt</Text><Text style={styles.specValue}>{item.min_wt}</Text></View>
              <View style={styles.spec}><Text style={styles.specLabel}>Max Wt</Text><Text style={styles.specValue}>{item.max_wt}</Text></View>
              <View style={styles.spec}><Text style={styles.specLabel}>Rate (₹)</Text><Text style={[styles.specValue, styles.rateValue]}>{item.rate.toLocaleString('en-IN')}</Text></View>
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={styles.empty}><Diamond size={48} color={Theme.colors.border} /><Text style={styles.emptyText}>No stones found</Text></View>}
      />

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>{editingStone ? 'Edit Stone' : 'Add Stone'}</Text><TouchableOpacity onPress={() => setIsModalVisible(false)}><X size={24} color={Theme.colors.text.secondary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
              <View style={styles.inputGroup}><Text style={styles.label}>Stone Name</Text><View style={styles.inputWrapper}><Diamond size={20} color={Theme.colors.text.secondary} /><TextInput style={styles.input} value={form.name} onChangeText={v => setForm({...form, name: v})} placeholder="e.g. VVS-EF ROUND" placeholderTextColor={Theme.colors.text.muted} autoCapitalize="characters" /></View></View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>Category</Text><View style={styles.inputWrapper}><TextInput style={styles.input} value={form.category} onChangeText={v => setForm({...form, category: v})} placeholder="Diamond/Stone" placeholderTextColor={Theme.colors.text.muted} /></View></View>
                <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>Sub-Cat</Text><View style={styles.inputWrapper}><TextInput style={styles.input} value={form.sub_category} onChangeText={v => setForm({...form, sub_category: v})} placeholder="RD/SHAPE" placeholderTextColor={Theme.colors.text.muted} autoCapitalize="characters" /></View></View>
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>Min Wt</Text><View style={styles.inputWrapper}><Scale size={20} color={Theme.colors.text.secondary} /><TextInput style={styles.input} value={form.min_wt} onChangeText={v => setForm({...form, min_wt: v})} keyboardType="numeric" /></View></View>
                <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>Max Wt</Text><View style={styles.inputWrapper}><Scale size={20} color={Theme.colors.text.secondary} /><TextInput style={styles.input} value={form.max_wt} onChangeText={v => setForm({...form, max_wt: v})} keyboardType="numeric" /></View></View>
              </View>
              <View style={styles.inputGroup}><Text style={styles.label}>Rate per Carat/Piece (₹)</Text><View style={styles.inputWrapper}><IndianRupee size={20} color={Theme.colors.primary} /><TextInput style={styles.input} value={form.rate} onChangeText={v => setForm({...form, rate: v})} keyboardType="numeric" /></View></View>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>{saving ? <ActivityIndicator color={Theme.colors.text.black} /> : <><Save size={20} color={Theme.colors.text.black} /><Text style={styles.saveBtnText}>Save Stone Master</Text></>}</TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
