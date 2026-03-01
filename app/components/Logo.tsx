import React from "react";
import { Image, StyleSheet, View } from "react-native";

const Logo = () => {
  return (
    <View style={styles.logoContainer}>
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    marginTop: 40,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
  },
});

export default Logo;
