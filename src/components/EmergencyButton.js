import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

export default function EmergencyButton({ onPress }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Animated.View style={[styles.ring, { transform: [{ scale: pulse }] }]} />
      <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.85}>
        <Ionicons name="alert-circle" size={26} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position:        'absolute',
    bottom:          90,
    right:           20,
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          999,
  },
  ring: {
    position:     'absolute',
    width:        58,
    height:       58,
    borderRadius: 29,
    backgroundColor: Colors.emergency + '35',
  },
  btn: {
    width:          52,
    height:         52,
    borderRadius:   26,
    backgroundColor: Colors.emergency,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    Colors.emergency,
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.45,
    shadowRadius:   8,
    elevation:      8,
  },
});
