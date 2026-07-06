import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, Image, Platform, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { X, Check, RotateCw, ZoomIn, ZoomOut, Crop } from 'lucide-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { Theme } from '../theme';

interface ImageCropModalProps {
  isVisible: boolean;
  imageUri: string;
  onClose: () => void;
  onCropCompleted: (croppedUri: string) => void;
}

const CROP_BOX_SIZE = 280; // Size of the square crop box

export default function ImageCropModal({ isVisible, imageUri: initialImageUri, onClose, onCropCompleted }: ImageCropModalProps) {
  const [imageUri, setImageUri] = useState(initialImageUri);
  const [origDimensions, setOrigDimensions] = useState({ width: 0, height: 0 });
  const [dispDimensions, setDispDimensions] = useState({ width: 0, height: 0 });
  
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropping, setCropping] = useState(false);
  
  const lastTouch = useRef({ x: 0, y: 0 });
  const S = CROP_BOX_SIZE;

  // Sync state if initialImageUri changes or modal is shown
  useEffect(() => {
    if (isVisible) {
      setImageUri(initialImageUri);
    }
  }, [isVisible, initialImageUri]);

  // Load image dimensions and calculate initial display size
  useEffect(() => {
    if (imageUri && isVisible) {
      Image.getSize(
        imageUri,
        (w, h) => {
          setOrigDimensions({ width: w, height: h });
          setZoom(1);

          // Calculate initial display dimensions to fit image's smaller dimension to CROP_BOX_SIZE
          let wDisp = 0;
          let hDisp = 0;
          if (w >= h) {
            // Landscape: height matches crop box
            hDisp = S;
            wDisp = S * (w / h);
          } else {
            // Portrait: width matches crop box
            wDisp = S;
            hDisp = S * (h / w);
          }

          setDispDimensions({ width: wDisp, height: hDisp });
          // Center the image in the crop box initially
          setPan({
            x: (S - wDisp) / 2,
            y: (S - hDisp) / 2
          });
        },
        (err) => {
          console.error('Error fetching image size:', err);
          Alert.alert('Error', 'Unable to load image dimensions.');
        }
      );
    }
  }, [imageUri, isVisible]);

  // Clamp pan offsets so the image always covers the entire crop box
  const clampPan = (x: number, y: number, currentZoom: number) => {
    const W = dispDimensions.width * currentZoom;
    const H = dispDimensions.height * currentZoom;
    
    // Constraints: image must cover S x S box
    // x must be between [S - W, 0]
    // y must be between [S - H, 0]
    const clampedX = Math.min(0, Math.max(S - W, x));
    const clampedY = Math.min(0, Math.max(S - H, y));
    
    return { x: clampedX, y: clampedY };
  };

  const handleTouchStart = (e: any) => {
    const touch = e.nativeEvent.touches[0];
    if (touch) {
      lastTouch.current = { x: touch.pageX, y: touch.pageY };
    }
  };

  const handleTouchMove = (e: any) => {
    const touch = e.nativeEvent.touches[0];
    if (!touch || dispDimensions.width === 0) return;

    const dx = touch.pageX - lastTouch.current.x;
    const dy = touch.pageY - lastTouch.current.y;
    lastTouch.current = { x: touch.pageX, y: touch.pageY };

    setPan((prev) => {
      const nextX = prev.x + dx;
      const nextY = prev.y + dy;
      return clampPan(nextX, nextY, zoom);
    });
  };

  const handleZoomChange = (newZoom: number) => {
    const z = Math.min(4, Math.max(1, newZoom));
    setZoom(z);
    setPan((prev) => {
      return clampPan(prev.x, prev.y, z);
    });
  };

  const handleRotate = async () => {
    try {
      setCropping(true);
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ rotate: 90 }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImageUri(result.uri);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to rotate image: ' + err.message);
    } finally {
      setCropping(false);
    }
  };

  const handleCrop = async () => {
    if (origDimensions.width === 0 || origDimensions.height === 0) {
      Alert.alert('Error', 'Image details are still loading.');
      return;
    }

    try {
      setCropping(true);

      const W = dispDimensions.width * zoom;
      const H = dispDimensions.height * zoom;

      // Scale factor mapping original image resolution to rendered screen size
      const scale = W / origDimensions.width;

      // Calculate crop origin on original image (pan values are negative/offset relative to crop box)
      const originX = Math.round(-pan.x / scale);
      const originY = Math.round(-pan.y / scale);

      // Crop width and height in original pixels
      const cropW = Math.round(S / scale);
      const cropH = Math.round(S / scale);

      // Clamping to original image dimensions to prevent any OOB errors from rounding
      const finalOriginX = Math.max(0, Math.min(origDimensions.width - cropW, originX));
      const finalOriginY = Math.max(0, Math.min(origDimensions.height - cropH, originY));
      const finalCropW = Math.min(cropW, origDimensions.width - finalOriginX);
      const finalCropH = Math.min(cropH, origDimensions.height - finalOriginY);

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{
          crop: {
            originX: finalOriginX,
            originY: finalOriginY,
            width: finalCropW,
            height: finalCropH
          }
        }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      onCropCompleted(result.uri);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to crop image: ' + err.message);
    } finally {
      setCropping(false);
    }
  };

  // Custom Slider implementation
  const Slider = ({ val, onChange }: { val: number; onChange: (v: number) => void }) => {
    const [sliderWidth, setSliderWidth] = useState(200);
    const min = 1;
    const max = 4;
    const progress = (val - min) / (max - min);

    const handleSliderTouch = (e: any) => {
      const x = e.nativeEvent.locationX;
      const fraction = Math.min(1, Math.max(0, x / sliderWidth));
      const newVal = min + fraction * (max - min);
      onChange(newVal);
    };

    return (
      <View style={styles.sliderWrapper}>
        <TouchableOpacity onPress={() => onChange(val - 0.25)} style={styles.sliderIconBtn}>
          <ZoomOut size={18} color="#94a3b8" />
        </TouchableOpacity>
        <View 
          style={styles.sliderContainer}
          onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width || 200)}
          onTouchStart={handleSliderTouch}
          onTouchMove={handleSliderTouch}
        >
          <View style={styles.sliderTrack} />
          <View style={[styles.sliderFill, { width: `${progress * 100}%` }]} />
          <View style={[styles.sliderThumb, { left: `${progress * 100}%` }]} />
        </View>
        <TouchableOpacity onPress={() => onChange(val + 0.25)} style={styles.sliderIconBtn}>
          <ZoomIn size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={isVisible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Crop size={20} color={Theme.colors.primary} />
              <Text style={styles.modalTitle}>Crop Image</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={cropping}>
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Editor Body */}
          <View style={styles.editorBody}>
            {origDimensions.width === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>Loading image...</Text>
              </View>
            ) : (
              <View style={styles.editorWrapper}>
                {/* Crop Box Container */}
                <View 
                  style={styles.cropBox}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                >
                  {/* Image rendered inside, positioned absolutely */}
                  <Image
                    source={{ uri: imageUri }}
                    style={{
                      position: 'absolute',
                      width: dispDimensions.width * zoom,
                      height: dispDimensions.height * zoom,
                      left: pan.x,
                      top: pan.y,
                    }}
                    resizeMode="stretch"
                  />
                  
                  {/* Dotted Grid lines overlays to simulate real camera crop editor */}
                  <View style={styles.gridOverlay} pointerEvents="none">
                    <View style={[styles.gridLineHorizontal, { top: '33.33%' }]} />
                    <View style={[styles.gridLineHorizontal, { top: '66.66%' }]} />
                    <View style={[styles.gridLineVertical, { left: '33.33%' }]} />
                    <View style={[styles.gridLineVertical, { left: '66.66%' }]} />
                  </View>
                </View>
                
                <Text style={styles.hintText}>Drag to pan, use slider below to zoom</Text>

                {/* Slider */}
                <Slider val={zoom} onChange={handleZoomChange} />

                {/* Quick actions row */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity onPress={handleRotate} style={styles.actionBtn} disabled={cropping}>
                    <RotateCw size={18} color={Theme.colors.text.primary} />
                    <Text style={styles.actionBtnText}>Rotate 90°</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={onClose} 
              style={[styles.footerBtn, styles.cancelBtn]} 
              disabled={cropping}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleCrop} 
              style={[styles.footerBtn, styles.saveBtn]} 
              disabled={cropping || origDimensions.width === 0}
            >
              {cropping ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Check size={18} color="#000000" />
                  <Text style={styles.saveBtnText}>Apply Crop</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)', // Sleek dark overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b', // Modern dark slate
    borderRadius: Theme.radius.xl,
    width: '90%',
    maxWidth: 400,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  modalTitle: {
    fontSize: Theme.typography.size.md,
    fontWeight: '800',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  editorBody: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 380,
  },
  editorWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  cropBox: {
    width: CROP_BOX_SIZE,
    height: CROP_BOX_SIZE,
    overflow: 'hidden',
    borderRadius: Theme.radius.md,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  hintText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: Theme.spacing.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  sliderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginTop: Theme.spacing.md,
    gap: 12,
  },
  sliderContainer: {
    width: 200,
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
  },
  sliderFill: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.primary,
  },
  sliderThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Theme.colors.primary,
    borderWidth: 2,
    borderColor: '#ffffff',
    transform: [{ translateX: -8 }],
  },
  sliderIconBtn: {
    padding: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Theme.spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#334155',
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: '#475569',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: Theme.typography.size.sm,
    fontWeight: '600',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.lg,
    borderTopWidth: 1,
    borderColor: '#334155',
    paddingTop: Theme.spacing.md,
  },
  footerBtn: {
    flex: 1,
    height: 44,
    borderRadius: Theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  cancelBtnText: {
    color: '#ffffff',
    fontSize: Theme.typography.size.sm,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: Theme.typography.size.sm,
    fontWeight: '800',
  },
});
