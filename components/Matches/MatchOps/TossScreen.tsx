import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, StatusBar } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors, AppGradients } from '../../../assets/constants/colors'; // Corrected import path
import apiService from '../../APIservices';

const TossScreen = ({ navigation, route }) => {
  const { matchId, team1PlayingXIIds, team2PlayingXIIds, matchDetails } = route.params;

  const [apiCallStatus, setApiCallStatus] = useState('pending'); // 'pending', 'success', 'failed'
  const [apiError, setApiError] = useState(null); // Stores API error message

  // Lottie animation reference
  const coinTossAnimation = require('../../../assets/animations/turning coin.json'); // Engaging animation

  // --- API Call Effect (Runs once on mount) ---
  const startMatchApiCall = async () => { // Moved outside useEffect for retry
    try {
      setApiCallStatus('pending'); // Ensure status is pending when starting
      setApiError(null); // Clear previous errors on retry
      const token = await AsyncStorage.getItem("jwtToken");

      console.log("TossScreen: Starting API call to setup match...");
      console.log("TossScreen: Retrieved Token:", token ? "Exists" : "MISSING");
      console.log("TossScreen: matchId:", matchId);
      console.log("TossScreen: team1PlayingXIIds:", team1PlayingXIIds);
      console.log("TossScreen: team2PlayingXIIds:", team2PlayingXIIds);

      if (!token) {
        throw new Error("Authentication token missing. Please log in again.");
      }

      const requestBody = {
        tournamentId: null, // As it's an instant match
        team1PlayingXIIds,
        team2PlayingXIIds,
      };
      console.log("TossScreen: Request Body:", requestBody);

      const response = await apiService({
        endpoint: `matches/${matchId}/start`,
        method: 'POST',
        body: requestBody,
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });

      console.log("TossScreen: API Response:", response); // Log the full response

      if (response.success) {
        setApiCallStatus('success');
        setApiError(null); // Clear any previous errors
        console.log("Match start API call successful!");
      } else {
        setApiCallStatus('failed');
        let errorMessage = "Unknown error occurred.";

        // --- IMPROVED ERROR HANDLING ---
        if (response.error) {
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (response.error.message) {
            errorMessage = response.error.message;
          } else if (response.error.detail) { // Common for some APIs (e.g., Django REST Framework)
            errorMessage = response.error.detail;
          } else {
            // If it's an object without a specific message field, stringify it
            errorMessage = JSON.stringify(response.error, null, 2);
          }
        }
        // --- END IMPROVED ERROR HANDLING ---

        setApiError(`Failed to set up match: ${errorMessage}`);
        console.error("API Error in TossScreen (start match):", response.error);
        if (response.error && typeof response.error === 'object') {
          console.error("TossScreen: Detailed API Error Object:", JSON.stringify(response.error, null, 2));
        }
      }
    } catch (err) {
      setApiCallStatus('failed');
      const errorMessage = err.message || "Please check your connection.";
      setApiError(`Network or unexpected error: ${errorMessage}`);
      console.error("Caught error in TossScreen API call:", err);
    }
  };

  useEffect(() => {
    startMatchApiCall();
  }, [matchId, team1PlayingXIIds, team2PlayingXIIds]); // Dependencies for useEffect

  // Function to handle "Toss Completed!" button press
  const handleTossCompleted = () => {
    if (apiCallStatus === 'success') {
      // Navigate to the actual Toss input screen
      navigation.navigate('Toss', { matchDetails, matchId });
    } else if (apiCallStatus === 'failed') {
      // If API failed, alert the user and offer options
      Alert.alert(
        "Match Setup Failed",
        apiError || "Could not complete match setup. Please try again.",
        [
          { text: "Retry Setup", onPress: () => startMatchApiCall() }, // Offer to retry API call
          { text: "Go Back", onPress: () => navigation.goBack() } // Option to go back to XI selection
        ]
      );
    } else {
      // If API is still pending, inform the user
      Alert.alert(
        "Please Wait",
        "Match setup is still in progress. The 'Toss Completed!' button will activate once it's done."
      );
    }
  };

  return (
    <LinearGradient
      // Main container now uses AppColors.white and takes on the styling of the former contentBox
      colors={[AppColors.white, AppColors.white]}
      style={styles.container}
    >
      {/* Set StatusBar background to the new container background color */}
      <StatusBar backgroundColor={AppColors.white} translucent={true} />
      {/* Content is now directly inside the LinearGradient */}
      <Text style={styles.title}>Let's Prepare for the Toss!</Text>
      <Text style={styles.message}>
        A physical coin toss helps decide who starts first.
        Perform the real-life toss now. We're setting things up in the background for you!
      </Text>

      {/* Engaging Lottie Animation */}
      <LottieView
        source={coinTossAnimation}
        autoPlay // Auto play for continuous engagement
        loop // Loop indefinitely for continuous engagement
        style={styles.lottieCoin}
      />

      {/* API Status Indicator */}
      <View style={styles.apiStatusContainer}>
        {apiCallStatus === 'pending' && (
          <>
            <ActivityIndicator size="small" color={AppColors.primaryBlue} />
            <Text style={styles.apiStatusText}>Setting up match...</Text>
          </>
        )}
        {apiCallStatus === 'success' && (
          <>
            <MaterialIcons name="check-circle" size={20} color={AppColors.successGreen} />
            <Text style={[styles.apiStatusText, { color: AppColors.successGreen }]}>Match setup complete!</Text>
          </>
        )}
        {apiCallStatus === 'failed' && (
          <>
            <MaterialIcons name="error" size={20} color={AppColors.errorRed} />
            <Text style={[styles.apiStatusText, { color: AppColors.errorRed }]}>Match setup failed!</Text>
          </>
        )}
      </View>
      {apiError && apiCallStatus === 'failed' && (
        <Text style={styles.apiErrorMessage}>{apiError}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.tossCompletedButton,
          (apiCallStatus !== 'success') && styles.disabledButton
        ]}
        onPress={handleTossCompleted}
        disabled={apiCallStatus !== 'success'}
      >
        <LinearGradient
          colors={apiCallStatus === 'success' ? AppGradients.primaryButton : [AppColors.gray, AppColors.gray]} // Using AppGradients and AppColors
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.tossButtonGradient}
        >
          <Text style={styles.tossButtonText}>Toss Completed!</Text>
        </LinearGradient>
      </TouchableOpacity>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.BgColor,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.darkText,
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: AppColors.mediumText,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 10, // Keep padding for text readability
  },
  lottieCoin: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  tossCompletedButton: {
    borderRadius: 15,
    overflow: 'hidden',
    width: '80%', // Keep width for button
    shadowColor: AppGradients.successGreen, // Different shadow for success button
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 20,
  },
  tossButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tossButtonText: {
    color: AppColors.white,
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 0.6, // Visually indicate disabled state
    shadowOpacity: 0,
    elevation: 0,
  },
  apiStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: AppColors.lightBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.inputBorder,
  },
  apiStatusText: {
    marginLeft: 10,
    fontSize: 14,
    color: AppColors.mediumText,
    fontWeight: '500',
  },
  apiErrorMessage: {
    fontSize: 13,
    color: AppColors.errorRed,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  }
});

export default TossScreen;