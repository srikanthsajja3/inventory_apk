import React, { useState, useMemo, useEffect } from 'react';
import { Image, StyleSheet, View, ActivityIndicator, ImageStyle, StyleProp, ImageResizeMode } from 'react-native';
import { ImageOff } from 'lucide-react-native';
import { getOptimizedImageUrl } from '../utils/images';
import { Theme } from '../theme';

interface OptimizedImageProps {
  url: string;
  width?: number;
  height?: number;
  quality?: number;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
  shouldLoad?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  url,
  width = 400,
  height = 400,
  quality = 80,
  style,
  resizeMode = 'contain',
  shouldLoad = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadTriggered, setLoadTriggered] = useState(shouldLoad);

  // Reset states when the source URL changes
  useEffect(() => {
    setLoading(true);
    setError(false);
    if (shouldLoad) setLoadTriggered(true);
  }, [url, width, height, quality]);

  // Trigger load when shouldLoad becomes true
  useEffect(() => {
    if (shouldLoad && !loadTriggered) {
      setLoadTriggered(true);
    }
  }, [shouldLoad]);

  const imageUrl = useMemo(() => {
    return getOptimizedImageUrl(url, { width, height, quality });
  }, [url, width, height, quality]);

  const source = useMemo(() => ({ uri: imageUrl }), [imageUrl]);

  if (!loadTriggered) {
    return <View style={[styles.container, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      {error ? (
        <View style={styles.errorContainer}>
          <ImageOff size={width < 100 ? 20 : 32} color={Theme.colors.text.muted} />
        </View>
      ) : (
        <Image
          source={source}
          style={[styles.image, style]}
          onLoadEnd={() => setLoading(false)}
          onError={(e) => {
            console.error(`[OptimizedImage] Failed to load: ${imageUrl}`, e.nativeEvent);
            setError(true);
            setLoading(false);
          }}
          // @ts-ignore - React Native Web supports these HTML attributes
          loading="lazy"
          decoding="async"
          resizeMode={resizeMode}
          resizeMethod="resize"
        />
      )}
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: Theme.colors.muted,
  }
});

export default OptimizedImage;
