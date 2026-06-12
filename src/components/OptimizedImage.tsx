import React, { useState, useMemo, useEffect } from 'react';
import { Image, StyleSheet, View, ActivityIndicator, ImageStyle, StyleProp, ImageResizeMode } from 'react-native';
import { getOptimizedImageUrl, getPlaceholderUrl } from '../utils/images';
import { Theme } from '../theme';

interface OptimizedImageProps {
  url: string;
  width?: number;
  height?: number;
  quality?: number;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  url,
  width = 400,
  height = 400,
  quality = 80,
  style,
  resizeMode = 'contain',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reset states when the source URL changes
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [url, width, height, quality]);

  const imageUrl = useMemo(() => {
    return error 
      ? getPlaceholderUrl() 
      : getOptimizedImageUrl(url, { width, height, quality });
  }, [url, width, height, quality, error]);

  const source = useMemo(() => ({ uri: imageUrl }), [imageUrl]);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={[styles.image, style]}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        // @ts-ignore - React Native Web supports these HTML attributes
        loading="lazy"
        decoding="async"
        resizeMode={resizeMode}
        resizeMethod="resize"
      />
      {loading && !error && (
        <View style={styles.loader}>
          <ActivityIndicator color={Theme.colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.sm,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});

export default OptimizedImage;
