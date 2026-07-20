import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { X, Save, Plus, Trash2, Scale, Tag, Hash, Package, Gem, Calculator, Info, IndianRupee, Search, ChevronDown, ChevronRight } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

interface StoneEntryModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  initialSku?: string;
  initialData?: any;
}

export default function StoneEntryModal({ isVisible, onClose, onSave, initialSku, initialData }: StoneEntryModalProps) {
  const [loading, setLoading] = useState(false);
  const [stones, setStones] = useState<any[]>([]);
  const [itemName, setItemName] = useState('');
  const [masterStones, setMasterStones] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState<string | null>(null); // ID of stone row opening picker
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMasterStones();
  }, []);

  const fetchMasterStones = async () => {
    try {
      const { data, error } = await supabase
        .from('stone_master')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setMasterStones(data || []);
    } catch (e) {
      console.error('Error fetching master stones:', e);
    }
  };

  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        setItemName(initialData.name || '');
        try {
          if (initialData.stones_in_detail) {
            const parsed = JSON.parse(initialData.stones_in_detail);
            setStones(Array.isArray(parsed) ? parsed : []);
          } else {
            setStones([]);
          }
        } catch (e) {
          setStones([]);
        }
      } else {
        setItemName('');
        setStones([]);
      }
    }
  }, [isVisible, initialData]);

  const addStoneRow = () => {
    setStones([...stones, { id: Math.random().toString(36).substr(2, 9), name: '', category: 'Diamond', weight: '', pcs: '', rate: '' }]);
  };

  const updateStone = (id: string, field: string, value: string) => {
    setStones(stones.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStone = (id: string) => {
    setStones(stones.filter(s => s.id !== id));
  };

  const selectStoneFromMaster = (rowId: string, masterStone: any) => {
    setStones(stones.map(s => s.id === rowId ? { 
      ...s, 
      name: masterStone.name, 
      category: masterStone.category,
      rate: String(masterStone.rate || '')
    } : s));
    setShowPicker(null);
    setSearchQuery('');
  };

  const filteredMasterStones = masterStones.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    if (!initialData?.id) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('items')
        .update({ 
          stones_in_detail: JSON.stringify(stones)
        })
        .eq('id', initialData.id);

      if (error) throw error;

      Alert.alert('Success', 'Stone details updated');
      onSave();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Stone Details</Text>
              <Text style={styles.subtitle}>{itemName || 'Product Detail'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={Theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {stones.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Gem size={48} color={Theme.colors.border} />
                <Text style={styles.emptyText}>No stones added yet.</Text>
                <TouchableOpacity style={styles.addBtnInline} onPress={addStoneRow}>
                  <Plus size={20} color={Theme.colors.text.black} />
                  <Text style={styles.addBtnTextInline}>ADD FIRST STONE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              stones.map((stone, index) => (
                <View key={stone.id} style={styles.stoneCard}>
                  <View style={styles.stoneHeader}>
                    <Text style={styles.stoneNumber}>Stone #{index + 1}</Text>
                    <TouchableOpacity onPress={() => removeStone(stone.id)}>
                      <Trash2 size={18} color={Theme.colors.status.error} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Stone Name</Text>
                    <TouchableOpacity 
                      style={styles.inputWrapper}
                      onPress={() => {
                        setShowPicker(stone.id);
                        setSearchQuery(stone.name || '');
                      }}
                    >
                      <Gem size={16} color={Theme.colors.primary} />
                      <Text style={[styles.input, !stone.name && { color: Theme.colors.text.muted }]}>
                        {stone.name || 'SELECT STONE...'}
                      </Text>
                      <ChevronDown size={16} color={Theme.colors.text.muted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>Category</Text>
                      <View style={styles.inputWrapper}>
                        <Tag size={16} color={Theme.colors.text.muted} />
                        <TextInput
                          style={styles.input}
                          value={stone.category}
                          onChangeText={(v) => updateStone(stone.id, 'category', v)}
                          placeholder="Diamond/Stone"
                          placeholderTextColor={Theme.colors.text.muted}
                        />
                      </View>
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>Weight (ct/g)</Text>
                      <View style={styles.inputWrapper}>
                        <Scale size={16} color={Theme.colors.text.muted} />
                        <TextInput
                          style={styles.input}
                          value={stone.weight}
                          onChangeText={(v) => updateStone(stone.id, 'weight', v)}
                          keyboardType="numeric"
                          placeholder="0.00"
                          placeholderTextColor={Theme.colors.text.muted}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>Pieces</Text>
                      <View style={styles.inputWrapper}>
                        <Hash size={16} color={Theme.colors.text.muted} />
                        <TextInput
                          style={styles.input}
                          value={stone.pcs}
                          onChangeText={(v) => updateStone(stone.id, 'pcs', v)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={Theme.colors.text.muted}
                        />
                      </View>
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>Rate (Optional)</Text>
                      <View style={styles.inputWrapper}>
                        <IndianRupee size={16} color={Theme.colors.text.muted} />
                        <TextInput
                          style={styles.input}
                          value={stone.rate}
                          onChangeText={(v) => updateStone(stone.id, 'rate', v)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={Theme.colors.text.muted}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
            
            {stones.length > 0 && (
              <TouchableOpacity style={styles.addMoreBtn} onPress={addStoneRow}>
                <Plus size={20} color={Theme.colors.primary} />
                <Text style={styles.addMoreText}>ADD ANOTHER STONE</Text>
              </TouchableOpacity>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Theme.colors.text.black} /> : <Save size={20} color={Theme.colors.text.black} />}
              <Text style={styles.saveBtnText}>UPDATE STONES</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stone Picker Modal */}
        <Modal visible={!!showPicker} transparent animationType="fade">
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Stone</Text>
                <TouchableOpacity onPress={() => setShowPicker(null)} style={styles.pickerClose}>
                  <X size={24} color={Theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.pickerSearch}>
                <Search size={18} color={Theme.colors.text.muted} />
                <TextInput
                  style={styles.pickerSearchInput}
                  placeholder="Search stone name..."
                  placeholderTextColor={Theme.colors.text.muted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>

              <ScrollView style={styles.pickerList}>
                {filteredMasterStones.map((s) => (
                  <TouchableOpacity 
                    key={s.id} 
                    style={styles.pickerItem}
                    onPress={() => showPicker && selectStoneFromMaster(showPicker, s)}
                  >
                    <View>
                      <Text style={styles.pickerItemName}>{s.name}</Text>
                      <Text style={styles.pickerItemCat}>{s.category}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.pickerItemRate}>₹{s.rate}</Text>
                      <ChevronRight size={16} color={Theme.colors.text.muted} />
                    </View>
                  </TouchableOpacity>
                ))}
                {filteredMasterStones.length === 0 && (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: Theme.colors.text.muted }}>No stones match your search.</Text>
                    <TouchableOpacity 
                        style={{ marginTop: 20, padding: 10 }}
                        onPress={() => {
                            if (showPicker) {
                                setStones(stones.map(st => st.id === showPicker ? { ...st, name: searchQuery.toUpperCase() } : st));
                                setShowPicker(null);
                            }
                        }}
                    >
                        <Text style={{ color: Theme.colors.primary, fontWeight: '700' }}>USE "{searchQuery.toUpperCase()}" ANYWAY</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>

  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
  },
  content: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '90%',
    width: '100%',
    padding: 24,
    ...Platform.select({
      web: {
        maxWidth: 500,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: Theme.colors.border,
      }
    })
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  stoneCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  stoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border + '40',
  },
  stoneNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.text.secondary,
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.text.muted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 10,
    color: Theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderRadius: 15,
    borderStyle: 'dashed',
    marginTop: 10,
  },
  addMoreText: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 15,
  },
  emptyText: {
    color: Theme.colors.text.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  addBtnInline: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  addBtnTextInline: {
    color: Theme.colors.text.black,
    fontWeight: '800',
    fontSize: 13,
  },
  footer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  saveBtnText: {
    color: Theme.colors.text.black,
    fontSize: 16,
    fontWeight: '800',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  pickerContent: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 24,
    maxHeight: '80%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  pickerClose: {
    padding: 4,
  },
  pickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  pickerSearchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    color: Theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  pickerList: {
    paddingBottom: 20,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  pickerItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text.primary,
  },
  pickerItemCat: {
    fontSize: 10,
    color: Theme.colors.primary,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  pickerItemRate: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
});
 