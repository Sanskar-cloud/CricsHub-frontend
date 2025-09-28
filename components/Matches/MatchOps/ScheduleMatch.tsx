import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Vibration,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Renamed from 'MaterialIcons' to 'Icon' for consistency
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiService from '../../APIservices';
import { AppGradients, AppColors, AppButtons } from '../../../assets/constants/colors.js';
import CustomAlertDialog from '../../Customs/CustomDialog.js'; // Import your custom dialog

const moment = require('moment-timezone');

const ScheduleMatch = ({ navigation }) => {
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  // State for inline error messages
  const [oversError, setOversError] = useState('');
  const [venueError, setVenueError] = useState('');
  const [team1Error, setTeam1Error] = useState('');
  const [team2Error, setTeam2Error] = useState('');
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');

  // State for CustomAlertDialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState('info');

  // State and Animated values for shaky animation
  const oversShakeAnim = useRef(new Animated.Value(0)).current;
  const venueShakeAnim = useRef(new Animated.Value(0)).current;
  const team1ShakeAnim = useRef(new Animated.Value(0)).current;
  const team2ShakeAnim = useRef(new Animated.Value(0)).current;
  const dateShakeAnim = useRef(new Animated.Value(0)).current;
  const timeShakeAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(500)).current;

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
        params: { name },
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

  const onChangeDate = (event, newDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (newDate) {
      setSelectedDate(newDate);
      setDateError('');
    }
  };

  const onChangeTime = (event, newTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (newTime) {
      setSelectedTime(newTime);
      setTimeError('');
    }
  };

  const handleNextButtonClick = async () => {
    let hasError = false;

    setOversError('');
    setVenueError('');
    setTeam1Error('');
    setTeam2Error('');
    setDateError('');
    setTimeError('');

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

    const now = moment();
    const selectedDateTime = moment(selectedDate).set({
      hour: moment(selectedTime).hour(),
      minute: moment(selectedTime).minute(),
      second: 0,
      millisecond: 0,
    });
    // Check if the selected date/time is in the past
    if (selectedDateTime.isSameOrBefore(now)) {
      setDateError('Date/Time must be in the future*');
      setTimeError('Date/Time must be in the future*');
      triggerShake(dateShakeAnim);
      triggerShake(timeShakeAnim);
      hasError = true;
    }


    if (hasError) {
      return;
    }

    if (!hasError) {
      const requestBody = {
        tournamentName: null,
        team1Id,
        team2Id,
        overs: parseInt(overs, 10),
        matchDate: selectedDateTime.format("YYYY-MM-DD"),
        matchTime: selectedDateTime.format("HH:mm"),
        venue,
      };

      navigation.navigate("MatchOperatives", {
        matchDetails: {
          overs,
          venue,
          team1Id,
          team1Name,
          team1Logo,
          team2Id,
          team2Name,
          team2Logo,
        },
        requestBody,
        source: "schedule"
      });
    }

    // try {
    //   const token = await AsyncStorage.getItem("jwtToken");
    //   if (!token) throw new Error("Please login again");

    //   setLoading(true);

    //   const requestBody = {
    //     tournamentName: null,
    //     team1Id,
    //     team2Id,
    //     overs: parseInt(overs, 10),
    //     matchDate: selectedDateTime.format("YYYY-MM-DD"),
    //     matchTime: selectedDateTime.format("HH:mm"),
    //     venue,
    //   };

    //   const response = await apiService({
    //     endpoint: 'matches/schedule',
    //     method: 'POST',
    //     body: requestBody,
    //   });

    //   if (response.success) {
    //     // Show success message in custom dialog
    //     setDialogTitle('Success!');
    //     setDialogMessage('Match scheduled successfully!');
    //     setDialogType('success');
    //     setDialogVisible(true);
    //     // Optionally, clear form fields after success
    //     setOvers('');
    //     setVenue('');
    //     setTeam1Name('');
    //     setTeam1Id(null);
    //     setTeam1Logo(null);
    //     setTeam2Name('');
    //     setTeam2Id(null);
    //     setTeam2Logo(null);
    //     setSelectedDate(new Date());
    //     setSelectedTime(new Date());
    //   } else {
    //     console.error("API Error:", response.error);
    //     // Show error message in custom dialog
    //     setDialogTitle('Error');
    //     setDialogMessage(response.error?.message || 'Failed to schedule match. Please try again.');
    //     setDialogType('error');
    //     setDialogVisible(true);
    //   }
    // } catch (err) {
    //   console.error("Network/Other Error:", err);
    //   // Show network/other error message in custom dialog
    //   setDialogTitle('Error');
    //   setDialogMessage('An unexpected error occurred. Please check your internet connection and try again.');
    //   setDialogType('error');
    //   setDialogVisible(true);
    // } finally {
    //   setLoading(false);
    // }
  };

  const instantMatchHandler = () => {
    navigation.navigate('InstantMatch');
  }

  const handleDialogClose = () => {
    setDialogVisible(false);

  };


  const primaryGradient = AppGradients.primaryCard;
  const buttonGradient = AppButtons.secondaryColor;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.white} translucent={false} />

      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.scheduleMatchContainer}>
              <View style={styles.contentWrapper}>
                <Text style={styles.title}>Schedule Your Match</Text>

                <View style={styles.teamSelectionContainer}>
                  {/* Team 1 Selection */}
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

                  {/* Team 2 Selection */}
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
                          setOversError(''); // Reset error on change
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
                          setVenueError(''); // Reset error on change
                        }}
                        placeholder="e.g., Eden Gardens"
                        placeholderTextColor={AppColors.placeholderText}
                        style={styles.input}
                      />
                    </Animated.View>
                  </View>

                  <View style={styles.inputField}>
                    <Text style={styles.inputLabel}>Date</Text>
                    {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
                    <Animated.View style={[{ transform: [{ translateX: dateShakeAnim }] }, styles.inputWrapper, dateError ? styles.errorBorder : null]}>
                      <Icon name="event" size={20} color={AppColors.lightText} style={styles.inputIcon} />
                      <TouchableOpacity
                        style={styles.datePickerInput}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Text style={selectedDate ? styles.inputText : styles.placeholderText}>
                          {selectedDate ? moment(selectedDate).format('DD-MMM-YYYY') : 'Select Date'}
                        </Text>
                      </TouchableOpacity>

                      {showDatePicker && (
                        <DateTimePicker
                          minimumDate={moment().toDate()}
                          value={selectedDate}
                          mode="date"
                          display="default"
                          onChange={onChangeDate}
                        />
                      )}
                    </Animated.View>
                  </View>

                  <View style={styles.inputField}>
                    <Text style={styles.inputLabel}>Time</Text>
                    {timeError ? <Text style={styles.errorText}>{timeError}</Text> : null}
                    <Animated.View style={[{ transform: [{ translateX: timeShakeAnim }] }, styles.inputWrapper, timeError ? styles.errorBorder : null]}>
                      <Icon name="access-time" size={20} color={AppColors.lightText} style={styles.inputIcon} />
                      <TouchableOpacity
                        style={styles.datePickerInput}
                        onPress={() => setShowTimePicker(true)}
                      >
                        <Text style={selectedTime ? styles.inputText : styles.placeholderText}>
                          {selectedTime ? moment(selectedTime).format("HH:mm") : "Select Time"}
                        </Text>
                      </TouchableOpacity>

                      {showTimePicker && (
                        <DateTimePicker
                          value={selectedTime}
                          mode="time"
                          display="default"
                          onChange={onChangeTime}
                        />
                      )}
                    </Animated.View>
                  </View>

                </View>

                <TouchableOpacity onPress={instantMatchHandler}>
                  <Text style={styles.upcomingMatchLink}>
                    Looking for an instant match? <Text style={styles.highlightText}>Create an instant match here.</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNextButtonClick}
                  disabled={loading}
                >
                  <LinearGradient colors={buttonGradient} style={styles.nextButtonGradient}>
                    {loading ? (
                      <ActivityIndicator size="small" color={AppColors.white} />
                    ) : (
                      <Text style={styles.nextButtonText}>Schedule Match</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Team Selection Modal */}
        <Modal visible={teamModalVisible} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setTeamModalVisible(false)}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.teamModalContentContainer}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}
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

        {/* Custom Alert Dialog */}
        <CustomAlertDialog
          visible={dialogVisible}
          title={dialogTitle}
          message={dialogMessage}
          onClose={handleDialogClose}
          type={dialogType}
        />
      </SafeAreaView>
    </>
  );
};

