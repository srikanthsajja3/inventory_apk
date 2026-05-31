import React, { useState, useEffect } from 'react';
import { Modal, View, Image, StyleSheet, TouchableOpacity, Text, Dimensions, Platform, StatusBar } from 'react-native';
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
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Minimal Close Button Overlay */}
        <TouchableOpacity style={styles.closeButtonOverlay} onPress={onClose}>
          <X size={28} color="#000" />
        </TouchableOpacity>

        {/* Counter Overlay */}
        <View style={styles.counterOverlay}>
           <Text style={styles.counterText}>{currentIndex + 1} / {urls.length}</Text>
        </View>
        
        <View style={styles.imageContainer}>
          {urls.length > 1 && (
            <TouchableOpacity 
              style={[styles.navButton, styles.leftButton, currentIndex === 0 && styles.disabledButton]} 
              onPress={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={32} color={currentIndex === 0 ? "#ccc" : "#000"} />
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
              <ChevronRight size={32} color={currentIndex === urls.length - 1 ? "#ccc" : "#000"} />
            </TouchableOpacity>
          )}
        </View>

        {title && (
          <View style={styles.titleOverlay}>
             <Text style={styles.titleText}>{title}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  closeButtonOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: 20,
    zIndex: 100,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  counterOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 65 : 35,
    left: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullImage: {
    width: Platform.OS === 'web' ? Math.min(screenWidth, 800) : screenWidth,
    height: Platform.OS === 'web' ? Math.min(screenHeight, 800) : screenHeight,
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
  },
  leftButton: {
    left: 10,
  },
  rightButton: {
    right: 10,
  },
  disabledButton: {
    opacity: 0,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    maxWidth: '80%',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
});

export default ImageModal;
