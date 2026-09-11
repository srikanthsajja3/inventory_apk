import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { FileDown, Upload, FileCheck, AlertCircle, Info, Download, Trash2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Theme.colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Theme.colors.text.primary,
    marginBottom: 24,
  },
  section: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      }
    })
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text.primary,
  },
  description: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
    marginBottom: 15,
    lineHeight: 20,
  },
  pickBtn: {
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  pickBtnText: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  preview: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.muted,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text.primary,
  },
  importBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  importBtnText: {
    color: Theme.colors.text.black,
    fontWeight: '700',
    fontSize: 12,
  },
  guide: {
    marginTop: 10,
    padding: 20,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    marginBottom: 12,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  guideText: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
  },
});

import { importCSVContent } from '../utils/csvImporter';

export default function ImportScreen() {
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '*/*'],
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setFile(res.assets[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setLoading(true);
      let csvContent = '';
      
      if (Platform.OS === 'web' && file.file) {
        csvContent = await file.file.text();
      } else {
        const response = await fetch(file.uri);
        csvContent = await response.text();
      }

      if (!csvContent.trim()) {
        Alert.alert('Empty File', 'The selected file contains no text data.');
        setLoading(false);
        return;
      }

      const res = await importCSVContent(csvContent);
      setLoading(false);

      if (res.success) {
        Alert.alert(
          'Import Successful 🎉',
          `${res.message} (${res.count} records processed)`,
          [{ text: 'OK', onPress: () => setFile(null) }]
        );
      } else {
        Alert.alert(
          'Import Notice',
          `${res.message}${res.errors ? '\n' + res.errors.join('\n') : ''}`
        );
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Import Failed', err.message || 'An error occurred during CSV import.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Bulk Import</Text>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FileDown size={24} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>1. Download Template</Text>
        </View>
        <Text style={styles.description}>
          Download our standard CSV template to ensure your data is formatted correctly before uploading.
        </Text>
        <TouchableOpacity style={[styles.importBtn, { alignSelf: 'flex-start', flexDirection: 'row', gap: 8 }]}>
          <Download size={18} color={Theme.colors.text.black} />
          <Text style={styles.importBtnText}>GET TEMPLATE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Upload size={24} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>2. Upload Data</Text>
        </View>
        <Text style={styles.description}>
          Select your formatted CSV or Excel file to begin the bulk inventory update.
        </Text>
        
        {!file ? (
          <TouchableOpacity style={styles.pickBtn} onPress={pickFile}>
            <Upload size={32} color={Theme.colors.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.pickBtnText}>SELECT FILE</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.preview}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.previewText} numberOfLines={1}>{file.name}</Text>
              <Text style={{ fontSize: 10, color: Theme.colors.text.muted }}>{(file.size! / 1024).toFixed(1)} KB</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setFile(null)}>
                <Trash2 size={20} color={Theme.colors.status.error} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.importBtn} onPress={handleImport} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color={Theme.colors.text.black} /> : <Text style={styles.importBtnText}>IMPORT</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.guide}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 }}>
          <Info size={20} color={Theme.colors.primary} />
          <Text style={styles.guideTitle}>Import Guidelines</Text>
        </View>
        
        <View style={styles.guideItem}>
          <FileCheck size={16} color={Theme.colors.status.success} />
          <Text style={styles.guideText}>Keep SKU/Barcode column unique</Text>
        </View>
        <View style={styles.guideItem}>
          <FileCheck size={16} color={Theme.colors.status.success} />
          <Text style={styles.guideText}>Use grams for all weight fields</Text>
        </View>
        <View style={styles.guideItem}>
          <AlertCircle size={16} color={Theme.colors.primary} />
          <Text style={styles.guideText}>Max 500 items per upload</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
