import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AppColors, AppGradients } from '../../../assets/constants/colors.js';
import apiService from '../../APIservices';
import { useAppNavigation } from '../../NavigationService';

const moment = require('moment-timezone');

const InstantMatch = () => {
  const istDateTime = moment().tz("Asia/Kolkata");
  const [overs, setOvers] = useState('');
  const [venue, setVenue] = useState('');
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [teamResults, setTeamResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [team1Name, setTeam1Name] = useState('');
  const [team1Id, setTeam1Id] = useState(null);
  const [team1Logo, setTeam1Logo] = useState(null);
  const [team2Name, setTeam2Name] = useState('');
  const [team2Id, setTeam2Id] = useState(null);
  const [team2Logo, setTeam2Logo] = useState(null);

  const [oversError, setOversError] = useState('');
  const [venueError, setVenueError] = useState('');
  const [team1Error, setTeam1Error] = useState('');
  const [team2Error, setTeam2Error] = useState('');

  const oversShakeAnim = useRef(new Animated.Value(0)).current;
  const venueShakeAnim = useRef(new Animated.Value(0)).current;
  const team1ShakeAnim = useRef(new Animated.Value(0)).current;
  const team2ShakeAnim = useRef(new Animated.Value(0)).current;

  // slideAnim is for the modal, initial value is the distance to slide up from the bottom
  const slideAnim = useRef(new Animated.Value(500)).current;
  const navigation = useAppNavigation();

  useEffect(() => {
    if (teamModalVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [teamModalVisible]);

  const triggerShake = (animValue) => {
    Vibration.vibrate(200);
    animValue.setValue(0);
    Animated.sequence([
      Animated.timing(animValue, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const searchTeamsByName = async (name) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) throw new Error('Please login again');
      setLoading(true);

      const response = await apiService({
        endpoint: 'teams/search/name',
        method: 'GET',
        params: { name }
      });

      if (response.success) {
        setTeamResults(response.data.data);
      } else {
        setTeamResults([]);
        console.error('Search error:', response.error);
      }
    } catch (err) {
      console.error('Failed to search for teams', err);
      setTeamResults([]);
    } finally {
      setLoading(false);
    }
  };

  function debounce(func, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  const debouncedSearch = useCallback(
    debounce((name) => searchTeamsByName(name), 500),
    []
  );

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.length > 2) {
      debouncedSearch(text);
    } else {
      setTeamResults([]);
    }
  };

  const selectTeam = (team) => {
    if (selectedTeam === 'team1') {
      setTeam1Name(team.name);
      setTeam1Id(team.id);
      setTeam1Logo(team.logoPath);
      setTeam1Error('');
    } else {
      setTeam2Name(team.name);
      setTeam2Id(team.id);
      setTeam2Logo(team.logoPath);
      setTeam2Error('');
    }
    setTeamResults([]);
    setTeamModalVisible(false);
    setSearchQuery('');
  };

  const handleNextButtonClick = async () => {
    let hasError = false;

    setOversError('');
    setVenueError('');
    setTeam1Error('');
    setTeam2Error('');

    if (!overs) {
      setOversError('Overs is required*');
      triggerShake(oversShakeAnim);
      hasError = true;
    } else if (isNaN(parseInt(overs, 10)) || parseInt(overs, 10) <= 0) {
      setOversError('Please enter a valid number of overs*');
      triggerShake(oversShakeAnim);
      hasError = true;
    }

    if (!venue) {
      setVenueError('Venue is required*');
      triggerShake(venueShakeAnim);
      hasError = true;
    }
    if (!team1Id) {
      setTeam1Error('Team 1 is required*');
      triggerShake(team1ShakeAnim);
      hasError = true;
    }
    if (!team2Id) {
      setTeam2Error('Team 2 is required*');
      triggerShake(team2ShakeAnim);
      hasError = true;
    }

    if (team1Id && team2Id && team1Id === team2Id) {
      setTeam1Error('Cannot be same team*');
      setTeam2Error('Cannot be same team*');
      triggerShake(team1ShakeAnim);
      triggerShake(team2ShakeAnim);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const matchDetails = {
      overs: parseInt(overs, 10),
      venue,
      team1Id,
      team1Name,
      team1Logo,
      team2Id,
      team2Name,
      team2Logo,
    };

    const requestBody = {
      tournamentName: null,
      team1Id,
      team2Id,
      overs: matchDetails.overs,
      matchDate: istDateTime.format('YYYY-MM-DD'),
      matchTime: istDateTime.format('HH:mm'),
      venue,
    };

    console.log("InstantMatch: Navigating immediately to SelectPlayingII with initial matchDetails and requestBody.");
    navigation.navigate('MatchOperatives', { matchDetails, requestBody, source: 'instant' });
  };

  const scheduleMatchHandler = () => {
    navigation.navigate('ScheduleMatch');
  };

  const primaryGradient = AppGradients.primaryCard;
  const buttonGradient = AppGradients.primaryButton;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.white} translucent={false} />

      <SafeAreaView style={styles.container}>
        {/* PRIMARY KEYBOARD AVOIDING VIEW FOR MAIN SCREEN INPUTS */}
        <KeyboardAvoidingView 
          style={styles.instantMatchContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          // Adjust this offset if needed to clear header/status bar on Android
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} 
        >
          <View style={styles.contentWrapper}>
            <Text style={styles.title}>Set Up Your Match</Text>

            <View style={styles.teamSelectionContainer}>
              <View style={styles.teamColumn}>
                {team1Error ? <Text style={styles.errorText}>{team1Error}</Text> : null}
                <Animated.View style={[{ transform: [{ translateX: team1ShakeAnim }] }, team1Error ? styles.errorBorderStrong : null, styles.teamCardOuter]}>
                  <TouchableOpacity
                    style={styles.teamCircleButtonTouchable}
                    onPress={() => {
                      setSelectedTeam('team1');
                      setTeamModalVisible(true);
                    }}
                  >
                    <LinearGradient colors={primaryGradient} style={styles.teamCircleGradient}>
                      {team1Logo ? (
                        <Image source={{ uri: team1Logo }} style={styles.teamLogoCircle} />
                      ) : (
                        <Icon name="add-circle-outline" size={40} color={AppColors.white} />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <Text style={styles.teamNameBelowCircle}>{team1Name || ''}</Text>
                </Animated.View>
              </View>

              <View style={styles.vsTextContainer}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              <View style={styles.teamColumn}>
                {team2Error ? <Text style={styles.errorText}>{team2Error}</Text> : null}
                <Animated.View style={[{ transform: [{ translateX: team2ShakeAnim }] }, team2Error ? styles.errorBorderStrong : null, styles.teamCardOuter]}>
                  <TouchableOpacity
                    style={styles.teamCircleButtonTouchable}
                    onPress={() => {
                      setSelectedTeam('team2');
                      setTeamModalVisible(true);
                    }}
                  >
                    <LinearGradient colors={primaryGradient} style={styles.teamCircleGradient}>
                      {team2Logo ? (
                        <Image source={{ uri: team2Logo }} style={styles.teamLogoCircle} />
                      ) : (
                        <Icon name="add-circle-outline" size={40} color={AppColors.white} />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <Text style={styles.teamNameBelowCircle}>{team2Name || ''}</Text>
                </Animated.View>
              </View>
            </View>

            <View style={styles.inputSection}>
              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>Overs</Text>
                {oversError ? <Text style={styles.errorText}>{oversError}</Text> : null}
                <Animated.View style={[{ transform: [{ translateX: oversShakeAnim }] }, styles.inputWrapper, oversError ? styles.errorBorder : null]}>
                  <Icon name="sports-baseball" size={20} color={AppColors.lightText} style={styles.inputIcon} />
                  <TextInput
                    inputMode="numeric"
                    keyboardType="numeric"
                    value={overs}
                    onChangeText={(text) => {
                      setOvers(text);
                      setOversError('');
                    }}
                    placeholder="e.g., 20"
                    placeholderTextColor={AppColors.placeholderText}
                    style={styles.input}
                  />
                </Animated.View>
              </View>
              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>Venue</Text>
                {venueError ? <Text style={styles.errorText}>{venueError}</Text> : null}
                <Animated.View style={[{ transform: [{ translateX: venueShakeAnim }] }, styles.inputWrapper, venueError ? styles.errorBorder : null]}>
                  <Icon name="place" size={20} color={AppColors.lightText} style={styles.inputIcon} />
                  <TextInput
                    value={venue}
                    onChangeText={(text) => {
                      setVenue(text);
                      setVenueError('');
                    }}
                    placeholder="e.g., Eden Gardens"
                    placeholderTextColor={AppColors.placeholderText}
                    style={styles.input}
                  />
                </Animated.View>
              </View>
            </View>

            <TouchableOpacity onPress={scheduleMatchHandler}>
              <Text style={styles.upcomingMatchLink}>
                Looking for a scheduled match? <Text style={styles.highlightText}>Schedule an upcoming match here.</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextButtonClick}
            >
              <LinearGradient colors={buttonGradient} style={styles.nextButtonGradient}>
                <Text style={styles.nextButtonText}>Proceed</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* TEAM SELECTION MODAL */}
        <Modal visible={teamModalVisible} transparent animationType="fade">
          {/* Pressable handles closing the modal when tapping outside */}
          <Pressable style={styles.modalOverlay} onPress={() => setTeamModalVisible(false)}>
            {/* KAV for the modal itself to move it above the keyboard */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.teamModalContentContainer}
              // keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200} // Removed unnecessary offset here
            >
              <Animated.View style={[styles.teamModalContent, { transform: [{ translateY: slideAnim }] }]}>
                <Text style={styles.modalTitle}>Select Team</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search team by name..."
                  placeholderTextColor={AppColors.placeholderText}
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={AppColors.primaryBlue} />
                    <Text style={styles.loadingText}>Searching teams...</Text>
                  </View>
                ) : teamResults.length > 0 ? (
                  <FlatList
                    data={teamResults}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity onPress={() => selectTeam(item)} style={styles.teamModalListItemTouchable}>
                        <View style={styles.teamCard}>
                          {item.logoPath ? (
                            <Image source={{ uri: item.logoPath }} style={styles.teamListLogo} />
                          ) : (
                            <Icon name="sports-cricket" size={30} color={AppColors.lightText} style={styles.teamListLogoPlaceholder} />
                          )}
                          <View style={styles.teamDetails}>
                            <Text style={styles.teamNameList}>{item.name}</Text>
                            {item.captain?.name && (
                              <Text style={styles.teamCaptain}>Captain: {item.captain.name}</Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={() => (
                      <View style={styles.noResultsContainer}>
                        <Icon name="info-outline" size={40} color={AppColors.infoGrey} />
                        <Text style={styles.noResultsText}>No teams found. Try a different name.</Text>
                      </View>
                    )}
                    keyboardShouldPersistTaps="handled"
                  />
                ) : (
                  <View style={styles.noResultsContainer}>
                    <Icon name="search" size={40} color={AppColors.infoGrey} />
                    <Text style={styles.noResultsText}>Start typing to search for teams.</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.closeModalButton} onPress={() => setTeamModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </Animated.View>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </>
  );
};

export default InstantMatch;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  instantMatchContainer: {
    flex: 1,
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // KAV handles this now
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
    // Ensure content can flex up/down
    flexGrow: 1, 
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 26,
    marginVertical: 35,
    color: AppColors.gray,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  teamSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    height: 150,
  },
  teamColumn: {
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  teamCardOuter: {
    borderRadius: 60,
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamCircleButtonTouchable: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: AppColors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamCircleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  teamNameBelowCircle: {
    color: AppColors.darkText,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 5,
    flexWrap: 'wrap',
  },
  vsTextContainer: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.lightText,
  },
  inputSection: {
    marginBottom: 30,
  },
  inputField: {
    marginBottom: 15,
  },
  inputLabel: {
    color: AppColors.mediumText,
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: AppColors.inputBorder,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: AppColors.mediumText,
    fontSize: 16,
    paddingVertical: 12,
  },
  upcomingMatchLink: {
    color: AppColors.lightText,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  highlightText: {
    color: AppColors.primaryBlue,
    fontWeight: 'bold',
  },
  nextButton: {
    borderRadius: 15,
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'center',
    marginTop: 20,
    elevation: 8,
    shadowColor: AppColors.primaryBlue,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  nextButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: AppColors.white,
    fontSize: 19,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // --- MODAL STYLES (MODIFIED) ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // Aligns modal to the bottom
    backgroundColor: AppColors.overlay,
  },
  teamModalContentContainer: {
    flex: 1,
    justifyContent: 'flex-end', // Aligns Animated.View to the bottom
  },
  teamModalContent: {
    backgroundColor: AppColors.white,
    // MODIFIED: Use top radii for bottom-aligned modal
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25, 
    // REMOVED: maxHeight to allow KAV to size it correctly
    padding: 25,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.mediumText,
    marginBottom: 20,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: AppColors.lightBackground,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.inputBorder,
  },
  teamModalListItemTouchable: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: AppColors.cardBackground,
    elevation: 3,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  teamListLogo: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 18,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
  },
  teamListLogoPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 18,
    backgroundColor: AppColors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamDetails: {
    flex: 1,
  },
  teamNameList: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.darkText,
  },
  teamCaptain: {
    fontSize: 13,
    color: AppColors.lightText,
    marginTop: 3,
  },
  closeModalButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: AppColors.inputBackground,
    elevation: 5,
    shadowColor: AppColors.gray,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  closeButtonText: {
    color: AppColors.darkText,
    fontSize: 17,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: AppColors.lightText,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: AppColors.lightBackground,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: AppColors.inputBorder,
  },
  noResultsText: {
    marginTop: 10,
    fontSize: 15,
    color: AppColors.lightText,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Error Styles
  errorBorder: {
    borderColor: AppColors.errorRed,
    borderWidth: 2,
  },
  errorBorderStrong: {
    borderColor: AppColors.errorRed,
    borderWidth: 3,
    borderRadius: 60,
  },
  errorText: {
    color: AppColors.errorRed,
    fontSize: 13,
    marginBottom: 5,
    fontWeight: '600',
    marginLeft: 5,
    textAlign: 'center',
    width: '100%',
  }
});