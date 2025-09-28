import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { BlurView } from 'expo-blur';
import apiService from '../APIservices';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logo = require('../../assets/images/cricshub.png');
const background = require('../../assets/images/cricsLogo.png');

const Registration = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

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

  const handleVerifyEmail = async () => {
    if (!formData.email) {
      Alert.alert('Error', 'Please enter an email address to verify.');
      return;
    }

    try {
      const response = await apiService({
        endpoint: `auth/sendOtp`,
        method: 'POST',
        params: { email: formData.email },
      });

      if (response.success) {
        Alert.alert('Success', 'Verification email sent!');
      } else {
        Alert.alert(
          'Error',
          `Error ${response.status}: ${response.error.message || 'Failed to send verification email.'}`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
      console.error(error);
    }
  };

  const handleVerifyPhoneNo = async () => {
    if (!formData.mobile) {
      Alert.alert('Error', 'Please enter an email address to verify.');
      return;
    }

    try {
      const response = await apiService({
        endpoint: `auth/send`,
        method: 'POST',
        params: { phone: formData.mobile },
      });

      if (response.success) {
        Alert.alert('Success', 'OTP Successfully Sent');
      } else {
        Alert.alert(
          'Error',
          `Error ${response.status}: ${response.error.message || 'Failed to send verification message.'}`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    const { name, email, mobile, password, confirmPassword, otp } = formData;

    if (!name || !email || !mobile || !password || !confirmPassword || !otp) {
      Alert.alert('Error', 'Please fill all the fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      const response = await apiService({
        endpoint: 'auth/register',
        method: 'POST',
        body: {
          name,
          email,
          mobile,
          password,
          confirmPassword,
          otp,
        },
      });

      if (response.success) {
        Alert.alert('Success', 'Registration successful!');
        const loginResponse = await apiService({
          endpoint: 'auth/login',
          method: 'POST',
          body: {
            username: formData.email.toLowerCase(),
            password: formData.password,
          },
        });
        if (loginResponse.success) {
          const token = loginResponse.data.data?.token;
          const userId = loginResponse.data.data?.user?.id;
          const name = loginResponse.data.data?.user?.name;

          if (!token || !userId) {
            throw new Error('Token or User ID is missing in the API response.');
          }

          await saveToken(token);
          await AsyncStorage.setItem('userUUID', userId);
          await AsyncStorage.setItem('userName', name);
          navigation.replace('Main');
        } else {
          if (response.error === "Unauthorized") {
            console.error('Invalid credentials');
          } else {
            alert(`Error: ${response.status || 'Unknown'} - ${response.error.message || response.error}`);
          }
          setFormData({
            name: '',
            email: '',
            mobile: '',
            password: '',
            confirmPassword: '',
            otp: '',
          });
        }
      } else {
        Alert.alert('Error', `Error ${response.status}: ${response.error.message || 'Registration failed.'}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to the server.');
      console.error(error);
    }
  };

  return (
    <>
      <StatusBar />
      <ImageBackground source={background} style={styles.backgroundImage} resizeMode="cover">
        {/* Overlay to make the background less dark */}
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.logoContainer}>
              <Image source={logo} style={styles.logo} />
            </View>

            {/* Glassmorphism Form Section */}
            <BlurView intensity={50} tint="light" style={styles.formContainer}>
              <View style={styles.innerContainer}>
                <Text style={styles.title}>REGISTRATION</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor="#666"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                />

                {/* Verify Email Button */}
                <TouchableOpacity style={styles.verifyEmailButton} onPress={handleVerifyEmail}>
                  <Text style={styles.verifyEmailButtonText}>Verify Email</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  placeholder="Mobile No"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                  value={formData.mobile}
                  onChangeText={(value) => handleInputChange('mobile', value)}
                />

                {/* Verify Phone Number Button */}
                <TouchableOpacity style={styles.verifyEmailButton} onPress={handleVerifyPhoneNo}>
                  <Text style={styles.verifyEmailButtonText}>Verify Phone Number</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  placeholder="Set Password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="OTP"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={formData.otp}
                  onChangeText={(value) => handleInputChange('otp', value)}
                />

                {/* Sign Up Button */}
                <TouchableOpacity style={styles.signUpButton} onPress={handleSubmit}>
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                </TouchableOpacity>

                {/* Login Link */}
                <Text style={styles.loginText}>
                  Already have an account?{' '}
                  <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                    Login
                  </Text>
                </Text>
              </View>
            </BlurView>
          </View>
        </View>
      </ImageBackground>
    </>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Adjust the opacity here (0.4 = 40% dark)
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  formContainer: {
    borderRadius: 15,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  innerContainer: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    borderRadius: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#004466',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
    height: 40,
    color: '#333',
  },
  verifyEmailButton: {
    backgroundColor: '#004466',
    borderRadius: 5,
    paddingVertical: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  verifyEmailButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: '#004466',
    borderRadius: 5,
    paddingVertical: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  signUpButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginText: {
    marginTop: 20,
    fontSize: 14,
    color: '#004466',
    textAlign: 'center',
  },
  loginLink: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
});

export default Registration;