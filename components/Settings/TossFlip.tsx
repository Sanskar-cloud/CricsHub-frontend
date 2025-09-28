import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  StatusBar,
  Platform,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, AppGradients } from '../../assets/constants/colors.js'

const { width, height } = Dimensions.get('window');

const TossScreen = ({ navigation }) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const flipCoin = () => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    setShowResult(false);
    setResult(null);
    
    flipAnim.setValue(0);

    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      const randomResult = Math.random() > 0.5 ? 'Heads' : 'Tails';
      setResult(randomResult);
      setShowResult(true);
      setIsFlipping(false);
    });
  };
  const flipInterpolation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'] 
  });

  const animatedStyle = {
    transform: [
      { rotateY: flipInterpolation }
    ]
  };

  return (
    <View style={styles.safeArea}>
      <SafeAreaView style={styles.safeAreaContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={AppColors.background}
          translucent={false}
        />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color={AppColors.darkText} />
          </TouchableOpacity>
          <Text style={styles.heading}>Coin Toss</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Coin Toss</Text>
            <Text style={styles.subtitle}>
              Tap to flip and see if it's heads or tails
            </Text>
            <TouchableOpacity 
              onPress={flipCoin}
              disabled={isFlipping}
              activeOpacity={0.9}
              style={styles.coinTouchable}
            >
              <View style={styles.coinContainer}>
                <Animated.View style={[styles.coin, animatedStyle]}>
                  <View style={styles.coinFace}>
                    {!showResult ? (
                      <MaterialIcons name="help-outline" size={44} color={AppColors.primary} />
                    ) : result === 'Heads' ? (
                      <View style={styles.coinContent}>
                        <MaterialIcons name="looks-one" size={36} color={AppColors.primary} />
                        <Text style={styles.coinText}>Heads</Text>
                      </View>
                    ) : (
                      <View style={styles.coinContent}>
                        <MaterialIcons name="looks-two" size={36} color={AppColors.primary} />
                        <Text style={styles.coinText}>Tails</Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              </View>
            </TouchableOpacity>

            {/* Minimal Info Section */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                The coin toss decides which team bats or bowls first in cricket
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  safeAreaContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.cardBorder,
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.darkText,
  },
  backButton: {
    padding: 4,
  },
  headerButton: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: AppColors.darkText,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.lightText,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  coinTouchable: {
    marginBottom: 32,
  },
  coinContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coin: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
  },
  coinFace: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinText: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.primary,
    marginTop: 6,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
    maxWidth: 300,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.lightText,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TossScreen;