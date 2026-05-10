import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

// For scaling calculations, we cap the width to prevent UI elements 
// from becoming excessively large on desktop browsers.
const MAX_SCALING_WIDTH = 500;
const SCALING_WIDTH = Platform.OS === 'web' ? Math.min(WINDOW_WIDTH, MAX_SCALING_WIDTH) : WINDOW_WIDTH;

// Use the actual window width for layout logic (like number of columns)
const SCREEN_WIDTH = WINDOW_WIDTH;
const SCREEN_HEIGHT = WINDOW_HEIGHT;

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Scaling functions use SCALING_WIDTH to keep elements at readable sizes
const scale = (size: number) => (SCALING_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Normalizes font sizes based on screen density and size
 */
const normalize = (size: number) => {
  const newSize = scale(size);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else if (Platform.OS === 'android') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  } else {
    // Web - keep it closer to the scaled size but cap it
    return Math.round(newSize);
  }
};

export { scale, verticalScale, moderateScale, normalize, SCREEN_WIDTH, SCREEN_HEIGHT, WINDOW_WIDTH, WINDOW_HEIGHT };
