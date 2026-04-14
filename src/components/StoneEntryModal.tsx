import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, FlatList } from 'react-native';
import { X, Save, Package, Hash, Tag, MapPin, Camera, Folder, Edit3, Plus, Trash2, ChevronDown, Search } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase';
import { decode } from 'base64-arraybuffer';

interface StoneEntryModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  initialSku?: string;
  initialData?: any;
}

interface DynamicStone {
  id: string;
  name: string;
  weight: string;
  pcs: string;
  rate: string;
  category: string;
}

const InputField = ({ label, icon: Icon, value, onChangeText, keyboardType = 'default', multiline = false, placeholder }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, multiline && styles.textAreaWrapper]}>
      <Icon size={18} color="#94a3b8" />
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  </View>
);

const StonePickerModal = ({ isVisible, onClose, onSelect, stones }: any) => {
  const [search, setSearch] = useState('');
  
  // SIMPLIFY PICKER: Group "Shape Diamonds" and "VVS-EF-RD" into single options
  const simplifiedStones = stones.reduce((acc: any[], current: any) => {
    const name = current.name.toLowerCase();
    const subCat = (current.sub_category || '').toUpperCase();
    
    const isShape = name.includes('shape') && name.includes('diamond');
    const isRD = name.includes('vvs') || name.includes('ef') || subCat === 'RD';
    
    if (isShape) {
      if (!acc.find(s => s.id === 'shape-group')) {
        acc.push({ ...current, id: 'shape-group', name: 'Shape Diamonds', category: 'Diamond', sub_category: 'SHAPE', isGroup: true });
      }
    } else if (isRD) {
      if (!acc.find(s => s.id === 'rd-group')) {
        acc.push({ ...current, id: 'rd-group', name: 'Diamond (VVS-EF-RD)', category: 'Diamond', sub_category: 'RD', isGroup: true });
      }
    } else {
      acc.push(current);
    }
    return acc;
  }, []);

  const filteredStones = simplifiedStones.filter((s: any) => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContent}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Stone</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color="#64748b" /></TouchableOpacity>
          </View>
          <View style={styles.searchBar}>
            <Search size={20} color="#94a3b8" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search stones..." 
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <FlatList
            data={filteredStones}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.pickerItem} 
                onPress={() => { onSelect(item); onClose(); }}
              >
                <View>
                  <Text style={styles.pickerItemName}>{item.name}</Text>
                  <Text style={styles.pickerItemCat}>
                    {item.isGroup ? 'Auto-calculates rate based on WT/PCS' : `${item.category} • Rate: ₹${item.rate}`}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const num = (val: string | number) => parseFloat(String(val)) || 0;

const getDynamicRate = (name: string, weight: number, pcs: number, master: any[]) => {
  const normalizedName = name.toLowerCase().trim();
  const w = num(weight);
  const p = num(pcs);
  if (w === 0 || p === 0 || !master || master.length === 0) return null;
  
  const avgSize = w / p;
  
  const matches = master.filter(s => {
    const mName = s.name.toLowerCase().trim();
    const mCat = s.category.toLowerCase().trim();
    const mSubCat = (s.sub_category || '').toUpperCase().trim();
    
    // Check if it's a VVS/RD match
    const isRD = (normalizedName.includes('vvs') || normalizedName.includes('ef') || normalizedName === 'diamond') && mSubCat === 'RD';
    const isShape = normalizedName.includes('shape') && mSubCat === 'SHAPE';
    
    // Generic match fallback
    const isGenericMatch = mName.includes(normalizedName) || normalizedName.includes(mName) || mCat === normalizedName;
    
    return (isRD || isShape || isGenericMatch) &&
           avgSize >= num(s.min_wt) &&
           avgSize <= num(s.max_wt);
  });

  if (matches.length === 0) return null;

  // Sort by range width to get most specific slab
  matches.sort((a, b) => (num(a.max_wt) - num(a.min_wt)) - (num(b.max_wt) - num(b.min_wt)));
  
  let rate = matches[0].rate;
  if (normalizedName.includes('emerald') || normalizedName.includes('ruby')) {
    rate = num(rate) - 1000;
  }
  
  return rate;
};

