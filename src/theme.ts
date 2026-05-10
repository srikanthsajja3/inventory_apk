import { moderateScale, normalize } from './utils/scaling';

export const Theme = {
  colors: {
    primary: '#D4AF37', // Gold
    background: '#291C0E', // Dark Brown
    surface: '#3D2B1A', // Deep Brown
    border: '#4A3520', // Rich Brown
    input: '#4A3520',
    muted: '#1A1108',
    text: {
      primary: '#FFFFFF',
      secondary: '#CCCCCC',
      muted: '#888888',
      black: '#000000',
    },
    status: {
      success: '#4CAF50',
      error: '#FF4444',
      info: '#D4AF37',
    },
  },
  spacing: {
    xs: moderateScale(4),
    sm: moderateScale(8),
    md: moderateScale(16),
    lg: moderateScale(24),
    xl: moderateScale(32),
  },
  typography: {
    size: {
      xs: normalize(10),
      sm: normalize(12),
      md: normalize(14),
      lg: normalize(18),
      xl: normalize(24),
      xxl: normalize(32),
    },
  },
  radius: {
    sm: moderateScale(8),
    md: moderateScale(12),
    lg: moderateScale(24),
    xl: moderateScale(32),
  }
};

export default Theme;
