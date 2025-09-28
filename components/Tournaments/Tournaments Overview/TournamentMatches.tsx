import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Modal, Pressable, ScrollView, Alert, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useAppNavigation } from '../../NavigationService';
import apiService from '../../APIservices';
import { AppColors } from '../../../assets/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

// Define the color palette and gradients for consistency from AllMatches component
const AppColorsFromAllMatches = {
  primaryBlue: '#34B8FF',
  secondaryBlue: '#1E88E5',
  white: '#FFFFFF',
  black: '#000000',
  darkText: '#333333',
  mediumText: '#555555',
  lightText: '#888888',
  lightBackground: '#F8F9FA',
  cardBackground: '#FFFFFF',
  errorRed: '#FF4757',
  successGreen: '#2ED573',
  liveGreen: '#2ED573',
  upcomingOrange: '#FF9F43',
  pastGray: '#747D8C',
  infoGrey: '#A4B0BE',
  cardBorder: '#E0E0E0',
};

export const Matches = ({ id, isCreator }) => {
  const [matchDetails, setMatchDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [venues, setVenues] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchDate, setMatchDate] = useState(new Date());
  const [matchTime, setMatchTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [venue, setVenue] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualMatchTeamA, setManualMatchTeamA] = useState(null);
  const [manualMatchTeamB, setManualMatchTeamB] = useState(null);
  const [manualMatchDate, setManualMatchDate] = useState(new Date());
  const [manualMatchTime, setManualMatchTime] = useState(new Date());
  const [manualMatchShowDatePicker, setManualMatchShowDatePicker] = useState(false);
  const [manualMatchShowTimePicker, setManualMatchShowTimePicker] = useState(false);
  const [manualMatchVenue, setManualMatchVenue] = useState('');
  const [tournamentData, setTournamentData] = useState(null);
  const [showPlayOffMatchScheduler, setShowPlayOffMatchScheduler] = useState(false);
  const [canSchedulePlayoff, setCanSchedulePlayoff] = useState(false);
  const navigation = useAppNavigation();

  const fetchMatchDetails = async (id) => {
    setLoading(true);
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      setError('Please Login Again');
      setLoading(false);
      return;
    }

    try {
      const response = await apiService({
        endpoint: `tournaments/${id}/matches`,
        method: 'GET',
      });

      if (response.success) {
        setMatchDetails(response.data.data);
        const allCompleted = response.data.data.length > 0 && response.data.data.every(
          (match) => match.status === 'Completed'
        );
        setCanSchedulePlayoff(allCompleted);
      } else {
        setError('Failed to fetch matches');
        console.error('Error fetching matches:', response.error);
      }
    } catch (error) {
      console.error('Unexpected error fetching matches:', error);
      setError('Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentDetails = async (id) => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      setError('Please Login Again');
      return;
    }

    try {
      const response = await apiService({
        endpoint: `tournaments/${id}`,
        method: 'GET',
      });

      if (response.success) {
        setTournamentData(response.data.data);
        setVenues(response.data.data.venues);
      } else {
        setError('Failed to fetch tournament details');
      }
    } catch (error) {
      setError('Failed to fetch tournament details');
    }
  };

  const aiMatchScheduleHandler = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      setError('Please Login Again');
      setLoading(false);
      return;
    }

    try {
      const venuesQuery = venues.join(',');
      const response = await apiService({
        endpoint: `tournaments/${id}/schedule-matches`,
        method: 'POST',
        params: { venues: venuesQuery },
        body: {},
      });

      if (response.success) {
        fetchMatchDetails(id);
      } else {
        setError('Failed to schedule matches');
        console.error('Schedule API error:', response.error);
      }
    } catch (error) {
      setError('Failed to schedule matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchDetails(id);
    fetchTournamentDetails(id);
  }, [id]);

  const handleScheduleSubmit = async () => {
    if (!selectedMatch) return;

    const selectedDateTime = moment(matchDate).set({
      hour: moment(matchTime).hour(),
      minute: moment(matchTime).minute(),
    });

    const payload = {
      matchDate: selectedDateTime.format("YYYY-MM-DD"),
      matchTime: selectedDateTime.format("HH:mm"),
      venue,
    };

    const { success, data, error } = await apiService({
      endpoint: `tournaments/${id}/matches/${selectedMatch.id}`,
      method: 'PUT',
      body: payload,
    });

    if (success) {
      console.log("Match scheduled successfully:", data);
      setModalVisible(false);
      fetchMatchDetails(id);
    } else {
      console.error("Error scheduling match:", error);
      Alert.alert("Error", "Failed to schedule match.");
    }
  };

  const manualMatchScheduleHandler = async () => {
    if (!manualMatchTeamA || !manualMatchTeamB || !manualMatchDate || !manualMatchTime || !manualMatchVenue) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (manualMatchTeamA === manualMatchTeamB) {
      Alert.alert("Error", "Team A and Team B cannot be the same.");
      return;
    }

    const selectedDateTime = moment(manualMatchDate).set({
      hour: moment(manualMatchTime).hour(),
      minute: moment(manualMatchTime).minute(),
    });

    const payload = {
      tournamentId: id,
      team1Id: manualMatchTeamA,
      team2Id: manualMatchTeamB,
      overs: +tournamentData.type,
      venue: manualMatchVenue,
      matchDate: selectedDateTime.format("YYYY-MM-DD"),
      matchTime: selectedDateTime.format("HH:mm"),
    };

    const { success, data, error } = await apiService({
      endpoint: 'matches/schedule',
      method: 'POST',
      body: payload,
    });

    if (success) {
      Alert.alert("Success", "Match scheduled successfully!");
      setIsManualModalOpen(false);
      fetchMatchDetails(id);
    } else {
      console.error("Manual match schedule error:", error);
      Alert.alert("Error", "Failed to schedule match manually.");
    }
  };

  const matchPressHandler = (match) => {
    const matchDetails = {
      overs: null,
      venue: match.venue,
      team1Id: match.team1.id,
      team1Name: match.team1.name,
      team1Logo: match.team1.logoPath,
      team2Id: match.team2.id,
      team2Name: match.team2.name,
      team2Logo: match.team2.logoPath,
    };
    if (isCreator)
      navigation.navigate('SelectPlayingII', { matchDetails, matchId: match.id });
    else
      navigation.navigate('CommentaryScorecard', { matchId: match.id });
  }

  const playoffMatchScheduleHandler = async () => {
    if (!manualMatchTeamA || !manualMatchTeamB || !manualMatchDate || !manualMatchTime || !manualMatchVenue) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (manualMatchTeamA === manualMatchTeamB) {
      Alert.alert("Error", "Team A and Team B cannot be the same.");
      return;
    }

    const selectedDateTime = moment(manualMatchDate).set({
      hour: moment(manualMatchTime).hour(),
      minute: moment(manualMatchTime).minute(),
    });

    const payload = {
      tournamentId: id,
      team1Id: manualMatchTeamA,
      team2Id: manualMatchTeamB,
      overs: +tournamentData.type,
      venue: manualMatchVenue,
      matchDate: selectedDateTime.format("YYYY-MM-DD"),
      matchTime: selectedDateTime.format("HH:mm"),
    };

    const { success, data, error } = await apiService({
      endpoint: 'matches/schedule-playoff',
      method: 'POST',
      body: payload,
    });

    if (success) {
      Alert.alert("Success", "Match scheduled successfully!");
      setIsManualModalOpen(false);
      fetchMatchDetails(id);
    } else {
      console.error("Manual match schedule error:", error);
      Alert.alert("Error", "Failed to schedule match manually.");
    }
  }

  const getStatusInfo = (match) => {
    if (match.status === 'Completed') return { text: 'Completed', color: AppColorsFromAllMatches.pastGray, icon: 'check-circle' };
    if (match.status === 'Live') return { text: 'LIVE', color: AppColorsFromAllMatches.liveGreen, icon: 'live-tv' };
    if (match.status === 'Upcoming') return { text: 'UPCOMING', color: AppColorsFromAllMatches.upcomingOrange, icon: 'schedule' };
    return { text: 'Unscheduled', color: AppColors.infoGrey, icon: 'info' };
  };

  const MatchCard = ({ match, onPress, isCreator, tournamentData }) => {
    const [scaleValue] = useState(new Animated.Value(1));

    const handlePressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    const statusInfo = getStatusInfo(match);

    const matchDateFormatted = match?.matchDate ? `${match.matchDate[2]}-${match.matchDate[1]}-${match.matchDate[0]}` : 'N/A';
    const matchTimeFormatted = match?.matchTime ? `${match.matchTime[0]}:${match.matchTime[1]}` : 'N/A';
    const showScores = match.status === 'Completed' || match.status === 'Live';
    const showWinner = match.status === 'Completed' && match.winner;

    return (
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.matchCard}
        >
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Icon name={statusInfo.icon} size={16} color={AppColorsFromAllMatches.white} />
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
          
          {/* Edit Icon for creator */}
          {isCreator && (
            <Pressable
              onPress={() => {
                setSelectedMatch(match);
                if(match.matchDate) {
                  setMatchDate(new Date(match.matchDate[0], match.matchDate[1] - 1, match.matchDate[2]));
                } else {
                  setMatchDate(new Date());
                }
                setMatchTime(new Date());
                setVenue(match.venue || '');
                setModalVisible(true);
              }}
              style={styles.editIconContainer}
            >
              <Icon name="edit" size={20} color={AppColorsFromAllMatches.primaryBlue} />
            </Pressable>
          )}

          {/* Tournament Header */}
          <LinearGradient
            colors={['#e3f2fd', '#ffffff']}
            style={styles.matchCardHeader}
          >
            <Text style={styles.tournamentName} numberOfLines={1}>
              {tournamentData?.name || 'Individual Match'}
            </Text>
          </LinearGradient>

          {/* Match Content */}
          <View style={styles.matchCardContent}>
            {/* Teams */}
            <View style={styles.teamRow}>
              <View style={styles.teamContainer}>
                <Image
                  source={{ uri: match?.team1?.logoPath }}
                  style={styles.teamLogo}
                />
                <Text style={styles.teamName} numberOfLines={1}>{match?.team1?.name}</Text>
                {showScores && (match?.team1Score || match?.team2Score) && (
                  <View style={styles.scoreBadge}>
                    <Text style={styles.teamScore}>{match?.team1Score || '0'}</Text>
                  </View>
                )}
              </View>

              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              <View style={styles.teamContainer}>
                <Image
                  source={{ uri: match?.team2?.logoPath }}
                  style={styles.teamLogo}
                />
                <Text style={styles.teamName} numberOfLines={1}>{match?.team2?.name}</Text>
                {showScores && (match?.team1Score || match?.team2Score) && (
                  <View style={styles.scoreBadge}>
                    <Text style={styles.teamScore}>{match?.team2Score || '0'}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Match Details */}
            <View style={styles.matchDetailsRow}>
              <Icon name="calendar-month" size={14} color={AppColorsFromAllMatches.infoGrey} />
              <Text style={styles.matchDetailText}>{matchDateFormatted}</Text>
              <Text style={styles.dotSeparator}>•</Text>

              {match?.matchTime && (
                <>
                  <Icon name="access-time" size={14} color={AppColorsFromAllMatches.infoGrey} />
                  <Text style={styles.matchDetailText}>{matchTimeFormatted}</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                </>
              )}

              <Icon name="location-on" size={14} color={AppColorsFromAllMatches.infoGrey} />
              <Text style={styles.matchDetailText} numberOfLines={1}>
                {match?.venue || 'Venue not specified'}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.matchCardFooter}>
            {showWinner ? (
              <Text style={styles.winnerText}>🏆 {match.winner} won the match!</Text>
            ) : (
              <Text style={styles.footerText}>
                {isCreator ? (match.status === 'Live' ? 'Tap to Score Match' : 'Tap to Setup Match') : 'Tap to View Match'}
              </Text>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.matchTab}>
      {loading && <ActivityIndicator size="large" color={AppColors.primary} />}
      {!loading && (
        <>
          {matchDetails.length > 0 ? (
            <ScrollView style={styles.matchesContainer}>
              {matchDetails.map((match, index) => (
                <MatchCard 
                  key={index} 
                  match={match} 
                  onPress={() => matchPressHandler(match)} 
                  isCreator={isCreator} 
                  tournamentData={tournamentData} 
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              {isCreator && (
                <>
                  <Text style={styles.emptyText}>No matches scheduled yet.</Text>
                  <Text style={styles.emptySubText}>How would you like to schedule the matches?</Text>
                  <View style={styles.scheduleOptions}>
                    <TouchableOpacity
                      style={[styles.scheduleButton, styles.manualButton]}
                      onPress={() => setIsManualModalOpen(true)}
                    >
                      <LinearGradient
                        colors={[AppColors.primary, '#0056b3']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Icon name="person" size={40} color="#fff" />
                        <Text style={styles.scheduleButtonText}>Manually</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.scheduleButton, styles.aiButton]}
                      onPress={aiMatchScheduleHandler}
                    >
                      <LinearGradient
                        colors={['#6c5ce7', '#a29bfe']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Icon name="smart-toy" size={40} color="#fff" />
                        <Text style={styles.scheduleButtonText}>Using AI</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        </>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {isCreator && matchDetails.length > 0 && (
        <TouchableOpacity
          style={[styles.bottomButton, styles.scheduleMoreButton]}
          onPress={() => setIsManualModalOpen(true)}
        >
          <LinearGradient
            colors={[AppColors.primary, '#0056b3']}
            style={styles.buttonGradientFull}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.bottomButtonText}>Schedule More Matches</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Edit Match Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[AppColors.primary, '#0056b3']}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.modalTitle}>Edit Match</Text>
              <Icon
                name="close"
                size={24}
                color="#fff"
                style={styles.closeIcon}
                onPress={() => setModalVisible(false)}
              />
            </LinearGradient>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.label}>Venue</Text>
              <View style={styles.inputContainer}>
                <Icon name="location-on" size={20} color={AppColors.primary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter venue"
                  placeholderTextColor="#999"
                  value={venue}
                  onChangeText={setVenue}
                  style={styles.input}
                />
              </View>

              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.inputContainer}
              >
                <Icon name="calendar-today" size={20} color={AppColors.primary} style={styles.inputIcon} />
                <Text style={styles.dateTimeText}>
                  {matchDate ? moment(matchDate).format('MMMM Do, YYYY') : 'Select Date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={matchDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setMatchDate(selectedDate);
                  }}
                />
              )}

              <Text style={styles.label}>Time</Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={styles.inputContainer}
              >
                <Icon name="access-time" size={20} color={AppColors.primary} style={styles.inputIcon} />
                <Text style={styles.dateTimeText}>
                  {matchTime ? moment(matchTime).format('h:mm A') : 'Select Time'}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={matchTime}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) setMatchTime(selectedTime);
                  }}
                />
              )}

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleScheduleSubmit}>
                  <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Manual Match Scheduling Modal */}
      {isManualModalOpen && (
        <Modal
          transparent={true}
          visible={isManualModalOpen}
          animationType="slide"
          onRequestClose={() => setIsManualModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerLarge}>
              <LinearGradient
                colors={[AppColors.primary, '#0056b3']}
                style={styles.modalHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalTitle}>Schedule Match Manually</Text>
                <Icon
                  name="close"
                  size={24}
                  color="#fff"
                  style={styles.closeIcon}
                  onPress={() => setIsManualModalOpen(false)}
                />
              </LinearGradient>

              <ScrollView style={styles.modalContent}>
                <Text style={styles.label}>Team A</Text>
                <View style={styles.pickerContainer}>
                  <Icon name="people" size={20} color={AppColors.primary} style={styles.pickerIcon} />
                  <Picker
                    selectedValue={manualMatchTeamA}
                    onValueChange={(itemValue) => setManualMatchTeamA(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Team A" value="" />
                    {tournamentData?.teamNames.map((team) => (
                      <Picker.Item key={team.id} label={team.name} value={team.id} />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.label}>Team B</Text>
                <View style={styles.pickerContainer}>
                  <Icon name="people" size={20} color={AppColors.primary} style={styles.pickerIcon} />
                  <Picker
                    selectedValue={manualMatchTeamB}
                    onValueChange={(itemValue) => setManualMatchTeamB(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Team B" value="" />
                    {tournamentData?.teamNames.map((team) => (
                      <Picker.Item key={team.id} label={team.name} value={team.id} />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.label}>Date</Text>
                <TouchableOpacity
                  onPress={() => setManualMatchShowDatePicker(true)}
                  style={styles.inputContainer}
                >
                  <Icon name="calendar-today" size={20} color={AppColors.primary} style={styles.inputIcon} />
                  <Text style={styles.dateTimeText}>
                    {manualMatchDate ? moment(manualMatchDate).format('MMMM Do, YYYY') : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                {manualMatchShowDatePicker && (
                  <DateTimePicker
                    value={manualMatchDate || new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setManualMatchShowDatePicker(false);
                      if (selectedDate) setManualMatchDate(selectedDate);
                    }}
                  />
                )}

                <Text style={styles.label}>Time</Text>
                <TouchableOpacity
                  onPress={() => setManualMatchShowTimePicker(true)}
                  style={styles.inputContainer}
                >
                  <Icon name="access-time" size={20} color={AppColors.primary} style={styles.inputIcon} />
                  <Text style={styles.dateTimeText}>
                    {manualMatchTime ? moment(manualMatchTime).format('h:mm A') : 'Select Time'}
                  </Text>
                </TouchableOpacity>
                {manualMatchShowTimePicker && (
                  <DateTimePicker
                    value={manualMatchTime || new Date()}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setManualMatchShowTimePicker(false);
                      if (selectedTime) setManualMatchTime(selectedTime);
                    }}
                  />
                )}

                <Text style={styles.label}>Venue</Text>
                <View style={styles.pickerContainer}>
                  <Icon name="location-on" size={20} color={AppColors.primary} style={styles.pickerIcon} />
                  <Picker
                    selectedValue={manualMatchVenue}
                    onValueChange={(itemValue) => setManualMatchVenue(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Venue" value="" />
                    {tournamentData?.venues.map((venue, index) => (
                      <Picker.Item key={index} label={venue} value={venue} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={manualMatchScheduleHandler}>
                    <Text style={styles.buttonText}>Schedule Match</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsManualModalOpen(false)} style={styles.cancelBtn}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Playoff Match Scheduling Modal */}
      <Modal
        visible={showPlayOffMatchScheduler}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlayOffMatchScheduler(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainerLarge}>
            <LinearGradient
              colors={['#ff7e5f', '#feb47b']}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.modalTitle}>Schedule Playoff Match</Text>
              <Icon
                name="close"
                size={24}
                color="#fff"
                style={styles.closeIcon}
                onPress={() => setShowPlayOffMatchScheduler(false)}
              />
            </LinearGradient>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.label}>Team A</Text>
              <View style={styles.pickerContainer}>
                <Icon name="people" size={20} color="#ff7e5f" style={styles.pickerIcon} />
                <Picker
                  selectedValue={manualMatchTeamA}
                  onValueChange={(itemValue) => setManualMatchTeamA(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Team A" value="" />
                  {tournamentData?.teamNames.map((team) => (
                    <Picker.Item key={team.id} label={team.name} value={team.id} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Team B</Text>
              <View style={styles.pickerContainer}>
                <Icon name="people" size={20} color="#ff7e5f" style={styles.pickerIcon} />
                <Picker
                  selectedValue={manualMatchTeamB}
                  onValueChange={(itemValue) => setManualMatchTeamB(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Team B" value="" />
                  {tournamentData?.teamNames.map((team) => (
                    <Picker.Item key={team.id} label={team.name} value={team.id} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                onPress={() => setManualMatchShowDatePicker(true)}
                style={styles.inputContainer}
              >
                <Icon name="calendar-today" size={20} color="#ff7e5f" style={styles.inputIcon} />
                <Text style={styles.dateTimeText}>
                  {manualMatchDate ? moment(manualMatchDate).format('MMMM Do, YYYY') : 'Select Date'}
                </Text>
              </TouchableOpacity>
              {manualMatchShowDatePicker && (
                <DateTimePicker
                  value={manualMatchDate || new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setManualMatchShowDatePicker(false);
                    if (selectedDate) setManualMatchDate(selectedDate);
                  }}
                />
              )}

              <Text style={styles.label}>Time</Text>
              <TouchableOpacity
                onPress={() => setManualMatchShowTimePicker(true)}
                style={styles.inputContainer}
              >
                <Icon name="access-time" size={20} color="#ff7e5f" style={styles.inputIcon} />
                <Text style={styles.dateTimeText}>
                  {manualMatchTime ? moment(manualMatchTime).format('h:mm A') : 'Select Time'}
                </Text>
              </TouchableOpacity>
              {manualMatchShowTimePicker && (
                <DateTimePicker
                  value={manualMatchTime || new Date()}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setManualMatchShowTimePicker(false);
                    if (selectedTime) setManualMatchTime(selectedTime);
                  }}
                />
              )}

              <Text style={styles.label}>Venue</Text>
              <View style={styles.pickerContainer}>
                <Icon name="location-on" size={20} color="#ff7e5f" style={styles.pickerIcon} />
                <Picker
                  selectedValue={manualMatchVenue}
                  onValueChange={(itemValue) => setManualMatchVenue(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Venue" value="" />
                  {tournamentData?.venues.map((venue, index) => (
                    <Picker.Item key={index} label={venue} value={venue} />
                  ))}
                </Picker>
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: '#ff7e5f' }]}
                  onPress={playoffMatchScheduleHandler}
                >
                  <Text style={styles.buttonText}>Schedule Playoff</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowPlayOffMatchScheduler(false)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  matchTab: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  matchesContainer: {
    padding: 16,
  },
  
  // New Styles from AllMatches component
  matchCard: {
    backgroundColor: AppColorsFromAllMatches.white,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    shadowColor: AppColorsFromAllMatches.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: AppColorsFromAllMatches.white,
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  editIconContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    padding: 5,
  },
  matchCardHeader: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: 'center',
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColorsFromAllMatches.secondaryBlue,
    textAlign: 'center',
  },
  matchCardContent: {
    padding: 15,
    alignItems: 'center',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  teamLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: AppColorsFromAllMatches.primaryBlue,
    backgroundColor: AppColorsFromAllMatches.lightBackground,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColorsFromAllMatches.darkText,
    textAlign: 'center',
    marginBottom: 3,
  },
  teamScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColorsFromAllMatches.primaryBlue,
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColorsFromAllMatches.mediumText,
    marginBottom: 3,
  },
  matchDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: AppColorsFromAllMatches.cardBorder,
    paddingTop: 12,
    width: '100%',
  },
  matchDetailText: {
    marginLeft: 4,
    fontSize: 12,
    color: AppColorsFromAllMatches.mediumText,
  },
  dotSeparator: {
    fontSize: 12,
    color: AppColorsFromAllMatches.infoGrey,
    marginHorizontal: 6,
  },
  matchCardFooter: {
    padding: 12,
    backgroundColor: AppColorsFromAllMatches.lightBackground,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    alignItems: 'center',
  },
  winnerText: {
    color: AppColorsFromAllMatches.successGreen,
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    color: AppColorsFromAllMatches.mediumText,
    fontSize: 14,
  },
  scoreBadge: {
    backgroundColor: AppColorsFromAllMatches.lightBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },

  // Existing styles that were not changed
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: '20%',
  },
  emptyText: {
    fontSize: 20,
    color: AppColorsFromAllMatches.darkText,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: 16,
    color: AppColorsFromAllMatches.mediumText,
    textAlign: 'center',
    marginBottom: 30,
  },
  scheduleOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  scheduleButton: {
    width: 140,
    height: 140,
    marginHorizontal: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  manualButton: {
    shadowColor: AppColorsFromAllMatches.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  aiButton: {
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
  },
  errorText: {
    color: AppColorsFromAllMatches.errorRed,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalContainerLarge: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeIcon: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    color: AppColorsFromAllMatches.darkText,
    marginBottom: 8,
    fontWeight: '600',
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: AppColorsFromAllMatches.darkText,
  },
  dateTimeText: {
    fontSize: 16,
    color: AppColorsFromAllMatches.darkText,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  pickerIcon: {
    marginRight: 10,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 20,
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: AppColorsFromAllMatches.primaryBlue,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelBtn: {
    backgroundColor: AppColorsFromAllMatches.errorRed,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomButton: {
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  playoffButton: {
    marginBottom: 8,
  },
  scheduleMoreButton: {
    marginTop: 8,
  },
  buttonGradientFull: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default Matches;