import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const prevUrlRef = useRef(url);

  const imageUrl = useMemo(() => {
    return getOptimizedImageUrl(url, { width, height, quality });
  }, [url, width, height, quality]);

  // Only reset loading/error state if the URL actually changes
  useEffect(() => {
    if (prevUrlRef.current !== url) {
      prevUrlRef.current = url;
      setError(false);
      setLoading(true);
    }
  }, [url]);

  const source = useMemo(() => (imageUrl ? { uri: imageUrl } : undefined), [imageUrl]);

  if (!shouldLoad || !url) {
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
          onLoadStart={() => {
            // Only set loading if needed
          }}
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
          <ActivityIndicator color={Theme.colors.primary} size="small" />
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
    backgroundColor: 'rgba(0,0,0,0.1)',
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

export default React.memo(OptimizedImage);
