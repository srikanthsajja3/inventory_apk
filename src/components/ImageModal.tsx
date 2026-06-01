import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Image, StyleSheet, TouchableOpacity, Text, Dimensions, Platform, StatusBar, Animated } from 'react-native';
import { PinchGestureHandler, PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
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
  const [currentScale, setCurrentScale] = useState(1);
  
  // Animation values for zoom and pan
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  // Prevention of browser zoom on Web (Desktop only)
  useEffect(() => {
    if (Platform.OS === 'web' && visible) {
      const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey) {
          e.preventDefault();
          // Implement custom zoom for trackpad pinch / Ctrl+Wheel
          const delta = -e.deltaY;
          const zoomStep = 0.01;
          const newScale = Math.max(1, Math.min(5, lastScale.current + delta * zoomStep));
          
          lastScale.current = newScale;
          scale.setValue(newScale);
          setCurrentScale(newScale);
        }
      };

      document.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        document.removeEventListener('wheel', handleWheel);
      };
    }
  }, [visible]);

  // Double click to reset on web
  const handleDoubleClick = () => {
    if (Platform.OS === 'web') {
      resetZoom();
    }
  };

  useEffect(() => {
    setCurrentIndex(initialIndex);
    resetZoom();
  }, [initialIndex, visible]);

  const resetZoom = () => {
    scale.setValue(1);
    translateX.setOffset(0);
    translateX.setValue(0);
    translateY.setOffset(0);
    translateY.setValue(0);
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
    setCurrentScale(1);
  };

  if (!urls || urls.length === 0) return null;

  const handleNext = () => {
    if (currentIndex < urls.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetZoom();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetZoom();
    }
  };

  // Pinch Gesture
  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: scale } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        const s = lastScale.current * event.nativeEvent.scale;
        if (s !== currentScale) {
          setCurrentScale(s);
        }
      }
    }
  );

  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastScale.current *= event.nativeEvent.scale;
      if (lastScale.current < 1) {
        lastScale.current = 1;
        setCurrentScale(1);
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: false,
        }).start();
        
        // Reset translation when zoomed out
        lastTranslateX.current = 0;
        lastTranslateY.current = 0;
        translateX.setOffset(0);
        translateX.setValue(0);
        translateY.setOffset(0);
        translateY.setValue(0);
      } else {
        scale.setValue(lastScale.current);
        setCurrentScale(lastScale.current);
      }
    }
  };

  // Pan Gesture
  const onPanGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: false }
  );

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastTranslateX.current += event.nativeEvent.translationX;
      lastTranslateY.current += event.nativeEvent.translationY;
      translateX.setOffset(lastTranslateX.current);
      translateX.setValue(0);
      translateY.setOffset(lastTranslateY.current);
      translateY.setValue(0);
    }
  };

  const currentUrl = urls[currentIndex];
  const fullImageUrl = getOptimizedImageUrl(currentUrl, {
    width: 1200,
    quality: 90,
    format: 'origin', 
  });

  const showUI = currentScale <= 1.1;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Minimal Close Button Overlay */}
          <TouchableOpacity style={styles.closeButtonOverlay} onPress={onClose}>
            <X size={28} color="#fff" />
          </TouchableOpacity>

          {/* Counter Overlay */}
          {showUI && (
            <View style={styles.counterOverlay}>
              <Text style={styles.counterText}>{currentIndex + 1} / {urls.length}</Text>
            </View>
          )}
          
          <View style={styles.imageContainer}>
            {urls.length > 1 && showUI && (
              <TouchableOpacity 
                style={[styles.navButton, styles.leftButton, currentIndex === 0 && styles.disabledButton]} 
                onPress={handlePrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={32} color={currentIndex === 0 ? "#ccc" : "#fff"} />
              </TouchableOpacity>
            )}

            <PanGestureHandler
              onGestureEvent={onPanGestureEvent}
              onHandlerStateChange={onPanHandlerStateChange}
              enabled={currentScale > 1}
            >
              <Animated.View style={styles.animatedWrapper}>
                <PinchGestureHandler
                  onGestureEvent={onPinchGestureEvent}
                  onHandlerStateChange={onPinchHandlerStateChange}
                >
                  <Animated.View style={[
                    styles.animatedImageContainer,
                    {
                      transform: [
                        { scale: scale },
                        { translateX: translateX },
                        { translateY: translateY },
                      ],
                    }
                  ]}>
                    <Image
                      key={currentUrl}
                      source={{ uri: fullImageUrl }}
                      style={styles.fullImage}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </PinchGestureHandler>
              </Animated.View>
            </PanGestureHandler>

            {urls.length > 1 && showUI && (
              <TouchableOpacity 
                style={[styles.navButton, styles.rightButton, currentIndex === urls.length - 1 && styles.disabledButton]} 
                onPress={handleNext}
                disabled={currentIndex === urls.length - 1}
              >
                <ChevronRight size={32} color={currentIndex === urls.length - 1 ? "#ccc" : "#fff"} />
              </TouchableOpacity>
            )}
          </View>

          {title && showUI && (
            <View style={styles.titleOverlay}>
              <Text style={styles.titleText}>{title}</Text>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  animatedWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        touchAction: 'none', // Critical for web to prevent page zoom
      }
    })
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
    borderColor: 'rgba(255,255,255,0.3)',
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
    width: screenWidth,
    height: screenHeight,
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
    borderColor: 'rgba(255,255,255,0.3)',
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
