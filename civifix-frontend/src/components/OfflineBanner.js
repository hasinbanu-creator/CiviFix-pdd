import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NetworkContext } from '../context/NetworkContext';
import { COLORS, FONT_SIZES, SPACING, SHADOWS } from '../constants/theme';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const OfflineBanner = () => {
  const { isConnected, isInternetReachable } = useContext(NetworkContext);

  // If connected, or if netinfo is still checking (null), don't show the banner
  if (isConnected && isInternetReachable !== false) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Icon name="wifi-off" size={20} color="#fff" />
      <Text style={styles.text}>
        No Internet Connection
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    ...SHADOWS.md,
    zIndex: 999,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  }
});

export default OfflineBanner;
