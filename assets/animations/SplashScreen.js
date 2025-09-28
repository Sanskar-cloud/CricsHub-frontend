import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";

export default function AnimatedSplash({ onFinish }) {
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current; 
  const slideAnim = useRef(new Animated.Value(20)).current; 
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim1, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim2, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }).start(() => {
        setTimeout(() => {
          onFinish();
        }, 800);
      });
    });
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../images/iconLogo.png")}
        style={[styles.logo, { opacity: fadeAnim1 }]}
      />
      <Animated.Image
        source={require("../images/textLogo.png")}
        style={[styles.logo, { opacity: fadeAnim2 }]}
      />
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>

      <Animated.Text
        style={[
          styles.text,
          {
            opacity: fadeAnim2,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        All in one powerful app.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  progressBarContainer: {
    width: 200,
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    marginTop: 12,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#87CEEB",
    borderRadius: 3,
  },
  text: {
    fontSize: 22,
    marginTop: 18,
    fontWeight: "500",
    letterSpacing: 1,
    color: "#222",
    textAlign: "center",
  },
});
