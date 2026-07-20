import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { X, Save, Package, Hash, Tag, MapPin, FolderPlus, Edit3, Image as ImageIcon, Camera, Scale, IndianRupee, FileText, Ruler, Info } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../../supabase';
import { decode } from 'base64-arraybuffer';
import { Theme } from '../theme';
import ImageCropModal from './ImageCropModal';
import { deleteImageFromStorage } from '../utils/images';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: Theme.radius.xl,
    borderTopRightRadius: Theme.radius.xl,
    height: '90%',
    width: '100%',
    padding: Theme.spacing.lg,
    ...Platform.select({
      web: {
        maxWidth: 600,
        height: '85%',
        borderRadius: Theme.radius.xl,
        borderWidth: 1,
        borderColor: Theme.colors.border,
      }
    })
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
  imagePickerSection: {
    marginBottom: Theme.spacing.lg,
  },
  imagesScrollView: {
    flexDirection: 'row',
    paddingBottom: 10,
  },
  imagePickerWrapper: {
    width: 80,
    height: 80,
    borderRadius: Theme.radius.md,
    marginRight: 12,
    position: 'relative',
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  imagePickerSmall: {
    width: 80,
    height: 80,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.border,
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
    fontSize: 9,
    color: Theme.colors.text.muted,
    fontWeight: '700',
  },
  removeImageSmall: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Theme.colors.status.error,
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
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    gap: 10,
  },
  sectionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: Theme.typography.size.sm,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.border,
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.text.secondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.sm,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  inputIcon: {
    marginRight: 8,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: Theme.typography.size.md,
    color: Theme.colors.text.primary,
    fontWeight: '500',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  footer: {
    paddingTop: Theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
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

const SectionHeader = ({ title, icon: Icon }: any) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIconContainer}>
      <Icon size={16} color={Theme.colors.primary} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionLine} />
  </View>
);

const InputField = ({ label, icon: Icon, value, onChangeText, keyboardType = 'default', multiline = false, placeholder }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, multiline && styles.textAreaWrapper]}>
      {Icon && <Icon size={18} color={Theme.colors.text.muted} style={styles.inputIcon} />}
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
        placeholderTextColor={Theme.colors.text.muted}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  </View>
);

interface ItemFolderModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  currentFolderId: string | null;
  initialData?: any; 
}

