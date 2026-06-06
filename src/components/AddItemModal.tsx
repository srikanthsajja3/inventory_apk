import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { X, Save, Package, Hash, Tag, MapPin, FolderPlus, IndianRupee } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: Theme.radius.xl,
    borderTopRightRadius: Theme.radius.xl,
    height: '85%',
    padding: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  modalTitle: {
    fontSize: Theme.typography.size.lg,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    padding: 4,
    borderRadius: Theme.radius.md,
    marginBottom: Theme.spacing.lg,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Theme.radius.sm,
    gap: 8,
  },
  typeBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  typeBtnText: {
    fontSize: Theme.typography.size.sm,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
  },
  typeBtnTextActive: {
    color: Theme.colors.text.black,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: Theme.typography.size.sm,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.muted,
    borderRadius: Theme.radius.sm,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: Theme.typography.size.md,
    color: Theme.colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    paddingTop: Theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Theme.radius.md,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
    backgroundColor: Theme.colors.muted,
  },
  saveButtonText: {
    color: Theme.colors.text.black,
    fontSize: Theme.typography.size.md,
    fontWeight: '700',
  },
});

const InputField = ({ label, icon: Icon, value, onChangeText, keyboardType = 'default', multiline = false }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, multiline && styles.textAreaWrapper]}>
      <Icon size={18} color={Theme.colors.text.secondary} />
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={`Enter ${label.toLowerCase()}...`}
        placeholderTextColor={Theme.colors.text.muted}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  </View>
);

interface AddItemModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  currentFolderId: string | null;
}

export default function AddItemModal({ isVisible, onClose, onSave, currentFolderId }: AddItemModalProps) {
  const [type, setType] = useState<'item' | 'folder'>('item');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    location: '',
    description: '',
    prc_amount: ''
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
            location: form.location || null,
            description: form.description || null,
            category_id: currentFolderId,
            prc_amount: parseFloat(form.prc_amount) || 0
          }]);
        if (error) throw error;
      }

      setForm({ name: '', sku: '', location: '', description: '', prc_amount: '' });
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
              <X size={24} color={Theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.typeSelector}>
            <TouchableOpacity 
              style={[styles.typeBtn, type === 'item' && styles.typeBtnActive]} 
              onPress={() => setType('item')}
            >
              <Package size={20} color={type === 'item' ? Theme.colors.text.black : Theme.colors.text.secondary} />
              <Text style={[styles.typeBtnText, type === 'item' && styles.typeBtnTextActive]}>Item</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, type === 'folder' && styles.typeBtnActive]} 
              onPress={() => setType('folder')}
            >
              <FolderPlus size={20} color={type === 'folder' ? Theme.colors.text.black : Theme.colors.text.secondary} />
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
                <InputField 
                  label="Purchase Amount (PRC)" 
                  icon={ IndianRupee } 
                  value={form.prc_amount} 
                  onChangeText={(t: string) => setForm({...form, prc_amount: t})} 
                  keyboardType="numeric"
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
                <ActivityIndicator color={Theme.colors.text.black} />
              ) : (
                <>
                  <Save size={20} color={Theme.colors.text.black} />
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
