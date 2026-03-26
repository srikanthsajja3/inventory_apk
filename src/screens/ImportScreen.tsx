import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { FileUp, Image, CheckCircle2, XCircle, ChevronRight, Package } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../../supabase';

export default function ImportScreen() {
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [photosToMatch, setPhotosToMatch] = useState<any[]>([]);

  const handlePickCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/comma-separated-values',
      });

      if (!result.canceled) {
        setLoading(true);
        const file = result.assets[0];
        let text = '';

        if (Platform.OS === 'web') {
          const response = await fetch(file.uri);
          text = await response.text();
        } else {
          text = await FileSystem.readAsStringAsync(file.uri);
        }
        
        // Robust CSV Parser for Jewelry Data
        const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
        const dataRows = rows.slice(1); // Skip header

        const items = dataRows.map(row => {
          // Regex to split by comma but ignore commas inside quotes
          const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => 
            col.replace(/^"|"$/g, '').trim()
          );

          // Helper to clean numeric strings (removes ₹, @, commas, /G)
          const cleanNum = (val: string) => {
            if (!val || val.trim() === '') return 0;
            const cleaned = val.replace(/[₹,]/g, '').replace(/@/g, '').split('/')[0];
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
          };

          // Helper to parse dates (D/M/YYYY to YYYY-MM-DD)
          const parseDate = (val: string) => {
            if (!val || val.trim() === '') return null;
            const parts = val.trim().split('/');
            if (parts.length === 3) {
              // Ensure YYYY-MM-DD format
              const d = parts[0].padStart(2, '0');
              const m = parts[1].padStart(2, '0');
              const y = parts[2];
              return `${y}-${m}-${d}`;
            }
            return val;
          };

          return {
            name: `${cols[13] || 'Item'} ${cols[0] || ''}`.trim(), 
            label_no: cols[0] || null,
            sku: cols[0] || null,
            quantity: 1,
            pcs: parseInt(cols[1]) || 0,
            purity: cols[2] || null,
            gross_wt: cleanNum(cols[3]),
            net_wt: cleanNum(cols[4]),
            dai_wt: cleanNum(cols[5]),
            dai_pcs: parseInt(cols[6]) || 0,
            clr_stone_wt: cleanNum(cols[7]),
            clr_stone_pcs: parseInt(cols[8]) || 0,
            wastage: cleanNum(cols[9]),
            labour_amt: cleanNum(cols[10]),
            labour_rate: cleanNum(cols[11]),
            location: cols[12] || null,
            doc_no: cols[14] || null,
            doc_date: parseDate(cols[15]),
            supplier_name: cols[16] || null,
            size: cols[17] || null,
            labeling_date: parseDate(cols[18]),
            purch_wastage_rate: cleanNum(cols[19]),
            quality: cols[20] || null,
            other_charges: cleanNum(cols[21]),
            dia_purchase_amt: cleanNum(cols[22]),
            stone_purchase_amt: cleanNum(cols[23]),
            huid: cols[24] || null
          };
        }).filter(item => item.label_no);

        console.log('Sample Item for Import:', items[0]);
        setCsvData(items);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to parse jewelry CSV: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportCSV = async () => {
    if (csvData.length === 0) return;

    const performImport = async () => {
      try {
        setLoading(true);
        
        const { error } = await supabase
          .from('items')
          .upsert(csvData, { 
            onConflict: 'sku',
            ignoreDuplicates: false 
          });
        
        if (error) throw error;
        
        Alert.alert('Success', `Successfully imported/updated ${csvData.length} items.`);
        setCsvData([]);
      } catch (error: any) {
        console.error('Import Error Details:', error);
        const errorMsg = error.message || JSON.stringify(error);
        const errorDetail = error.details || '';
        const errorHint = error.hint || '';
        
        Alert.alert(
          'Import Failed', 
          `${errorMsg}\n\n${errorDetail}\n\n${errorHint}\n\nHint: Ensure you have run the SQL migration in Supabase Dashboard.`
        );
      } finally {
        setLoading(false);
      }
    };

    const message = `Are you sure you want to import ${csvData.length} items? This will update existing items with the same Label No.`;

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        performImport();
      }
    } else {
      Alert.alert(
        'Confirm Import',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Import', onPress: performImport }
        ]
      );
    }
  };

  const handlePickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotosToMatch(result.assets);
    }
  };

  const handleSyncPhotos = async () => {
    if (photosToMatch.length === 0) return;

    try {
      setLoading(true);
      let matched = 0;

      for (const photo of photosToMatch) {
        // Filename is the match key (e.g., "iPhone 15.jpg" matches "iPhone 15")
        const fileName = photo.fileName || photo.uri.split('/').pop() || '';
        const productName = fileName.split('.')[0];

        // 1. Find the item
        const { data: item } = await supabase
          .from('items')
          .select('id')
          .eq('name', productName)
          .single();

        if (item) {
          // 2. Upload to Storage
          const formData = new FormData();
          formData.append('file', {
            uri: photo.uri,
            name: fileName,
            type: photo.mimeType || 'image/jpeg',
          } as any);

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('item-images')
            .upload(`${item.id}/${fileName}`, formData as any);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('item-images')
              .getPublicUrl(`${item.id}/${fileName}`);

            // 3. Update Item image_url
            await supabase
              .from('items')
              .update({ image_url: publicUrl })
              .eq('id', item.id);
            
            matched++;
          }
        }
      }

      Alert.alert('Sync Complete', `Matched and uploaded ${matched} photos.`);
      setPhotosToMatch([]);
    } catch (error: any) {
      Alert.alert('Sync Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Data Entry Hub</Text>
      
      {/* CSV Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FileUp size={24} color="#6366f1" />
          <Text style={styles.sectionTitle}>Bulk CSV Import</Text>
        </View>
        
        <TouchableOpacity style={styles.pickBtn} onPress={handlePickCSV}>
          <Text style={styles.pickBtnText}>Select Excel/CSV File</Text>
        </TouchableOpacity>

        {csvData.length > 0 && (
          <View style={styles.preview}>
            <Text style={styles.previewText}>{csvData.length} items detected</Text>
            <TouchableOpacity style={styles.importBtn} onPress={handleImportCSV}>
              <Text style={styles.importBtnText}>Confirm Import</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Photo Matching Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Image size={24} color="#10b981" />
          <Text style={styles.sectionTitle}>The Photo Sync</Text>
        </View>
        
        <Text style={styles.description}>
          Select a folder of photos. The app will automatically match them to product names.
        </Text>

        <TouchableOpacity style={[styles.pickBtn, { borderColor: '#10b981' }]} onPress={handlePickPhotos}>
          <Text style={[styles.pickBtnText, { color: '#10b981' }]}>Pick Gallery Photos</Text>
        </TouchableOpacity>

        {photosToMatch.length > 0 && (
          <View style={styles.preview}>
            <Text style={styles.previewText}>{photosToMatch.length} photos selected</Text>
            <TouchableOpacity 
              style={[styles.importBtn, { backgroundColor: '#10b981' }]} 
              onPress={handleSyncPhotos}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.importBtnText}>Start Auto-Matching</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.guide}>
        <Text style={styles.guideTitle}>How it works:</Text>
        <View style={styles.guideItem}>
          <CheckCircle2 size={16} color="#6366f1" />
          <Text style={styles.guideText}>Import CSV to create "Ghost Records"</Text>
        </View>
        <View style={styles.guideItem}>
          <CheckCircle2 size={16} color="#6366f1" />
          <Text style={styles.guideText}>Pick photos from gallery</Text>
        </View>
        <View style={styles.guideItem}>
          <CheckCircle2 size={16} color="#6366f1" />
          <Text style={styles.guideText}>Filenames must match Product Names</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
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
    color: '#1e293b',
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 15,
    lineHeight: 20,
  },
  pickBtn: {
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  pickBtnText: {
    color: '#6366f1',
    fontWeight: '700',
  },
  preview: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 12,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  importBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  importBtnText: {
    color: 'white',
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
    color: '#1e293b',
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
    color: '#64748b',
  },
});
