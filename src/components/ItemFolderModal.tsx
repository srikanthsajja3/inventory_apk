import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { X, Save, Package, Hash, Tag, MapPin, FolderPlus, Edit3, Image as ImageIcon, Camera, Scale, IndianRupee, FileText, Ruler, Info } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase';
import { decode } from 'base64-arraybuffer';

interface ItemFolderModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  currentFolderId: string | null;
  initialData?: any; 
}

const SectionHeader = ({ title, icon: Icon }: any) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIconContainer}>
      <Icon size={16} color="#6366f1" />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionLine} />
  </View>
);

const InputField = ({ label, icon: Icon, value, onChangeText, keyboardType = 'default', multiline = false, placeholder }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, multiline && styles.textAreaWrapper]}>
      {Icon && <Icon size={18} color="#94a3b8" style={styles.inputIcon} />}
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
        placeholderTextColor="#cbd5e1"
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  </View>
);

export default function ItemFolderModal({ isVisible, onClose, onSave, currentFolderId, initialData }: ItemFolderModalProps) {
  const [type, setType] = useState<'item' | 'folder'>('item');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<any[]>([]); 
  const [form, setForm] = useState({
    name: '',
    sku: '',
    quantity: '0',
    location: '',
    description: '',
    label_no: '',
    pcs: '0',
    purity: '',
    gross_wt: '0',
    net_wt: '0',
    dai_wt: '0',
    dai_pcs: '0',
    clr_stone_wt: '0',
    clr_stone_pcs: '0',
    wastage: '0',
    labour_rate: '0',
    labour_amt: '0',
    doc_no: '',
    doc_date: new Date().toISOString().split('T')[0],
    size: '',
    labeling_date: new Date().toISOString().split('T')[0],
    purch_wastage_rate: '0',
    quality: '',
    other_charges: '0',
    dia_purchase_amt: '0',
    stone_purchase_amt: '0',
    huid: '',
    stones_in_detail: '',
    dai_rd: '0',
    dai_pear: '0',
    dai_stb: '0',
    igi_fee: '0'
  });

  const isEdit = !!initialData;

  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        setType(initialData.sku !== undefined || initialData.barcode !== undefined ? 'item' : 'folder');
        setForm({
          name: initialData.name || '',
          sku: initialData.sku || '',
          quantity: String(initialData.quantity || 0),
          location: initialData.location || '',
          description: initialData.description || '',
          label_no: initialData.label_no || '',
          pcs: String(initialData.pcs || 0),
          purity: initialData.purity || '',
          gross_wt: String(initialData.gross_wt || 0),
          net_wt: String(initialData.net_wt || 0),
          dai_wt: String(initialData.dai_wt || 0),
          dai_pcs: String(initialData.dai_pcs || 0),
          clr_stone_wt: String(initialData.clr_stone_wt || 0),
          clr_stone_pcs: String(initialData.clr_stone_pcs || 0),
          wastage: String(initialData.wastage || 0),
          labour_rate: String(initialData.labour_rate || 0),
          labour_amt: String(initialData.labour_amt || 0),
          doc_no: initialData.doc_no || '',
          doc_date: initialData.doc_date || new Date().toISOString().split('T')[0],
          size: initialData.size || '',
          labeling_date: initialData.labeling_date || new Date().toISOString().split('T')[0],
          purch_wastage_rate: String(initialData.purch_wastage_rate || 0),
          quality: initialData.quality || '',
          other_charges: String(initialData.other_charges || 0),
          dia_purchase_amt: String(initialData.dia_purchase_amt || 0),
          stone_purchase_amt: String(initialData.stone_purchase_amt || 0),
          huid: initialData.huid || '',
          stones_in_detail: initialData.stones_in_detail || '',
          dai_rd: String(initialData.dai_rd || 0),
          dai_pear: String(initialData.dai_pear || 0),
          dai_stb: String(initialData.dai_stb || 0),
          igi_fee: String(initialData.igi_fee || 0)
        });
        
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
          sku: '',
          quantity: '0',
          location: '',
          description: '',
          label_no: '',
          pcs: '0',
          purity: '',
          gross_wt: '0',
          net_wt: '0',
          dai_wt: '0',
          dai_pcs: '0',
          clr_stone_wt: '0',
          clr_stone_pcs: '0',
          wastage: '0',
          labour_rate: '0',
          labour_amt: '0',
          doc_no: '',
          doc_date: new Date().toISOString().split('T')[0],
          size: '',
          labeling_date: new Date().toISOString().split('T')[0],
          purch_wastage_rate: '0',
          quality: '',
          other_charges: '0',
          dia_purchase_amt: '0',
          stone_purchase_amt: '0',
          huid: '',
          stones_in_detail: '',
          dai_rd: '0',
          dai_pear: '0',
          dai_stb: '0',
          igi_fee: '0'
        });
        setImages([]);
        setType('item');
      }
    }
  }, [isVisible, initialData]);

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
      if (asset.uri.includes('supabase.co')) {
        uploadedUrls.push(asset.uri);
        continue;
      }

      if (!asset.base64) {
        uploadedUrls.push(asset.uri);
        continue;
      }

      try {
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = `items/${fileName}`;

        const { error } = await supabase.storage
          .from('item-images')
          .upload(filePath, decode(asset.base64), {
            contentType: 'image/jpeg'
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(filePath);

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

      if (type === 'folder') {
        if (isEdit) {
          const { error } = await supabase
            .from('categories')
            .update({ name: form.name })
            .eq('id', initialData.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('categories')
            .insert([{ name: form.name, parent_id: currentFolderId }]);
          if (error) throw error;
        }
      } else {
        const payload: any = {
          name: form.name,
          sku: form.sku || null,
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
          clr_stone_wt: parseFloat(form.clr_stone_wt) || 0,
          clr_stone_pcs: parseInt(form.clr_stone_pcs) || 0,
          wastage: parseFloat(form.wastage) || 0,
          labour_rate: parseFloat(form.labour_rate) || 0,
          labour_amt: parseFloat(form.labour_amt) || 0,
          doc_no: form.doc_no || null,
          doc_date: form.doc_date || null,
          size: form.size || null,
          labeling_date: form.labeling_date || null,
          purch_wastage_rate: parseFloat(form.purch_wastage_rate) || 0,
          quality: form.quality || null,
          other_charges: parseFloat(form.other_charges) || 0,
          dia_purchase_amt: parseFloat(form.dia_purchase_amt) || 0,
          stone_purchase_amt: parseFloat(form.stone_purchase_amt) || 0,
          huid: form.huid || null,
          stones_in_detail: form.stones_in_detail || null,
          dai_rd: parseFloat(form.dai_rd) || 0,
          dai_pear: parseFloat(form.dai_pear) || 0,
          dai_stb: parseFloat(form.dai_stb) || 0,
          igi_fee: parseFloat(form.igi_fee) || 0
        };

        if (isEdit) {
          const { error } = await supabase
            .from('items')
            .update(payload)
            .eq('id', initialData.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('items')
            .insert([{ ...payload, category_id: currentFolderId }]);
          if (error) throw error;
        }
      }

      onSave();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const Row = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.row}>{children}</View>
  );

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>{isEdit ? 'Edit' : 'Add New'} {type === 'item' ? 'Item' : 'Folder'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {!isEdit && (
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'item' && styles.typeBtnActive]} 
                onPress={() => setType('item')}
              >
                <Package size={20} color={type === 'item' ? 'white' : '#64748b'} />
                <Text style={[styles.typeBtnText, type === 'item' && styles.typeBtnTextActive]}>Item</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'folder' && styles.typeBtnActive]} 
                onPress={() => setType('folder')}
              >
                <FolderPlus size={20} color={type === 'folder' ? 'white' : '#64748b'} />
                <Text style={[styles.typeBtnText, type === 'folder' && styles.typeBtnTextActive]}>Folder</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {type === 'item' && (
              <>
                <View style={styles.imagePickerSection}>
                  <Text style={styles.label}>Product Images</Text>
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
                      <View style={styles.imagePlaceholderSmall}>
                        <Camera size={24} color="#94a3b8" />
                        <Text style={styles.imagePlaceholderTextSmall}>Add</Text>
                      </View>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                <SectionHeader title="Basic Information" icon={Info} />
                <InputField 
                  label="Item Name" 
                  icon={Package} 
                  value={form.name} 
                  onChangeText={(t: string) => setForm({...form, name: t})} 
                />
                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="SKU / Barcode" 
                      icon={Hash} 
                      value={form.sku} 
                      onChangeText={(t: string) => setForm({...form, sku: t})} 
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Purity" 
                      icon={Tag} 
                      value={form.purity} 
                      onChangeText={(t: string) => setForm({...form, purity: t})} 
                    />
                  </View>
                </Row>

                <SectionHeader title="Identification & Stock" icon={Hash} />
                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Label No" 
                      icon={Hash} 
                      value={form.label_no} 
                      onChangeText={(t: string) => setForm({...form, label_no: t})} 
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="HUID" 
                      icon={FileText} 
                      value={form.huid} 
                      onChangeText={(t: string) => setForm({...form, huid: t})} 
                    />
                  </View>
                </Row>
                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Pcs" 
                      icon={Hash} 
                      value={form.pcs} 
                      onChangeText={(t: string) => setForm({...form, pcs: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Stock Qty" 
                      icon={Package} 
                      value={form.quantity} 
                      onChangeText={(t: string) => setForm({...form, quantity: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                </Row>

                <SectionHeader title="Weights (Grams)" icon={Scale} />
                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Gross Wt" 
                      icon={Scale} 
                      value={form.gross_wt} 
                      onChangeText={(t: string) => setForm({...form, gross_wt: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Net Wt" 
                      icon={Scale} 
                      value={form.net_wt} 
                      onChangeText={(t: string) => setForm({...form, net_wt: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                </Row>
                <InputField 
                  label="Wastage (%)" 
                  icon={Hash} 
                  value={form.wastage} 
                  onChangeText={(t: string) => setForm({...form, wastage: t})} 
                  keyboardType="numeric"
                />

                <SectionHeader title="Diamond Details" icon={Edit3} />
                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Dai Wt" 
                      icon={Hash} 
                      value={form.dai_wt} 
                      onChangeText={(t: string) => setForm({...form, dai_wt: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Dai Pcs" 
                      icon={Hash} 
                      value={form.dai_pcs} 
                      onChangeText={(t: string) => setForm({...form, dai_pcs: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                </Row>
                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Dai RD" 
                      icon={Hash} 
                      value={form.dai_rd} 
                      onChangeText={(t: string) => setForm({...form, dai_rd: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Dai Pear" 
                      icon={Hash} 
                      value={form.dai_pear} 
                      onChangeText={(t: string) => setForm({...form, dai_pear: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                </Row>
                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Dai STB" 
                      icon={Hash} 
                      value={form.dai_stb} 
                      onChangeText={(t: string) => setForm({...form, dai_stb: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="IGI Fee" 
                      icon={IndianRupee} 
                      value={form.igi_fee} 
                      onChangeText={(t: string) => setForm({...form, igi_fee: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                </Row>

                <SectionHeader title="Stone Details" icon={Tag} />
                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Stone Wt" 
                      icon={Scale} 
                      value={form.clr_stone_wt} 
                      onChangeText={(t: string) => setForm({...form, clr_stone_wt: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Stone Pcs" 
                      icon={Hash} 
                      value={form.clr_stone_pcs} 
                      onChangeText={(t: string) => setForm({...form, clr_stone_pcs: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                </Row>
                <InputField 
                  label="Stones in Detail" 
                  icon={Tag} 
                  value={form.stones_in_detail} 
                  onChangeText={(t: string) => setForm({...form, stones_in_detail: t})} 
                />

                <SectionHeader title="Pricing & Labour" icon={IndianRupee} />
                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Labour Rate" 
                      icon={IndianRupee} 
                      value={form.labour_rate} 
                      onChangeText={(t: string) => setForm({...form, labour_rate: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Labour Amt" 
                      icon={IndianRupee} 
                      value={form.labour_amt} 
                      onChangeText={(t: string) => setForm({...form, labour_amt: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                </Row>
                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Dia Purchase" 
                      icon={IndianRupee} 
                      value={form.dia_purchase_amt} 
                      onChangeText={(t: string) => setForm({...form, dia_purchase_amt: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Stone Purchase" 
                      icon={IndianRupee} 
                      value={form.stone_purchase_amt} 
                      onChangeText={(t: string) => setForm({...form, stone_purchase_amt: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                </Row>
                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Purch Wastage" 
                      icon={Hash} 
                      value={form.purch_wastage_rate} 
                      onChangeText={(t: string) => setForm({...form, purch_wastage_rate: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Other Charges" 
                      icon={IndianRupee} 
                      value={form.other_charges} 
                      onChangeText={(t: string) => setForm({...form, other_charges: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                </Row>

                <SectionHeader title="Reference & Logistics" icon={MapPin} />
                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Doc No" 
                      icon={FileText} 
                      value={form.doc_no} 
                      onChangeText={(t: string) => setForm({...form, doc_no: t})} 
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Doc Date" 
                      icon={Hash} 
                      value={form.doc_date} 
                      onChangeText={(t: string) => setForm({...form, doc_date: t})} 
                    />
                  </View>
                </Row>
                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Label Date" 
                      icon={Hash} 
                      value={form.labeling_date} 
                      onChangeText={(t: string) => setForm({...form, labeling_date: t})} 
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Size" 
                      icon={Ruler} 
                      value={form.size} 
                      onChangeText={(t: string) => setForm({...form, size: t})} 
                    />
                  </View>
                </Row>
                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Quality" 
                      icon={Tag} 
                      value={form.quality} 
                      onChangeText={(t: string) => setForm({...form, quality: t})} 
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Location" 
                      icon={MapPin} 
                      value={form.location} 
                      onChangeText={(t: string) => setForm({...form, location: t})} 
                    />
                  </View>
                </Row>
                <InputField 
                  label="Description" 
                  icon={Tag} 
                  value={form.description} 
                  onChangeText={(t: string) => setForm({...form, description: t})} 
                  multiline={true}
                />
              </>
            )}

            {type === 'folder' && (
              <InputField 
                label="Folder Name" 
                icon={FolderPlus} 
                value={form.name} 
                onChangeText={(t: string) => setForm({...form, name: t})} 
              />
            )}
            <View style={{ height: 40 }} />
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
                  <Text style={styles.saveButtonText}>{isEdit ? 'Update' : 'Save'} {type === 'item' ? 'Item' : 'Folder'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderRadius: 12,
    marginBottom: 24,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  typeBtnActive: {
    backgroundColor: '#6366f1',
    elevation: 2,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  typeBtnTextActive: {
    color: 'white',
  },
  imagePickerSection: {
    marginBottom: 24,
  },
  imagesScrollView: {
    flexDirection: 'row',
    paddingBottom: 10,
  },
  imagePickerWrapper: {
    width: 100,
    height: 100,
    borderRadius: 16,
    marginRight: 12,
    position: 'relative',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  imagePickerSmall: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imagePlaceholderTextSmall: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
  },
  removeImageSmall: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  form: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    gap: 10,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  inputIcon: {
    marginRight: 8,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' },
      default: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      }
    }),
  },
  saveButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#94a3b8',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
