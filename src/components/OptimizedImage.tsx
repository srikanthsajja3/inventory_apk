import React, { useState } from 'react';
import { Image, StyleSheet, View, ActivityIndicator, ImageStyle, StyleProp } from 'react-native';
import { getOptimizedImageUrl, getPlaceholderUrl } from '../utils/images';
import { Theme } from '../theme';

interface OptimizedImageProps {
  url: string;
  width?: number;
  height?: number;
  quality?: number;
  style?: StyleProp<ImageStyle>;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  url,
  width = 400,
  height = 400,
  quality = 80,
  style,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const imageUrl = error 
    ? getPlaceholderUrl() 
    : getOptimizedImageUrl(url, { width, height, quality });

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, style]}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        // @ts-ignore
        loading="lazy"
      />
      {loading && (
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
  },
  image: {
    resizeMode: 'cover',
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