export default ScheduleMatch;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  scheduleMatchContainer: {
    flex: 1,
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    textAlign: 'center',
    fontSize: 26,
    marginVertical: 30,
    color: AppColors.gray,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  // --- Team Selection Styles (Updated) ---
  teamSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align to top

    height: 150, // Give enough height for the circle and text below
  },
  teamColumn: {
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  teamCardOuter: {
    borderRadius: 60, // Make it circular to house the inner circle
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent', // Default border for Animated.View
  },
  teamCircleButtonTouchable: {
    width: 100, // Inner circle size
    height: 100, // Inner circle size
    borderRadius: 50, // Half of width/height for perfect circle
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
    borderRadius: 50, // Match touchable for gradient
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoCircle: {
    width: 80, // Slightly smaller than button for border effect
    height: 80, // Slightly smaller than button for border effect
    borderRadius: 40, // Half of width/height for perfect circle
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)', // White border for logo
  },
  teamNameBelowCircle: {
    color: AppColors.darkText,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 5,
    flexWrap: 'wrap',
  },
  // --- End Team Selection Styles (Updated) ---

  vsTextContainer: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100, // Adjust height to align 'VS' properly
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.lightText,
  },
  inputSection: {
    marginBottom: 10,
  },
  inputField: {
    marginBottom: 10,
  },
  inputLabel: {
    color: AppColors.mediumText,
    fontSize: 15,
    marginTop: 2,
    marginBottom: 3,
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
  datePickerInput: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  inputText: {
    color: AppColors.mediumText,
    fontSize: 16,
  },
  placeholderText: {
    color: AppColors.placeholderText,
    fontSize: 16,
  },
  upcomingMatchLink: {
    color: AppColors.lightText,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
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
    marginTop: 15,
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

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Ensure modal overlay has background
  },
  teamModalContentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  teamModalContent: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: '80%',
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
  teamModalListItemTouchable: { // Renamed from teamCardTouchable to be specific to modal list
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
    borderRadius: 60, // Apply to outer container for team cards
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