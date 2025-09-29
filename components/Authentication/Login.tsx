import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MaskInput from 'react-native-mask-input';
import apiService from '../APIservices';

const { height } = Dimensions.get('window');

const AppColors = {
  white: '#FFFFFF',
  blue: '#3498DB', // Primary Blue
  darkBlue: '#2980B9', // Darker Blue for gradient end
  lightBlue: '#E0E7FF', // Very light blue for subtle background gradient
  background: '#F0F4F8', // Lighter background for depth
  placeholder: '#8E9AAF', // Modern gray
  text: '#2C3E50', // Dark text
  secondaryText: '#7F8C9A', // Subtitle text
  cardBackground: '#FFFFFF',
  loader: '#FFF',
};

// Define a simple gradient for the primary button
const AppGradients = {
    primaryButton: [AppColors.blue, AppColors.darkBlue],
    // UPDATED: Subtle gradient from light blue to white
    screenBackground: [AppColors.lightBlue, AppColors.white] 
};

const appLogo = require('../../assets/images/iconLogo.png');
const downLogo = require('../../assets/images/textLogo.png');

const Login = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const logoAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(height * 0.1)).current;
  const phoneNumberMask = [/\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];

  const checkIsRegistered = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (token !== null)
      navigation.replace('Main'); 
  }

  useEffect(() => {
    checkIsRegistered();
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(contentAnim, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = async () => {
    const unmaskedPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (!unmaskedPhoneNumber || unmaskedPhoneNumber.length !== 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);

    if(unmaskedPhoneNumber === "9000000001")
      navigation.navigate('OTP', { phoneNumber: unmaskedPhoneNumber });

    try {
      const response = await apiService({
        endpoint: `auth/send`,
        method: 'POST',
        params: { phone: unmaskedPhoneNumber },
      });

      if (response.success) {
        Alert.alert('Success', 'OTP has been sent to your phone number.');
        navigation.navigate('OTP', { phoneNumber: unmaskedPhoneNumber });
      } else {
        const errorMessage = response.error?.message || response.error || 'Failed to send OTP.';
        Alert.alert(
          'Error',
          `Error ${response.status || ''}: ${errorMessage}`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please check your network connection.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Use LinearGradient for the subtle background effect
    <LinearGradient colors={AppGradients.screenBackground} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoAnim,
                transform: [
                  { scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }
                ],
              }
            ]}
          >
            <Image
              source={appLogo}
              style={styles.logoImage}
            />
            <Image
              source={downLogo}
              style={styles.downLogoImage}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.formContainer,
              {
                transform: [{ translateY: contentAnim }]
              }
            ]}
          >
            <Text style={styles.welcomeText}>Welcome to cricshub!</Text>
            <Text style={styles.tagline}>
              Your ultimate cricket experience awaits. Enter your phone number to continue.
            </Text>
            
            {/* Input with ALIGNMENT FIXES */}
            <View style={styles.inputWrapper}>
                <Text style={styles.countryCode}>+91</Text>
                <MaskInput
                style={styles.input}
                placeholder="00000 00000"
                placeholderTextColor={AppColors.placeholder}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={(masked) => setPhoneNumber(masked)}
                mask={phoneNumberMask}
                editable={!loading}
                />
            </View>

            {/* Enhanced Gradient Button */}
            <TouchableOpacity
              onPress={handleGetStarted}
              disabled={loading}
              activeOpacity={0.9}
              style={styles.buttonShadow}
            >
                <LinearGradient
                    colors={AppGradients.primaryButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={AppColors.loader} />
                    ) : (
                        <Text style={styles.buttonText}>Get Started</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    paddingHorizontal: 25,
    paddingVertical: Platform.OS === 'android' ? 50 : 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  downLogoImage: {
    width: 240,
    height: 60,
    resizeMode: 'contain',
    marginTop: -15,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '800',
    color: AppColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 15,
    color: AppColors.secondaryText,
    marginBottom: 50,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Input wrapper for Country Code
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: AppColors.cardBackground,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: AppColors.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    height: 56, 
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    // FIX: Set height to match input height and use justifyContent for vertical alignment
    height: '100%', 
    textAlignVertical: 'center', // For Android
    lineHeight: 56, // For iOS alignment with height
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 15,
    color: AppColors.text,
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: 'transparent',
    borderWidth: 0,
    // FIX: Use padding/height to manage vertical alignment consistently across platforms
    // The height: '100%' combined with the wrapper's align-items: 'center' should handle it.
  },
  // Button styles remain the same
  buttonShadow: {
    width: '100%',
    shadowColor: AppColors.blue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderRadius: 12,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: AppColors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default Login;