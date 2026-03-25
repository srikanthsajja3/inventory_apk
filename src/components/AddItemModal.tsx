import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { X, Save, Package, Hash, Tag, MapPin, FolderPlus } from 'lucide-react-native';
import { supabase } from '../../supabase';

interface AddItemModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  currentFolderId: string | null;
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

export default function AddItemModal({ isVisible, onClose, onSave, currentFolderId }: AddItemModalProps) {
  const [type, setType] = useState<'item' | 'folder'>('item');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    quantity: '0',
    location: '',
    description: ''
  });

  const handleSave = async () => {
    if (!form.name) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      setLoading(true);
      
      if (type === 'folder') {
        const { error } = await supabase
          .from('categories')
          .insert([{ 
            name: form.name, 
            parent_id: currentFolderId 
          }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('items')
          .insert([{
            name: form.name,
            sku: form.sku || null,
            quantity: parseInt(form.quantity) || 0,
            location: form.location || null,
            description: form.description || null,
            category_id: currentFolderId
          }]);
        if (error) throw error;
      }

      setForm({ name: '', sku: '', quantity: '0', location: '', description: '' });
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
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Add New {type === 'item' ? 'Item' : 'Folder'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

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

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <InputField 
              label={type === 'item' ? "Item Name" : "Folder Name"} 
              icon={type === 'item' ? Package : FolderPlus} 
              value={form.name} 
              onChangeText={(t: string) => setForm({...form, name: t})} 
            />

            {type === 'item' && (
              <>
                <InputField 
                  label="SKU / Barcode" 
                  icon={Hash} 
                  value={form.sku} 
                  onChangeText={(t: string) => setForm({...form, sku: t})} 
                />
                <InputField 
                  label="Initial Quantity" 
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
                  <Save size={20} color="white" />
                  <Text style={styles.saveButtonText}>Save {type === 'item' ? 'Item' : 'Folder'}</Text>
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
    height: '85%',
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
