import React, { useState, useEffect } from 'react';
import { Modal, View, Image, StyleSheet, TouchableOpacity, Text, Dimensions, Platform } from 'react-native';
import { getOptimizedImageUrl } from '../utils/images';
import { Theme } from '../theme';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

interface ImageModalProps {
  visible: boolean;
  onClose: () => void;
  urls: string[];
  initialIndex: number;
  title?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageModal: React.FC<ImageModalProps> = ({ visible, onClose, urls, initialIndex, title }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  if (!urls || urls.length === 0) return null;

  const handleNext = () => {
    if (currentIndex < urls.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentUrl = urls[currentIndex];
  const fullImageUrl = getOptimizedImageUrl(currentUrl, {
    width: 1200,
    quality: 90,
    format: 'origin', 
  });

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{title || 'Image Preview'}</Text>
            <Text style={styles.counter}>{currentIndex + 1} / {urls.length}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.imageContainer}>
          {urls.length > 1 && (
            <TouchableOpacity 
              style={[styles.navButton, styles.leftButton, currentIndex === 0 && styles.disabledButton]} 
              onPress={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={32} color={currentIndex === 0 ? Theme.colors.text.muted : Theme.colors.text.primary} />
            </TouchableOpacity>
          )}

          <Image
            key={currentUrl}
            source={{ uri: fullImageUrl }}
            style={styles.fullImage}
            resizeMode="contain"
          />

          {urls.length > 1 && (
            <TouchableOpacity 
              style={[styles.navButton, styles.rightButton, currentIndex === urls.length - 1 && styles.disabledButton]} 
              onPress={handleNext}
              disabled={currentIndex === urls.length - 1}
            >
              <ChevronRight size={32} color={currentIndex === urls.length - 1 ? Theme.colors.text.muted : Theme.colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Text style={styles.buttonText}>Back to Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.size.md,
    fontWeight: '800',
  },
  counter: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    backgroundColor: Theme.colors.muted,
    borderRadius: 20,
  },
  imageContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  navButton: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  leftButton: {
    left: 20,
  },
  rightButton: {
    right: 20,
  },
  disabledButton: {
    opacity: 0.3,
  },
  footer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  backButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: Theme.radius.md,
  },
  buttonText: {
    color: Theme.colors.text.black,
    fontSize: Theme.typography.size.md,
    fontWeight: '800',
  },
});

export default ImageModal;