export default function StoneEntryModal({ isVisible, onClose, onSave, initialSku, initialData }: StoneEntryModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [stoneMaster, setStoneMaster] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [dynamicStones, setDynamicStones] = useState<DynamicStone[]>([]);
  const [showPicker, setShowPicker] = useState({ visible: false, targetId: '' });
  
  const [form, setForm] = useState({
    name: '',
    sku: '',
    quantity: '1',
    location: '',
    label_no: '',
    pcs: '1',
    purity: '',
    gross_wt: '',
    net_wt: '',
    dai_wt: '',
    dai_pcs: '',
    clr_stone_wt: '',
    clr_stone_pcs: '',
    wastage: '',
    labour_rate: '',
    labour_amt: '',
    other_charges: '',
    dia_purchase_amt: '',
    stone_purchase_amt: '',
    huid: '',
    description: ''
  });

  const isEdit = !!initialData;

  useEffect(() => {
    if (isVisible) {
      fetchCategories();
      fetchStoneMaster();
      
      if (initialData) {
        setForm({
          name: initialData.name || '',
          sku: initialData.sku || '',
          quantity: String(initialData.quantity || 1),
          location: initialData.location || '',
          label_no: initialData.label_no || '',
          pcs: String(initialData.pcs || 1),
          purity: initialData.purity || '',
          gross_wt: String(initialData.gross_wt || ''),
          net_wt: String(initialData.net_wt || ''),
          dai_wt: String(initialData.dai_wt || ''),
          dai_pcs: String(initialData.dai_pcs || ''),
          clr_stone_wt: String(initialData.clr_stone_wt || ''),
          clr_stone_pcs: String(initialData.clr_stone_pcs || ''),
          wastage: String(initialData.wastage || ''),
          labour_rate: String(initialData.labour_rate || ''),
          labour_amt: String(initialData.labour_amt || ''),
          other_charges: String(initialData.other_charges || ''),
          dia_purchase_amt: String(initialData.dia_purchase_amt || ''),
          stone_purchase_amt: String(initialData.stone_purchase_amt || ''),
          huid: initialData.huid || '',
          description: initialData.description || ''
        });
        setSelectedCategory(initialData.category_id || null);
        
        try {
          if (initialData.stones_in_detail && initialData.stones_in_detail.startsWith('[')) {
            setDynamicStones(JSON.parse(initialData.stones_in_detail));
          } else {
            setDynamicStones([]);
          }
        } catch (e) {
          setDynamicStones([]);
        }

        if (initialData.image_urls && initialData.image_urls.length > 0) {
          setImages(initialData.image_urls.map((url: string) => ({ uri: url })));
        } else if (initialData.image_url) {
          setImages([{ uri: initialData.image_url }]);
        } else {
          setImages([]);
        }
      } else {
        setForm({
          name: '',
          sku: initialSku || '',
          quantity: '1',
          location: '',
          label_no: '',
          pcs: '1',
          purity: '',
          gross_wt: '',
          net_wt: '',
          dai_wt: '',
          dai_pcs: '',
          clr_stone_wt: '',
          clr_stone_pcs: '',
          wastage: '',
          labour_rate: '',
          labour_amt: '',
          other_charges: '',
          dia_purchase_amt: '',
          stone_purchase_amt: '',
          huid: '',
          description: ''
        });
        setDynamicStones([]);
        setImages([]);
      }
    }
  }, [isVisible, initialSku, initialData]);

  useEffect(() => {
    if (stoneMaster.length > 0 && dynamicStones.length > 0) {
      const updated = dynamicStones.map(s => {
        const dRate = getDynamicRate(s.name, num(s.weight), num(s.pcs), stoneMaster);
        return dRate ? { ...s, rate: String(dRate) } : s;
      });
      // Only set if actually changed to avoid loop
      if (JSON.stringify(updated) !== JSON.stringify(dynamicStones)) {
        setDynamicStones(updated);
      }
    }
  }, [stoneMaster]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('id, name').order('name');
      if (error) throw error;
      setCategories(data || []);
      if (data && data.length > 0 && !selectedCategory && !initialData) {
        setSelectedCategory(data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error.message);
    }
  };

  const fetchStoneMaster = async () => {
    try {
      const { data, error } = await supabase.from('stone_master').select('*').order('name');
      if (error) throw error;
      setStoneMaster(data || []);
    } catch (error: any) {
      console.error('Error fetching stone master:', error.message);
    }
  };

  const addStoneRow = () => {
    const newStone: DynamicStone = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Select Stone',
      weight: '0',
      pcs: '0',
      rate: '0',
      category: 'Stone'
    };
    setDynamicStones([...dynamicStones, newStone]);
  };

  const removeStoneRow = (id: string) => {
    setDynamicStones(dynamicStones.filter(s => s.id !== id));
  };

  const updateStoneRow = (id: string, updates: Partial<DynamicStone>) => {
    setDynamicStones(dynamicStones.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => ({
        uri: asset.uri,
        base64: asset.base64
      }));
      setImages([...images, ...newImages]);
    }
  };

  const uploadImages = async (imageAssets: any[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (const asset of imageAssets) {
      if (asset.uri.startsWith('http')) {
        uploadedUrls.push(asset.uri);
        continue;
      }
      if (!asset.base64) continue;
      try {
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = `items/${fileName}`;
        const { error } = await supabase.storage
          .from('item-images')
          .upload(filePath, decode(asset.base64), { contentType: 'image/jpeg' });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
    return uploadedUrls;
  };

  const handleSave = async () => {
    if (!form.name) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      setLoading(true);
      const uploadedUrls = await uploadImages(images);

      const totalStoneWt = dynamicStones.reduce((acc, s) => acc + (parseFloat(s.weight) || 0), 0);
      const totalStonePcs = dynamicStones.reduce((acc, s) => acc + (parseInt(s.pcs) || 0), 0);

    const payload = {
      name: form.name,
      sku: form.sku || null,
      category_id: selectedCategory,
      quantity: parseInt(form.quantity) || 0,
      location: form.location || null,
      description: form.description || null,
      image_url: uploadedUrls[0] || null,
      image_urls: uploadedUrls,
      label_no: form.label_no || null,
      pcs: parseInt(form.pcs) || 0,
      purity: form.purity || null,
      gross_wt: parseFloat(form.gross_wt) || 0,
      net_wt: parseFloat(form.net_wt) || 0,
      dai_wt: parseFloat(form.dai_wt) || 0,
      dai_pcs: parseInt(form.dai_pcs) || 0,
      clr_stone_wt: totalStoneWt || parseFloat(form.clr_stone_wt) || 0,
      clr_stone_pcs: totalStonePcs || parseInt(form.clr_stone_pcs) || 0,
      stones_in_detail: JSON.stringify(dynamicStones),
      wastage: parseFloat(form.wastage) || 0,
      labour_rate: form.labour_rate ? parseFloat(form.labour_rate) : (form.name.trim().toUpperCase().startsWith('D') ? 1200 : 550),
      labour_amt: parseFloat(form.labour_amt) || 0,
      other_charges: parseFloat(form.other_charges) || 0,
      dia_purchase_amt: parseFloat(form.dia_purchase_amt) || 0,
      stone_purchase_amt: parseFloat(form.stone_purchase_amt) || 0,
      huid: form.huid || null
    };

      let error;
      if (isEdit) {
        const { error: updateError } = await supabase
          .from('items')
          .update(payload)
          .eq('id', initialData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('items')
          .insert([payload]);
        error = insertError;
      }
      
      if (error) throw error;

      onSave();
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
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>{isEdit ? 'Update' : 'Add'} Stone Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.imageSection}>
              <Text style={styles.sectionTitle}>Product Images</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
                {images.map((img, index) => (
                  <View key={index} style={styles.imagePickerWrapper}>
                    <Image source={{ uri: img.uri }} style={styles.previewImage} />
                    <TouchableOpacity 
                      style={styles.removeImageSmall} 
                      onPress={() => setImages(images.filter((_, i) => i !== index))}
                    >
                      <X size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.imagePickerSmall} onPress={pickImages}>
                  <Camera size={24} color="#94a3b8" />
                  <Text style={styles.imagePlaceholderTextSmall}>Add</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <InputField label="Item Name" icon={Package} value={form.name} onChangeText={(t: string) => setForm({...form, name: t})} />
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryPicker}>
                <Folder size={18} color="#94a3b8" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 10 }}>
                  {categories.map(cat => (
                    <TouchableOpacity 
                      key={cat.id} 
                      style={[styles.catBadge, selectedCategory === cat.id && styles.catBadgeActive]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text style={[styles.catBadgeText, selectedCategory === cat.id && styles.catBadgeTextActive]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}><InputField label="SKU / Barcode" icon={Hash} value={form.sku} onChangeText={(t: string) => setForm({...form, sku: t})} /></View>
              <View style={[styles.flex1, { marginLeft: 10 }]}><InputField label="Label No" icon={Hash} value={form.label_no} onChangeText={(t: string) => setForm({...form, label_no: t})} /></View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}><InputField label="Gross Wt" icon={Hash} value={form.gross_wt} onChangeText={(t: string) => setForm({...form, gross_wt: t})} keyboardType="numeric" /></View>
              <View style={[styles.flex1, { marginLeft: 10 }]}><InputField label="Net Wt" icon={Hash} value={form.net_wt} onChangeText={(t: string) => setForm({...form, net_wt: t})} keyboardType="numeric" /></View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}><InputField label="Purity" icon={Tag} value={form.purity} onChangeText={(t: string) => setForm({...form, purity: t})} /></View>
              <View style={[styles.flex1, { marginLeft: 10 }]}><InputField label="HUID" icon={Hash} value={form.huid} onChangeText={(t: string) => setForm({...form, huid: t})} /></View>
            </View>

            <View style={styles.divider} />
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Stone Details</Text>
              <TouchableOpacity style={styles.addStoneBtn} onPress={addStoneRow}>
                <Plus size={16} color="#6366f1" />
                <Text style={styles.addStoneText}>Add Stone</Text>
              </TouchableOpacity>
            </View>

            {dynamicStones.length > 0 ? (
              <View style={styles.stoneList}>
                <View style={styles.stoneHeaderRow}>
                  <Text style={[styles.stoneHeaderText, { flex: 2 }]}>Stone Name</Text>
                  <Text style={[styles.stoneHeaderText, { flex: 0.8 }]}>Weight</Text>
                  <Text style={[styles.stoneHeaderText, { flex: 0.8 }]}>Pcs</Text>
                  <Text style={[styles.stoneHeaderText, { flex: 1.2 }]}>Rate</Text>
                  <View style={{ width: 30 }} />
                </View>
                {dynamicStones.map((stone) => (
                  <View key={stone.id} style={styles.stoneRow}>
                    <TouchableOpacity 
                      style={[styles.stoneSelect, { flex: 2 }]} 
                      onPress={() => setShowPicker({ visible: true, targetId: stone.id })}
                    >
                      <Text style={styles.stoneSelectText} numberOfLines={1}>{stone.name}</Text>
                      <ChevronDown size={14} color="#94a3b8" />
                    </TouchableOpacity>
                    <TextInput 
                      style={[styles.stoneInput, { flex: 0.8 }]} 
                      value={stone.weight} 
                      onChangeText={(v) => {
                        const newRate = getDynamicRate(stone.name, num(v), num(stone.pcs), stoneMaster);
                        updateStoneRow(stone.id, { weight: v, rate: newRate ? String(newRate) : stone.rate });
                      }}
                      keyboardType="numeric"
                      placeholder="Wt"
                    />
                    <TextInput 
                      style={[styles.stoneInput, { flex: 0.8 }]} 
                      value={stone.pcs} 
                      onChangeText={(v) => {
                        const newRate = getDynamicRate(stone.name, num(stone.weight), num(v), stoneMaster);
                        updateStoneRow(stone.id, { pcs: v, rate: newRate ? String(newRate) : stone.rate });
                      }}
                      keyboardType="numeric"
                      placeholder="Pcs"
                    />
                    <View style={[styles.stoneRateBox, { flex: 1.2 }]}>
                      <Text style={styles.stoneRateText}>₹{num(stone.rate).toLocaleString('en-IN')}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeStoneRow(stone.id)} style={styles.removeStoneBtn}>
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyStones}>
                <Text style={styles.emptyStonesText}>No stones added. Click "Add Stone" to start.</Text>
              </View>
            )}

            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.flex1}><InputField label="Labour Rate" icon={Hash} value={form.labour_rate} onChangeText={(t: string) => setForm({...form, labour_rate: t})} keyboardType="numeric" /></View>
              <View style={[styles.flex1, { marginLeft: 10 }]}><InputField label="Making (Amt)" icon={Hash} value={form.labour_amt} onChangeText={(t: string) => setForm({...form, labour_amt: t})} keyboardType="numeric" /></View>
            </View>

            <InputField label="Other Charges" icon={Hash} value={form.other_charges} onChangeText={(t: string) => setForm({...form, other_charges: t})} keyboardType="numeric" />
            
            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  {isEdit ? <Edit3 size={20} color="white" /> : <Save size={20} color="white" />}
                  <Text style={styles.saveButtonText}>{isEdit ? 'Update Details' : 'Save Stone Details'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <StonePickerModal 
        isVisible={showPicker.visible} 
        onClose={() => setShowPicker({ ...showPicker, visible: false })} 
        stones={stoneMaster}
        onSelect={(s: any) => {
          const n = s.name.toLowerCase().trim();
          const finalName = (n === 'vvs' || n === 'ef' || n === 'rd' || n === 'vvs-ef-rd') ? 'Diamond' : s.name;
          updateStoneRow(showPicker.targetId, { 
            name: finalName, 
            rate: String(s.rate), 
            category: s.category 
          });
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '90%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageSection: {
    marginBottom: 20,
  },
  imagesScrollView: {
    flexDirection: 'row',
  },
  imagePickerWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
    position: 'relative',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  imagePickerSmall: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderTextSmall: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 4,
  },
  removeImageSmall: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#1e293b',
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  categoryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catBadgeActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  catBadgeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  catBadgeTextActive: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 20,
  },
  addStoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  addStoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
  },
  stoneList: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  stoneHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  stoneHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  stoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stoneSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stoneSelectText: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '600',
  },
  stoneInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '700',
    textAlign: 'center',
  },
  removeStoneBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stoneRateBox: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stoneRateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366f1',
  },
  emptyStones: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  emptyStonesText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    fontSize: 14,
  },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  pickerItemCat: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  footer: {
    paddingTop: 16,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
