import { Ionicons } from '@expo/vector-icons';
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
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import apiService from '../APIservices';

const { height } = Dimensions.get('window');

const AppColors = {
  white: '#FFFFFF',
  blue: '#3498DB', 
  darkBlue: '#2980B9',
  lightBlue: '#E0E7FF',
  background: '#F0F4F8', 
  placeholder: '#8E9AAF',
  text: '#2C3E50',
  secondaryText: '#7F8C9A',
  cardBackground: '#FFFFFF',
  loader: '#FFF',
  red: '#E74C3C', 
};

const AppGradients = {
    primaryButton: [AppColors.blue, AppColors.darkBlue],
    screenBackground: [AppColors.lightBlue, AppColors.white] 
};

const appLogo = require('../../assets/images/iconLogo.png');
const downLogo = require('../../assets/images/textLogo.png');

const Otp = ({ route, navigation }) => {
  const { phoneNumber } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60); // 60 seconds timer
  const [canResend, setCanResend] = useState(false);

  const otpInputs = useRef([]);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(height * 0.1)).current;

  useEffect(() => {
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

  // Timer effect
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [timer]);

  const saveToken = async (token) => {
    try {
      if (token === undefined || token === null) {
        throw new Error('Token is undefined or null. Cannot save.');
      }
      const tokenString = typeof token === 'string' ? token : JSON.stringify(token);
      await AsyncStorage.setItem('jwtToken', tokenString);
    } catch (error) {
      console.error('Error saving token securely:', error);
    }
  };

  const handleOtpChange = (text, index) => {
    if (text.length > 1) {
      text = text.charAt(0);
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text !== '' && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (text, index) => {
    if (text === '' && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    
    try {
      const response = await apiService({
        endpoint: `auth/send`,
        method: 'POST',
        params: {
          phone: phoneNumber,
        },
      });

      if (response.success) {
        Alert.alert('Success', 'OTP has been resent to your phone number.');
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        otpInputs.current[0]?.focus();
      } else {
        Alert.alert(
          'Error',
          response.error.message || 'Failed to resend OTP. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please check your network connection.');
      console.error(error);
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join('');
    console.log('Attempting to verify OTP:', fullOtp);
    console.log('Attempting to verify phone:', phoneNumber);
    if (fullOtp.length < 6) {
      Alert.alert('Validation Error', 'Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService({
        endpoint: `auth/verify`,
        method: 'POST',
        params: {
          phone: phoneNumber,
          otp: fullOtp,
        },
      });

     if (response.success) {
  Alert.alert('Success', 'OTP verified successfully!');

  const backendData = response.data.data; // unwrap inner backend "data"

  const token = backendData.token;
  const userId = backendData.user?.id;
  const name = backendData.user?.name;
  const isOldUser = backendData.user?.email;

  if (!token || !userId) {
    throw new Error('Token or User ID is missing in the API response.');
  }

  await saveToken(token);
  await AsyncStorage.setItem('userUUID', userId);
  await AsyncStorage.setItem('userName', name || '');

  if (isOldUser) {
    navigation.replace('Main'); // fixed typo here too
  } else {
    navigation.replace('registerForm');
  }

      } else {
        if (response.status === 401) {
          Alert.alert(
            'Authentication Error',
            'Your session has expired or you are not authorized. Please restart the process.'
          );
        } else if (response.status === 400) {
          Alert.alert(
            'Invalid OTP',
            response.error.message || 'The entered OTP is incorrect or has expired. Please try again.'
          );
        } else {
          Alert.alert(
            'Error',
            `Error ${response.status}: ${response.error.message || 'Failed to verify OTP.'}`
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please check your network connection.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <LinearGradient colors={AppGradients.screenBackground} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={24} color={AppColors.text} />
      </TouchableOpacity>
      
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
            <Text style={styles.welcomeText}>OTP Verification</Text>
            <Text style={styles.tagline}>
              Please enter the 6-digit code sent to your phone number **{phoneNumber}**.
            </Text>

            {/* Themed OTP Input Fields */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      handleBackspace(digit, index);
                    }
                  }}
                  ref={el => { otpInputs.current[index] = el; }}
                />
              ))}
            </View>
            
            {/* Themed Gradient Button */}
            <TouchableOpacity
              onPress={handleVerifyOtp}
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
                        <Text style={styles.buttonText}>Verify OTP</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
            
            {/* Resend OTP Section */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              {canResend ? (
                <TouchableOpacity 
                  onPress={handleResendOtp} 
                  disabled={resendLoading}
                >
                  <Text style={[styles.resendLink, resendLoading && { opacity: 0.6 }]}>
                    {resendLoading ? 'Sending...' : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.timerText}>
                  Resend in {formatTime(timer)}
                </Text>
              )}
            </View>
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
  // Back button styling is enhanced
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    zIndex: 10,
    padding: 10, // Slightly larger touch area
    borderRadius: 12,
    backgroundColor: AppColors.cardBackground,
    shadowColor: AppColors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40, 
  },
  otpInput: {
    width: '14%', // Adjusted width for better spacing
    height: 56,
    backgroundColor: AppColors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    textAlign: 'center',
    fontSize: 24, // Larger font size
    fontWeight: '700',
    color: AppColors.text,
    shadowColor: AppColors.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  // Themed Gradient Button
  buttonShadow: {
    width: '100%',
    shadowColor: AppColors.blue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderRadius: 12,
    marginBottom: 20,
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
  // Resend section updates
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  resendText: {
    fontSize: 15,
    color: AppColors.secondaryText,
  },
  resendLink: {
    fontSize: 15,
    color: AppColors.blue,
    fontWeight: '700',
  },
  timerText: {
    fontSize: 15,
    color: AppColors.red, // Using AppColors.red
    fontWeight: '700',
  },
});

export default Otp;