export default function ItemFolderModal({ isVisible, onClose, onSave, currentFolderId, initialData }: ItemFolderModalProps) {
  const [type, setType] = useState<'item' | 'folder'>('item');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<any[]>([]); 
  const [isCropVisible, setIsCropVisible] = useState(false);
  const [cropImageUri, setCropImageUri] = useState('');
  const [cropIndex, setCropIndex] = useState<number | null>(null); 
  const [form, setForm] = useState({
    name: '',
    sku: '',
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
    igi_fee: '0',
    prc_amount: '0'
  });

  const isEdit = !!initialData && !!initialData.id;

  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        setType(initialData.sku !== undefined || initialData.barcode !== undefined ? 'item' : 'folder');
        setForm({
          name: initialData.name || '',
          sku: initialData.sku || '',
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
          igi_fee: String(initialData.igi_fee || 0),
          prc_amount: String(initialData.prc_amount || 0)
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
          igi_fee: '0',
          prc_amount: '0'
        });
        setImages([]);
        setType('item');
      }
    }
  }, [isVisible, initialData]);

  const handleImageAction = async (index?: number) => {
    if (index === undefined) {
      if (Platform.OS === 'web') {
        await openLibrary();
        return;
      }

      Alert.alert(
        'Select Image Source',
        'Choose how you want to add an image',
        [
          {
            text: 'Camera',
            onPress: () => openCamera(),
          },
          {
            text: 'Photo Library',
            onPress: () => openLibrary(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    const rotateImage = async (idx: number) => {
      try {
        const result = await ImageManipulator.manipulateAsync(
          images[idx].uri,
          [{ rotate: 90 }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        const updatedImages = [...images];
        updatedImages[idx] = { uri: result.uri };
        setImages(updatedImages);
      } catch (err: any) {
        Alert.alert('Error', 'Failed to rotate image: ' + err.message);
      }
    };

    if (Platform.OS === 'web') {
      setCropImageUri(images[index].uri);
      setCropIndex(index);
      setIsCropVisible(true);
      return;
    }

    Alert.alert(
      'Image Options',
      'Choose an action for this image',
      [
        {
          text: 'Crop Image',
          onPress: () => {
            setCropImageUri(images[index].uri);
            setCropIndex(index);
            setIsCropVisible(true);
          },
        },
        {
          text: 'Rotate 90°',
          onPress: () => rotateImage(index),
        },
        {
          text: 'Replace Image',
          onPress: () => {
            Alert.alert(
              'Select Image Source',
              'Choose how you want to replace this image',
              [
                { text: 'Camera', onPress: () => openCamera(index) },
                { text: 'Photo Library', onPress: () => openLibrary(index) },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          },
        },
        {
          text: 'Delete Image',
          onPress: () => {
            setImages(images.filter((_, i) => i !== index));
          },
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async (index?: number) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      processImageResult(result, index);
    }
  };

  const openLibrary = async (index?: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need photo library permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      processImageResult(result, index);
    }
  };

  const processImageResult = (result: ImagePicker.ImagePickerResult, index?: number) => {
    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const newImage = {
      uri: result.assets[0].uri,
      base64: result.assets[0].base64
    };
    
    if (index !== undefined) {
      const updatedImages = [...images];
      updatedImages[index] = newImage;
      setImages(updatedImages);
    } else {
      setImages([...images, newImage]);
    }
  };

  const uploadImages = async (imageAssets: any[]): Promise<{ urls: string[], thumbnails: string[] }> => {
    const uploadedUrls: string[] = [];
    const thumbnailUrls: string[] = [];

    for (const asset of imageAssets) {
      if (asset.uri.includes('supabase.co')) {
        uploadedUrls.push(asset.uri);
        // Attempt to find existing thumbnail if editing
        const existingIdx = initialData?.image_urls?.indexOf(asset.uri);
        if (existingIdx !== -1 && initialData?.thumbnail_urls?.[existingIdx]) {
          thumbnailUrls.push(initialData.thumbnail_urls[existingIdx]);
        } else {
          thumbnailUrls.push(asset.uri); // Fallback to original if no thumbnail exists
        }
        continue;
      }

      try {
        // 1. Prepare Original (Compressed) and request base64
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1024 } }], 
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        // 2. Prepare Thumbnail (Small) and request base64
        const thumbnailImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 200 } }], 
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}_${randomStr}.jpg`;
        const thumbFileName = `thumb_${timestamp}_${randomStr}.jpg`;

        const uploadFile = async (uri: string, base64Str: string | undefined, name: string, bucket: string) => {
          const filePath = `items/${name}`;
          let fileData;
          const contentType = 'image/jpeg';

          if (Platform.OS === 'web') {
            const res = await fetch(uri);
            fileData = await res.blob();
          } else {
            if (base64Str) {
              fileData = decode(base64Str);
            } else {
              const res = await fetch(uri);
              fileData = await res.blob();
            }
          }

          const { error } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileData, {
              contentType: contentType,
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          return publicUrl;
        };

        const [publicUrl, thumbUrl] = await Promise.all([
          uploadFile(manipulatedImage.uri, manipulatedImage.base64, fileName, 'item-images'),
          uploadFile(thumbnailImage.uri, thumbnailImage.base64, thumbFileName, 'item-thumbnails')
        ]);

        uploadedUrls.push(publicUrl);
        thumbnailUrls.push(thumbUrl);
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    }

    return { urls: uploadedUrls, thumbnails: thumbnailUrls };
  };

  const handleSave = async () => {
    if (!form.name) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      setLoading(true);
      
      const { urls, thumbnails } = await uploadImages(images);

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
          location: form.location || null,
          description: form.description || null,
          image_url: urls[0] || null,
          image_urls: urls,
          thumbnail_url: thumbnails[0] || null,
          thumbnail_urls: thumbnails,
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
          igi_fee: parseFloat(form.igi_fee) || 0,
          prc_amount: parseFloat(form.prc_amount) || 0
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

      // Clean up orphaned images from Supabase Storage
      if (isEdit && type === 'item') {
        const initialUrls = initialData.image_urls || (initialData.image_url ? [initialData.image_url] : []);
        const initialThumbs = initialData.thumbnail_urls || (initialData.thumbnail_url ? [initialData.thumbnail_url] : []);

        const urlsToDelete = initialUrls.filter((url: string) => !urls.includes(url));
        const thumbsToDelete = initialThumbs.filter((url: string) => !thumbnails.includes(url));

        Promise.all([
          ...urlsToDelete.map((url: string) => deleteImageFromStorage(url, 'item-images')),
          ...thumbsToDelete.map((url: string) => deleteImageFromStorage(url, 'item-thumbnails'))
        ]).catch(err => console.error('Error during storage cleanup:', err));
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Supabase save error:', JSON.stringify(error, null, 2));
      Alert.alert('Error', error.message || 'Unknown error occurred while saving.');
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
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => handleImageAction(index)}>
                          <Image source={{ uri: img.uri }} style={styles.previewImage} resizeMode="contain" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.removeImageSmall} 
                          onPress={() => setImages(images.filter((_, i) => i !== index))}
                        >
                          <X size={12} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity style={styles.imagePickerSmall} onPress={() => handleImageAction()}>
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
                      label="Purity" 
                      icon={Tag} 
                      value={form.purity} 
                      onChangeText={(t: string) => setForm({...form, purity: t})} 
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
                      label="PRC Amount" 
                      icon={IndianRupee} 
                      value={form.prc_amount} 
                      onChangeText={(t: string) => setForm({...form, prc_amount: t})} 
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

      <ImageCropModal
        isVisible={isCropVisible}
        imageUri={cropImageUri}
        onClose={() => {
          setIsCropVisible(false);
          setCropImageUri('');
          setCropIndex(null);
        }}
        onCropCompleted={(croppedUri) => {
          if (cropIndex !== null) {
            const updatedImages = [...images];
            updatedImages[cropIndex] = { uri: croppedUri };
            setImages(updatedImages);
          }
          setIsCropVisible(false);
          setCropImageUri('');
          setCropIndex(null);
        }}
      />
    </Modal>
  );
}
