import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { X, Save, Package, Hash, Tag, MapPin, FolderPlus, Edit3, Image as ImageIcon, Camera } from 'lucide-react-native';
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

const InputField = ({ label, icon: Icon, value, onChangeText, keyboardType = 'default', multiline = false }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, multiline && styles.textAreaWrapper]}>
      <Icon size={18} color="#94a3b8" />
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={`Enter ${label.toLowerCase()}...`}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  </View>
);

export default function ItemFolderModal({ isVisible, onClose, onSave, currentFolderId, initialData }: ItemFolderModalProps) {
  const [type, setType] = useState<'item' | 'folder'>('item');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
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
    huid: ''
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
          huid: initialData.huid || ''
        });
        setImage(initialData.image_url || null);
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
          huid: ''
        });
        setImage(null);
        setType('item');
      }
    }
  }, [isVisible, initialData]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      // If we have base64, we can store it to upload later
      (setImage as any).base64 = result.assets[0].base64;
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      // If it's already a supabase URL, don't re-upload
      if (uri.includes('supabase.co')) return uri;

      const base64 = (setImage as any).base64;
      if (!base64) return uri; // Fallback

      const fileName = `${Date.now()}.jpg`;
      const filePath = `items/${fileName}`;

      const { data, error } = await supabase.storage
        .from('item-images')
        .upload(filePath, decode(base64), {
          contentType: 'image/jpeg'
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!form.name) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      setLoading(true);
      
      let imageUrl = image;
      if (image && !image.includes('supabase.co')) {
        imageUrl = await uploadImage(image);
      }

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
        const payload = {
          name: form.name,
          sku: form.sku || null,
          quantity: parseInt(form.quantity) || 0,
          location: form.location || null,
          description: form.description || null,
          image_url: imageUrl,
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
          huid: form.huid || null
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
              <View style={styles.imagePickerContainer}>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Camera size={32} color="#94a3b8" />
                      <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {image && (
                  <TouchableOpacity style={styles.removeImage} onPress={() => setImage(null)}>
                    <X size={16} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <InputField 
              label={type === 'item' ? "Item Name" : "Folder Name"} 
              icon={type === 'item' ? Package : FolderPlus} 
              value={form.name} 
              onChangeText={(t: string) => setForm({...form, name: t})} 
            />

            {type === 'item' && (
              <>
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
                      label="Pcs" 
                      icon={Hash} 
                      value={form.pcs} 
                      onChangeText={(t: string) => setForm({...form, pcs: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                </Row>

                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Purity" 
                      icon={Tag} 
                      value={form.purity} 
                      onChangeText={(t: string) => setForm({...form, purity: t})} 
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="SKU / Barcode" 
                      icon={Hash} 
                      value={form.sku} 
                      onChangeText={(t: string) => setForm({...form, sku: t})} 
                    />
                  </View>
                </Row>

                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Gross Wt" 
                      icon={Hash} 
                      value={form.gross_wt} 
                      onChangeText={(t: string) => setForm({...form, gross_wt: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Net Wt" 
                      icon={Hash} 
                      value={form.net_wt} 
                      onChangeText={(t: string) => setForm({...form, net_wt: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                </Row>

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
                      label="Clr Stone Wt" 
                      icon={Hash} 
                      value={form.clr_stone_wt} 
                      onChangeText={(t: string) => setForm({...form, clr_stone_wt: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Clr Stone Pcs" 
                      icon={Hash} 
                      value={form.clr_stone_pcs} 
                      onChangeText={(t: string) => setForm({...form, clr_stone_pcs: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                </Row>

                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Wastage" 
                      icon={Hash} 
                      value={form.wastage} 
                      onChangeText={(t: string) => setForm({...form, wastage: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Labour Rate" 
                      icon={Hash} 
                      value={form.labour_rate} 
                      onChangeText={(t: string) => setForm({...form, labour_rate: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                </Row>

                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Labour Amt" 
                      icon={Hash} 
                      value={form.labour_amt} 
                      onChangeText={(t: string) => setForm({...form, labour_amt: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Size" 
                      icon={Tag} 
                      value={form.size} 
                      onChangeText={(t: string) => setForm({...form, size: t})} 
                    />
                  </View>
                </Row>

                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Doc No" 
                      icon={Hash} 
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
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                </Row>

                <InputField 
                  label="Labeling Date" 
                  icon={Hash} 
                  value={form.labeling_date} 
                  onChangeText={(t: string) => setForm({...form, labeling_date: t})} 
                  placeholder="YYYY-MM-DD"
                />

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
                      label="Quality" 
                      icon={Tag} 
                      value={form.quality} 
                      onChangeText={(t: string) => setForm({...form, quality: t})} 
                    />
                  </View>
                </Row>

                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Dia Purchase" 
                      icon={Hash} 
                      value={form.dia_purchase_amt} 
                      onChangeText={(t: string) => setForm({...form, dia_purchase_amt: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="Stone Purchase" 
                      icon={Hash} 
                      value={form.stone_purchase_amt} 
                      onChangeText={(t: string) => setForm({...form, stone_purchase_amt: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                </Row>

                <Row>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField 
                      label="Other Charges" 
                      icon={Hash} 
                      value={form.other_charges} 
                      onChangeText={(t: string) => setForm({...form, other_charges: t})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField 
                      label="HUID" 
                      icon={Hash} 
                      value={form.huid} 
                      onChangeText={(t: string) => setForm({...form, huid: t})} 
                    />
                  </View>
                </Row>

                <InputField 
                  label="Stock Quantity" 
                  icon={Hash} 
                  value={form.quantity} 
                  onChangeText={(t: string) => setForm({...form, quantity: t})} 
                  keyboardType="numeric"
                />
                <InputField 
                  label="Storage Location" 
                  icon={MapPin} 
                  value={form.location} 
                  onChangeText={(t: string) => setForm({...form, location: t})} 
                />
                <InputField 
                  label="Description" 
                  icon={Tag} 
                  value={form.description} 
                  onChangeText={(t: string) => setForm({...form, description: t})} 
                  multiline={true}
                />
              </>
            )}
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
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: '30%',
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
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
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
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
