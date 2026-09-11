import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, Image, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { X, Check, RotateCw, ZoomIn, ZoomOut, Crop, SkipForward, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

interface BatchThumbnailCropperModalProps {
  isVisible: boolean;
  onClose: () => void;
  onRefreshInventory?: () => void;
}

const CROP_BOX_SIZE = 280; // Size of square crop window

export default function BatchThumbnailCropperModal({ isVisible, onClose, onRefreshInventory }: BatchThumbnailCropperModalProps) {
  const [itemsQueue, setItemsQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [savingItem, setSavingItem] = useState(false);
  const [filterMode, setFilterMode] = useState<'missing' | 'all'>('missing');
  const [completedCount, setCompletedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Current Item State
  const currentItem = itemsQueue[currentIndex] || null;
  const rawImageUri = currentItem?.image_url || (Array.isArray(currentItem?.image_urls) ? currentItem.image_urls[0] : null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Crop & Manipulation State
  const [origDimensions, setOrigDimensions] = useState({ width: 0, height: 0 });
  const [dispDimensions, setDispDimensions] = useState({ width: 0, height: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const lastTouch = useRef({ x: 0, y: 0 });
  const S = CROP_BOX_SIZE;

  // Fetch Queue when modal becomes visible or filterMode changes
  useEffect(() => {
    if (isVisible) {
      fetchItemsQueue();
    } else {
      resetState();
    }
  }, [isVisible, filterMode]);

  const resetState = () => {
    setItemsQueue([]);
    setCurrentIndex(0);
    setCompletedCount(0);
    setIsFinished(false);
    setImageUri(null);
  };

  const fetchItemsQueue = async () => {
    try {
      setLoadingQueue(true);
      const { data, error } = await (supabase.from('items') as any).select('*');

      if (error) throw error;

      const filtered = (data || []).filter((item: any) => {
        const hasImage = (item.image_url && item.image_url.trim().length > 0) || 
                         (Array.isArray(item.image_urls) && item.image_urls.length > 0);
        const hasThumb = (item.thumbnail_url && item.thumbnail_url.trim().length > 0) || 
                         (Array.isArray(item.thumbnail_urls) && item.thumbnail_urls.length > 0);

        if (filterMode === 'missing') {
          return hasImage && !hasThumb;
        }
        return hasImage;
      });

      setItemsQueue(filtered);
      setCurrentIndex(0);
      setCompletedCount(0);
      setIsFinished(filtered.length === 0);
    } catch (err: any) {
      console.error('Error fetching batch queue:', err);
      Alert.alert('Error', 'Unable to fetch items queue for thumbnail cropping.');
    } finally {
      setLoadingQueue(false);
    }
  };

  // Convert remote image URL to blob/data URL on web to bypass CORS canvas issues
  useEffect(() => {
    let isMounted = true;
    if (rawImageUri && isVisible && !isFinished) {
      if (Platform.OS === 'web') {
        fetch(rawImageUri)
          .then(res => res.blob())
          .then(blob => {
            if (isMounted) {
              const objectUrl = URL.createObjectURL(blob);
              setImageUri(objectUrl);
            }
          })
          .catch(() => {
            if (isMounted) setImageUri(rawImageUri);
          });
      } else {
        setImageUri(rawImageUri);
      }
    }
    return () => {
      isMounted = false;
    };
  }, [rawImageUri, isVisible, currentIndex, isFinished]);

  // Load image dimensions when imageUri changes
  useEffect(() => {
    if (imageUri && isVisible && !isFinished) {
      Image.getSize(
        imageUri,
        (w, h) => {
          setOrigDimensions({ width: w, height: h });
          setZoom(1);

          let wDisp = 0;
          let hDisp = 0;
          if (w >= h) {
            hDisp = S;
            wDisp = S * (w / h);
          } else {
            wDisp = S;
            hDisp = S * (h / w);
          }

          setDispDimensions({ width: wDisp, height: hDisp });
          setPan({
            x: (S - wDisp) / 2,
            y: (S - hDisp) / 2
          });
        },
        (err) => {
          console.error('Error getting image dimensions:', err);
        }
      );
    }
  }, [imageUri, isVisible, currentIndex, isFinished]);

  const clampPan = (x: number, y: number, currentZoom: number) => {
    const W = dispDimensions.width * currentZoom;
    const H = dispDimensions.height * currentZoom;
    const clampedX = Math.min(0, Math.max(S - W, x));
    const clampedY = Math.min(0, Math.max(S - H, y));
    return { x: clampedX, y: clampedY };
  };

  const handleTouchStart = (e: any) => {
    const touch = e.nativeEvent.touches[0] || (e.nativeEvent as any);
    if (touch) {
      lastTouch.current = { x: touch.pageX || touch.clientX, y: touch.pageY || touch.clientY };
    }
  };

  const handleTouchMove = (e: any) => {
    const touch = e.nativeEvent.touches[0] || (e.nativeEvent as any);
    if (!touch || dispDimensions.width === 0) return;

    const pageX = touch.pageX || touch.clientX;
    const pageY = touch.pageY || touch.clientY;

    const dx = pageX - lastTouch.current.x;
    const dy = pageY - lastTouch.current.y;
    lastTouch.current = { x: pageX, y: pageY };

    setPan(prev => clampPan(prev.x + dx, prev.y + dy, zoom));
  };

  const handleZoom = (factor: number) => {
    const newZoom = Math.min(3, Math.max(1, zoom * factor));
    setZoom(newZoom);
    setPan(prev => clampPan(prev.x, prev.y, newZoom));
  };

  const handleRotate = async () => {
    if (!imageUri) return;
    try {
      setSavingItem(true);
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ rotate: 90 }],
        { format: ImageManipulator.SaveFormat.JPEG }
      );
      setImageUri(result.uri);
    } catch (e) {
      console.error('Rotate error:', e);
    } finally {
      setSavingItem(false);
    }
  };

  const advanceNext = () => {
    if (currentIndex + 1 < itemsQueue.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      if (onRefreshInventory) onRefreshInventory();
    }
  };

  const handleSaveAndNext = async () => {
    if (!currentItem || !imageUri) return;

    try {
      setSavingItem(true);

      const W = dispDimensions.width * zoom;
      const scale = W / (origDimensions.width || 1);

      const cropX = Math.round((-pan.x) / scale);
      const cropY = Math.round((-pan.y) / scale);
      const cropSize = Math.round(S / scale);

      const boundedOriginX = Math.max(0, Math.min(origDimensions.width - 1, cropX));
      const boundedOriginY = Math.max(0, Math.min(origDimensions.height - 1, cropY));
      const boundedWidth = Math.min(origDimensions.width - boundedOriginX, cropSize);
      const boundedHeight = Math.min(origDimensions.height - boundedOriginY, cropSize);

      // Crop & Resize thumbnail to 300x300
      const cropped = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.max(0, boundedOriginX),
              originY: Math.max(0, boundedOriginY),
              width: Math.max(10, boundedWidth),
              height: Math.max(10, boundedHeight),
            }
          },
          { resize: { width: 300, height: 300 } }
        ],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.85, base64: true }
      );

      let publicUrl = cropped.uri;
      const fileName = `thumbnails/${currentItem.id}_${Date.now()}.jpg`;

      // Web & Native upload handling
      if (Platform.OS === 'web') {
        const response = await fetch(cropped.uri);
        const blob = await response.blob();
        
        const { error: uploadErr } = await supabase.storage
          .from('item-images')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('item-images')
            .getPublicUrl(fileName);
          if (urlData?.publicUrl) publicUrl = urlData.publicUrl;
        } else {
          console.error('Web upload error:', uploadErr);
        }
      } else if (cropped.base64) {
        const { error: uploadErr } = await supabase.storage
          .from('item-images')
          .upload(fileName, decode(cropped.base64), {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('item-images')
            .getPublicUrl(fileName);
          if (urlData?.publicUrl) publicUrl = urlData.publicUrl;
        }
      }

      // Update item thumbnail_url in database
      const { error: dbError } = await (supabase.from('items') as any)
        .update({ 
          thumbnail_url: publicUrl,
          thumbnail_urls: [publicUrl]
        })
        .eq('id', currentItem.id);

      if (dbError) throw dbError;

      setCompletedCount(prev => prev + 1);
      advanceNext();
    } catch (err: any) {
      console.error('Error saving thumbnail:', err);
      Alert.alert('Save Error', err.message || 'Failed to save cropped thumbnail.');
    } finally {
      setSavingItem(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={22} color={Theme.colors.primary} />
              <Text style={styles.headerTitle}>Batch Thumbnail Cropper</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={Theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View style={styles.filterBar}>
            <TouchableOpacity 
              style={[styles.filterTab, filterMode === 'missing' && styles.filterTabActive]}
              onPress={() => setFilterMode('missing')}
            >
              <Text style={[styles.filterTabText, filterMode === 'missing' && styles.filterTabTextActive]}>
                Missing Thumbnails
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, filterMode === 'all' && styles.filterTabActive]}
              onPress={() => setFilterMode('all')}
            >
              <Text style={[styles.filterTabText, filterMode === 'all' && styles.filterTabTextActive]}>
                All Images
              </Text>
            </TouchableOpacity>
          </View>

          {loadingQueue ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
              <Text style={styles.loadingText}>Loading queue...</Text>
            </View>
          ) : isFinished || itemsQueue.length === 0 ? (
            <View style={styles.centerBox}>
              <CheckCircle2 size={56} color={Theme.colors.status.success || '#10b981'} />
              <Text style={styles.finishTitle}>All Set!</Text>
              <Text style={styles.finishSubtext}>
                {completedCount > 0 
                  ? `Successfully cropped and updated ${completedCount} thumbnail(s).` 
                  : 'No items found matching the selected filter.'}
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
                <Text style={styles.primaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
              {/* Item Info Banner */}
              <View style={styles.itemBanner}>
                <View style={styles.itemMetaRow}>
                  <Text style={styles.queueCounter}>
                    Product {currentIndex + 1} of {itemsQueue.length}
                  </Text>
                  <Text style={styles.skuBadge}>{currentItem?.sku || 'No SKU'}</Text>
                </View>
                <Text style={styles.itemName} numberOfLines={1}>
                  {currentItem?.name || 'Item'}
                </Text>
              </View>

              {/* Crop Canvas */}
              <View style={styles.cropCanvasWrapper}>
                <View 
                  style={[styles.cropBox, { width: S, height: S }]}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                >
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={{
                        width: dispDimensions.width * zoom,
                        height: dispDimensions.height * zoom,
                        transform: [
                          { translateX: pan.x },
                          { translateY: pan.y }
                        ]
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <ActivityIndicator size="small" color={Theme.colors.primary} style={{ marginTop: 120 }} />
                  )}

                  {/* Crop Grid Overlay */}
                  <View style={styles.gridOverlay} pointerEvents="none">
                    <View style={styles.gridRow}>
                      <View style={styles.gridCell} />
                      <View style={styles.gridCell} />
                      <View style={styles.gridCell} />
                    </View>
                    <View style={styles.gridRow}>
                      <View style={styles.gridCell} />
                      <View style={styles.gridCell} />
                      <View style={styles.gridCell} />
                    </View>
                    <View style={styles.gridRow}>
                      <View style={styles.gridCell} />
                      <View style={styles.gridCell} />
                      <View style={styles.gridCell} />
                    </View>
                  </View>
                </View>

                {/* Controls Bar */}
                <View style={styles.controlsBar}>
                  <TouchableOpacity style={styles.controlIconBtn} onPress={() => handleZoom(1.2)}>
                    <ZoomIn size={20} color={Theme.colors.text.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.controlIconBtn} onPress={() => handleZoom(0.8)}>
                    <ZoomOut size={20} color={Theme.colors.text.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.controlIconBtn} onPress={handleRotate}>
                    <RotateCw size={20} color={Theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.skipBtn} onPress={advanceNext} disabled={savingItem}>
                  <SkipForward size={18} color={Theme.colors.text.secondary} />
                  <Text style={styles.skipBtnText}>Skip</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveNextBtn, savingItem && { opacity: 0.7 }]} 
                  onPress={handleSaveAndNext}
                  disabled={savingItem}
                >
                  {savingItem ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <>
                      <Check size={20} color="#000" />
                      <Text style={styles.saveNextBtnText}>Save & Next</Text>
                      <ChevronRight size={18} color="#000" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: Theme.typography.size.lg,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  closeBtn: {
    padding: 4,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.muted,
    padding: 3,
    borderRadius: Theme.radius.md,
    marginBottom: Theme.spacing.md,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Theme.radius.sm,
  },
  filterTabActive: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterTabText: {
    fontSize: Theme.typography.size.xs,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
  },
  filterTabTextActive: {
    color: Theme.colors.primary,
    fontWeight: '800',
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: Theme.typography.size.sm,
    color: Theme.colors.text.secondary,
  },
  finishTitle: {
    fontSize: Theme.typography.size.xl,
    fontWeight: '800',
    color: Theme.colors.text.primary,
    marginTop: 12,
  },
  finishSubtext: {
    fontSize: Theme.typography.size.sm,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
  },
  primaryBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: Theme.typography.size.md,
  },
  bodyContent: {
    alignItems: 'center',
  },
  itemBanner: {
    width: '100%',
    backgroundColor: Theme.colors.muted,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  itemMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  queueCounter: {
    fontSize: Theme.typography.size.xs,
    fontWeight: '800',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skuBadge: {
    fontSize: Theme.typography.size.xs,
    fontWeight: '700',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    color: Theme.colors.text.secondary,
  },
  itemName: {
    fontSize: Theme.typography.size.md,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  cropCanvasWrapper: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  cropBox: {
    backgroundColor: '#000000',
    overflow: 'hidden',
    borderRadius: Theme.radius.md,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  controlsBar: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
  controlIconBtn: {
    padding: 8,
    backgroundColor: Theme.colors.muted,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Theme.spacing.md,
  },
  skipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.muted,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 6,
  },
  skipBtnText: {
    fontSize: Theme.typography.size.sm,
    fontWeight: '700',
    color: Theme.colors.text.secondary,
  },
  saveNextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.primary,
    gap: 6,
  },
  saveNextBtnText: {
    fontSize: Theme.typography.size.md,
    fontWeight: '800',
    color: '#000000',
  },
});
