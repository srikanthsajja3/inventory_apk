import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, FlatList, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Search, Plus, Edit2, Trash2, Save, ChevronDown, Diamond, Scale, IndianRupee } from 'lucide-react-native';
import { supabase } from '../../supabase';

import { Theme } from '../theme';

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

  useEffect(() => {
    fetchStones();
  }, []);

  const fetchStones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stone_master')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      setStones(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingStone(null);
    setForm({
      name: '',
      category: 'Diamond',
      sub_category: '',
      min_wt: '0',
      max_wt: '999',
      rate: '0'
    });
    setIsModalVisible(true);
  };

  const handleEdit = (stone: StoneMaster) => {
    setEditingStone(stone);
    setForm({
      name: stone.name,
      category: stone.category,
      sub_category: stone.sub_category || '',
      min_wt: String(stone.min_wt),
      max_wt: String(stone.max_wt),
      rate: String(stone.rate)
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Stone',
      'Are you sure you want to remove this stone from the master list?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('stone_master').delete().eq('id', id);
              if (error) throw error;
              fetchStones();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.rate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name,
        category: form.category,
        sub_category: form.sub_category || null,
        min_wt: parseFloat(form.min_wt) || 0,
        max_wt: parseFloat(form.max_wt) || 0,
        rate: parseFloat(form.rate) || 0
      };

      if (editingStone) {
        const { error } = await supabase
          .from('stone_master')
          .update(payload)
          .eq('id', editingStone.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('stone_master')
          .insert([payload]);
        if (error) throw error;
      }

      setIsModalVisible(false);
      fetchStones();
      Alert.alert('Success', `Stone ${editingStone ? 'updated' : 'added'} successfully`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredStones = stones.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase()) ||
    (s.sub_category && s.sub_category.toLowerCase().includes(search.toLowerCase()))
  );

  const renderStoneItem = ({ item }: { item: StoneMaster }) => (
    <View style={styles.stoneCard}>
      <View style={styles.stoneInfo}>
        <View style={styles.stoneHeader}>
          <Text style={styles.stoneName}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: `${Theme.colors.primary}22` }]}>
            <Text style={[styles.badgeText, { color: Theme.colors.primary }]}>
              {item.category}
            </Text>
          </View>
        </View>
        
        <View style={styles.stoneDetails}>
          <View style={styles.detailItem}>
            <Scale size={14} color={Theme.colors.text.secondary} />
            <Text style={styles.detailText}>{item.min_wt} - {item.max_wt} ct</Text>
          </View>
          <View style={styles.detailItem}>
            <IndianRupee size={14} color={Theme.colors.primary} />
            <Text style={styles.rateText}>{item.rate.toLocaleString('en-IN')}</Text>
          </View>
          {item.sub_category && (
            <View style={styles.detailItem}>
              <Text style={styles.subCatText}>Sub: {item.sub_category}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
          <Edit2 size={18} color={Theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, { marginLeft: 10 }]}>
          <Trash2 size={18} color={Theme.colors.status.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <X size={24} color={Theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Stone Master Management</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
          <Plus size={24} color={Theme.colors.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color={Theme.colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, category..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={Theme.colors.text.muted}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={18} color={Theme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredStones}
          renderItem={renderStoneItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Diamond size={48} color={Theme.colors.border} />
              <Text style={styles.emptyText}>No stones found</Text>
            </View>
          }
        />
      )}

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingStone ? 'Edit Stone' : 'Add New Stone'}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><X size={24} color={Theme.colors.text.secondary} /></TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Stone Name *</Text>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={v => setForm({ ...form, name: v })}
                  placeholder="e.g. VVS-EF-RD (0.01-0.05)"
                  placeholderTextColor={Theme.colors.text.muted}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Category *</Text>
                  <View style={styles.pickerWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {['Diamond', 'Stone', 'Beads'].map(cat => (
                        <TouchableOpacity 
                          key={cat}
                          style={[styles.catOption, form.category === cat && styles.catOptionActive]}
                          onPress={() => setForm({ ...form, category: cat })}
                        >
                          <Text style={[styles.catOptionText, form.category === cat && styles.catOptionTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 15 }]}>
                  <Text style={styles.label}>Sub Category (e.g. RD, SHAPE)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.sub_category}
                    onChangeText={v => setForm({ ...form, sub_category: v })}
                    placeholder="RD / SHAPE / etc"
                    autoCapitalize="characters"
                    placeholderTextColor={Theme.colors.text.muted}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Min Weight (ct)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.min_wt}
                    onChangeText={v => setForm({ ...form, min_wt: v })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 15 }]}>
                  <Text style={styles.label}>Max Weight (ct)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.max_wt}
                    onChangeText={v => setForm({ ...form, max_wt: v })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Rate (₹ per ct/pcs) *</Text>
                <TextInput
                  style={styles.input}
                  value={form.rate}
                  onChangeText={v => setForm({ ...form, rate: v })}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={Theme.colors.text.muted}
                />
              </View>
              
              <View style={{ height: 20 }} />
            </ScrollView>

            <TouchableOpacity 
              style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color={Theme.colors.background} /> : <Save size={20} color={Theme.colors.background} />}
              <Text style={styles.saveBtnText}>{editingStone ? 'Update Stone' : 'Add Stone'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  addBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
  },
  searchSection: {
    padding: 20,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    fontSize: 15,
    color: Theme.colors.text.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  stoneCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Platform.select({
      web: { boxShadow: '0 4px 10px rgba(0,0,0,0.2)' },
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      }
    }),
  },
  stoneInfo: {
    flex: 1,
  },
  stoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  stoneName: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stoneDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
  },
  rateText: {
    fontSize: 14,
    color: Theme.colors.primary,
    fontWeight: '800',
  },
  subCatText: {
    fontSize: 12,
    color: Theme.colors.text.muted,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    backgroundColor: Theme.colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: '85%',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  modalBody: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.colors.text.primary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  pickerWrapper: {
    flexDirection: 'row',
  },
  catOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Theme.colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  catOptionActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  catOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
  },
  catOptionTextActive: {
    color: Theme.colors.background,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    gap: 12,
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  saveBtnText: {
    color: Theme.colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
});
