import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAppNavigation } from '../../NavigationService';
import apiService from '../../APIservices';
import { LinearGradient } from 'expo-linear-gradient';

import { AppGradients, AppColors, AppButtons } from '../../../assets/constants/colors.js';

const Toss = ({ route }) => {
  const [matchDetails, setMatchDetails] = useState(null);
  const [tossWinner, setTossWinner] = useState('');
  const [choice, setChoice] = useState('');
  const [showTossWinnerOptions, setShowTossWinnerOptions] = useState(false);
  const [showChoiceOptions, setShowChoiceOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); 

  const { matchId } = route.params;
  const navigation = useAppNavigation();

  useEffect(() => {
    setMatchDetails(route.params.matchDetails);
  }, [route.params.matchDetails]); 

  const displayMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleTossSubmit = async () => {
    // Validate selections
    if (!tossWinner || !choice) {
      displayMessage('Please select both the toss winner and their choice.', 'error');
      return;
    }

    setIsLoading(true); // Show loading indicator
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        throw new Error('Please login again');
      }

      // API call to submit toss decision
      const response = await apiService({
        endpoint: `matches/${matchId}/toss`, // Use matchId from route.params directly
        method: 'POST',
        body: { tossWinner, choice },
      });

      if (response.success) {
        displayMessage('Toss decision submitted successfully!', 'success');
        // Navigate to the next screen (SelectRoles)
        navigation.navigate('SelectRoles', { matchId, isFirstInnings: true });
      } else {
        displayMessage('Failed to submit toss decision. Please try again.', 'error');
      }
    } catch (error) {
      console.error("Toss submission error:", error);
      displayMessage('Failed to submit toss decision. Please try again.', 'error');
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };

  // Handles selecting the toss-winning team
  const handleSelectTossWinner = (teamName) => {
    setTossWinner(teamName);
    setShowTossWinnerOptions(false); // Close options after selection
  };

  // Handles selecting the choice (bat or bowl)
  const handleSelectChoice = (selectedChoice) => {
    setChoice(selectedChoice);
    setShowChoiceOptions(false); // Close options after selection
  };

  // Determine if the submit button should be disabled
  const isSubmitDisabled = !tossWinner || !choice || isLoading;

  return (
    <View style={styles.appContainer}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={AppColors.BgColor}
        translucent={true}
      />
      <View style={styles.mainContentArea}>
        <Text style={styles.heading}>Toss Decision</Text>

        {/* Custom Message Display */}
        {message.text ? (
          <View style={[styles.messageBox, message.type === 'error' ? styles.errorBox : styles.successBox]}>
            <Text style={message.type === 'error' ? styles.errorText : styles.successText}>
              {message.text}
            </Text>
          </View>
        ) : null}

        {/* Toss Winner Selection Section */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Select Toss Winner:</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowTossWinnerOptions(!showTossWinnerOptions)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="groups" size={20} color={AppColors.mediumText} style={styles.dropdownIcon} />
            <Text style={styles.dropdownButtonText}>
              {tossWinner || 'Select Team'}
            </Text>
            <MaterialIcons
              name={showTossWinnerOptions ? "arrow-drop-up" : "arrow-drop-down"}
              size={24}
              color={AppColors.mediumText}
            />
          </TouchableOpacity>

          {/* Options for Toss Winner */}
          {showTossWinnerOptions && matchDetails && (
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => handleSelectTossWinner(matchDetails?.team1Name)}
              >
                <MaterialIcons name="groups" size={20} color={AppColors.lightText} style={styles.optionIcon} />
                <Text style={styles.optionText}>{matchDetails?.team1Name}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionItem, styles.lastOptionItem]}
                onPress={() => handleSelectTossWinner(matchDetails?.team2Name)}
              >
                <MaterialIcons name="groups" size={20} color={AppColors.lightText} style={styles.optionIcon} />
                <Text style={styles.optionText}>{matchDetails?.team2Name}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Choice Selection Section */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Choose Bat or Bowl:</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowChoiceOptions(!showChoiceOptions)}
            activeOpacity={0.7}
          >
            {/* Icon dynamically changes based on selected choice */}
            {choice === 'bat' ? (
              <MaterialIcons name="sports-cricket" size={20} color={AppColors.mediumText} style={styles.dropdownIcon} />
            ) : choice === 'bowl' ? (
              <MaterialIcons name="sports-baseball" size={20} color={AppColors.mediumText} style={styles.dropdownIcon} />
            ) : (
              <MaterialIcons name="question-mark" size={20} color={AppColors.mediumText} style={styles.dropdownIcon} />
            )}
            <Text style={styles.dropdownButtonText}>
              {choice ? (choice === 'bat' ? 'Bat' : 'Bowl') : 'Select Choice'}
            </Text>
            <MaterialIcons
              name={showChoiceOptions ? "arrow-drop-up" : "arrow-drop-down"}
              size={24}
              color={AppColors.mediumText}
            />
          </TouchableOpacity>

          {/* Options for Choice */}
          {showChoiceOptions && (
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => handleSelectChoice('bat')}
              >
                <MaterialIcons name="sports-cricket" size={20} color={AppColors.lightText} style={styles.optionIcon} />
                <Text style={styles.optionText}>Bat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionItem, styles.lastOptionItem]}
                onPress={() => handleSelectChoice('bowl')}
              >
                <MaterialIcons name="sports-baseball" size={20} color={AppColors.lightText} style={styles.optionIcon} />
                <Text style={styles.optionText}>Bowl</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
      {/* Submit Button with fixed bottom position */}
      <Pressable
        onPress={handleTossSubmit}
        disabled={isSubmitDisabled}
        style={styles.submitButtonWrapper} 
      >
        <LinearGradient
          colors={isSubmitDisabled ? [AppColors.infoGrey, AppColors.infoGrey] : AppGradients.primaryButton}
          style={styles.submitButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isLoading ? (
            <ActivityIndicator color={AppColors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={24} color={AppColors.white} style={styles.buttonIcon} />
              <Text style={styles.submitButtonText}>Submit Toss</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
};

export default Toss;

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: AppColors.BgColor,
    // Fix for Android status bar issue
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
  },
  mainContentArea: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: AppColors.BgColor,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.darkText,
    marginBottom: 8,
    textAlign: 'center',
    paddingTop: 20, 
  },
  inputSection: {
    marginBottom: 20,
    marginTop: 20,
  },
  label: {
    fontSize: 17,
    color: AppColors.mediumText,
    marginBottom: 10,
    fontWeight: '600',
  },
  dropdownButton: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: AppColors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: AppColors.darkText,
    flex: 1,
    marginLeft: 10,
  },
  dropdownIcon: {
    marginRight: 5,
  },
  optionsContainer: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.inputBorder,
    marginTop: 8,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.lightBackground,
  },
  lastOptionItem: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 16,
    color: AppColors.mediumText,
    marginLeft: 10,
  },
  optionIcon: {
    marginRight: 10,
  },
  submitButtonWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 10, 
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%', 
  },
  submitButtonText: {
    color: AppColors.white, 
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    backgroundColor: AppColors.errorRed + '1A',
    borderColor: AppColors.errorRed,
    borderWidth: 1,
  },
  successBox: {
    backgroundColor: AppColors.successGreen + '1A',
    borderColor: AppColors.successGreen,
    borderWidth: 1,
  },
  errorText: {
    color: AppColors.errorRed,
    fontWeight: '500',
    textAlign: 'center',
  },
  successText: {
    color: AppColors.successGreen,
    fontWeight: '500',
    textAlign: 'center',
  },
});