import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiService from '../../APIservices';

const { width } = Dimensions.get('window');

// --- APP COLORS (Enhanced Palette) ---
const AppColors = {
  primary: '#0575E6', // Vibrant Blue
  secondary: '#00D2D3', // Teal Accent (for icons/highlights)
  background: '#F8F9FA', // Light page background
  card: '#FFFFFF',
  textDark: '#212529',
  textLight: '#6C757D',
  border: '#DEE2E6',
  error: '#DC3545',
  success: '#28A745',
  shadowColor: 'rgba(0,0,0,0.1)',
};

const Info = ({ id, isCreator }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tournamentDetails, setTournamentDetails] = useState(null);
  const [editingTournament, setEditingTournament] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [editedDetails, setEditedDetails] = useState({
    name: '',
    type: '',
    ballType: '',
    venues: [''],
    format: '',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchTournamentDetails = async (id) => {
    try {
      setLoading(true);
      const response = await apiService({
        endpoint: `tournaments/${id}`,
        method: 'GET',
      });

      if (response.success) {
        const data = response.data.data;
        setTournamentDetails(data);
        setEditedDetails({
          name: data.name || '',
          // Ensure type is string for TextInput
          type: String(data.type) || '', 
          ballType: data.ballType || '',
          venues: data.venues || [],
          format: data.format || '',
        });

        const fetchedStartDate = data.startDate
          ? new Date(data.startDate[0], data.startDate[1] - 1, data.startDate[2])
          : new Date();
        const fetchedEndDate = data.endDate
          ? new Date(data.endDate[0], data.endDate[1] - 1, data.endDate[2])
          : new Date();

        setStartDate(fetchedStartDate);
        setEndDate(fetchedEndDate);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      } else {
        setError('Failed to fetch tournament details');
      }
    } catch (err) {
      setError('Failed to fetch tournament details');
    } finally {
      setLoading(false);
    }
  };

  const updateTournamentDetails = async () => {
    try {
      setLoading(true);

      if (endDate < startDate) {
        setError('End date cannot be before start date.');
        setLoading(false);
        return;
      }

      const formattedStartDate = [startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()];
      const formattedEndDate = [endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate()];

      const cleanVenues = editedDetails.venues.map(v => v.trim()).filter(v => v.length > 0);

      const dataToSend = {
        name: editedDetails.name,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        // Ensure type is sent as a number
        type: Number(editedDetails.type),
        ballType: editedDetails.ballType,
        venues: cleanVenues,
        format: editedDetails.format,
      };

      const response = await apiService({
        endpoint: `tournaments/${id}`,
        method: 'PUT',
        body: dataToSend,
      });

      if (response.success) {
        setEditingTournament(false);
        setError(null); // Clear error on success
        await fetchTournamentDetails(id);
      } else {
        setError(response.error?.message || 'Failed to update tournament details');
      }
    } catch (err) {
      setError('Failed to update tournament details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentDetails(id);
  }, [id]);

  const onDateChange = (isStart) => (event, selectedDate) => {
    if (Platform.OS === 'android') {
        isStart ? setShowStartDatePicker(false) : setShowEndDatePicker(false);
    }

    if (selectedDate) {
        if (isStart) {
            setStartDate(selectedDate);
            if (selectedDate > endDate) {
                setEndDate(selectedDate);
            }
        } else {
            setEndDate(selectedDate);
        }
    }
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading && !tournamentDetails ? ( // Show full-screen loader initially
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} style={styles.loader} />
        </View>
      ) : error && !tournamentDetails ? ( // Show full-screen error if initial fetch fails
        <View style={styles.centeredContainer}>
          <Icon name="error-outline" size={50} color={AppColors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.primaryButton, { width: 'auto' }]}
            onPress={() => fetchTournamentDetails(id)}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : tournamentDetails ? (
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>{tournamentDetails.name}</Text>
              {isCreator && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setEditingTournament(true);
                    setError(null); // Clear error when opening modal
                  }}
                >
                  <Icon name="edit" size={20} color={AppColors.primary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.dateLocationContainer}>
              <View style={styles.dateLocationRow}>
                <Icon name="event" size={16} color={AppColors.textLight} />
                <Text style={styles.dateLocationText}>
                  {tournamentDetails.startDate
                    ? moment(new Date(tournamentDetails.startDate[0], tournamentDetails.startDate[1] - 1, tournamentDetails.startDate[2])).format('MMM DD, YYYY')
                    : 'N/A'}
                  {' - '}
                  {tournamentDetails.endDate
                    ? moment(new Date(tournamentDetails.endDate[0], tournamentDetails.endDate[1] - 1, tournamentDetails.endDate[2])).format('MMM DD, YYYY')
                    : 'N/A'}
                </Text>
              </View>
              <View style={styles.dateLocationRow}>
                <Icon name="location-on" size={16} color={AppColors.textLight} />
                <Text style={styles.dateLocationText}>
                  {tournamentDetails.venues?.join(", ") || 'Multiple Venues'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.contentContainer}>
            {/* Organizer Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="person" size={20} color={AppColors.primary} />
                <Text style={styles.cardTitle}>Organizer</Text>
              </View>
              <Text style={styles.cardContent}>
                {tournamentDetails.creatorName?.name || 'N/A'}
              </Text>
            </View>

            {/* Teams Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="groups" size={20} color={AppColors.primary} />
                <Text style={styles.cardTitle}>Teams</Text>
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowTeamsModal(true)}
                >
                  <Icon name="visibility" size={20} color={AppColors.secondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.teamsCount}>
                {tournamentDetails.teamNames?.length || 0} teams participating
              </Text>
            </View>

            {/* Details Grid */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Tournament Details</Text>
              <View style={styles.detailGrid}>
                {/* Overs */}
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Icon name="timer" size={20} color={AppColors.primary} />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Overs</Text>
                    <Text style={styles.detailValue}>{tournamentDetails.type || 'N/A'}</Text>
                  </View>
                </View>

                {/* Ball Type */}
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Icon name="sports-cricket" size={20} color={AppColors.primary} />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Ball Type</Text>
                    <Text style={styles.detailValue}>{tournamentDetails.ballType || 'N/A'}</Text>
                  </View>
                </View>

                {/* Format */}
                <View style={[styles.detailItem, { borderBottomWidth: 0 }]}>
                  <View style={styles.detailIconContainer}>
                    <Icon name="description" size={20} color={AppColors.primary} />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Format</Text>
                    <Text style={styles.detailValue}>{tournamentDetails.format || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      ) : (
        <View style={styles.centeredContainer}>
          <Icon name="info-outline" size={50} color={AppColors.textLight} />
          <Text style={styles.emptyText}>No tournament details available</Text>
        </View>
      )}

      {/* Teams Modal - Enhanced */}
      <Modal
        visible={showTeamsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTeamsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.teamsModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Participating Teams</Text>
              <TouchableOpacity
                onPress={() => setShowTeamsModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color={AppColors.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.teamsCountHeader}>
              <Text style={styles.teamsCountText}>
                {tournamentDetails?.teamNames?.length || 0} teams participating
              </Text>
            </View>

            <ScrollView style={styles.teamsList}>
              {tournamentDetails?.teamNames?.map((team, index) => (
                <View key={index} style={styles.teamListItem}>
                  <View style={styles.teamNumber}>
                    <Text style={styles.teamNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.teamListName}>{team?.name || 'Unknown Team'}</Text>
                </View>
              ))}

              {(!tournamentDetails?.teamNames || tournamentDetails.teamNames.length === 0) && (
                <View style={styles.noTeamsContainer}>
                  <Icon name="info-outline" size={40} color={AppColors.textLight} />
                  <Text style={styles.noTeamsText}>No teams registered yet</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Editing tournament modal - Enhanced */}
      <Modal
        visible={editingTournament}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingTournament(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Tournament</Text>
              <TouchableOpacity
                onPress={() => setEditingTournament(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color={AppColors.textLight} />
              </TouchableOpacity>
            </View>
            
            {error && <Text style={[styles.errorText, { paddingHorizontal: 20 }]}>{error}</Text>}

            <ScrollView contentContainerStyle={styles.modalScrollView}>
              {/* Tournament Name */}
              <Text style={styles.inputLabel}>Tournament Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Tournament Name"
                placeholderTextColor={AppColors.textLight}
                value={editedDetails.name}
                onChangeText={(text) => setEditedDetails({ ...editedDetails, name: text })}
              />

              {/* Dates */}
              <Text style={styles.inputLabel}>Tournament Dates</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput]}
                  onPress={() => setShowStartDatePicker(true)}
                  disabled={loading}
                >
                  <Text style={styles.placeholderText}>
                    {moment(startDate).format('MMM D, YYYY')}
                  </Text>
                  <Icon name="calendar-today" size={20} color={AppColors.primary} />
                </TouchableOpacity>

                <Text style={styles.dateSeparator}>to</Text>

                <TouchableOpacity
                  style={[styles.input, styles.dateInput]}
                  onPress={() => setShowEndDatePicker(true)}
                  disabled={loading}
                >
                  <Text style={styles.placeholderText}>
                    {moment(endDate).format('MMM D, YYYY')}
                  </Text>
                  <Icon name="calendar-today" size={20} color={AppColors.primary} />
                </TouchableOpacity>
              </View>
              
              {/* Date Pickers */}
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={onDateChange(true)}
                />
              )}

              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  minimumDate={startDate}
                  onChange={onDateChange(false)}
                />
              )}

              {/* Tournament Type */}
              <Text style={styles.inputLabel}>Overs</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 20 or 40"
                placeholderTextColor={AppColors.textLight}
                value={editedDetails.type}
                onChangeText={(text) => setEditedDetails({ ...editedDetails, type: text })}
                keyboardType="numeric"
              />

              {/* Ball Type */}
              <Text style={styles.inputLabel}>Ball Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Leather, Tennis"
                placeholderTextColor={AppColors.textLight}
                value={editedDetails.ballType}
                onChangeText={(text) => setEditedDetails({ ...editedDetails, ballType: text })}
              />

              {/* Format */}
              <Text style={styles.inputLabel}>Format</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., League, Knockout"
                placeholderTextColor={AppColors.textLight}
                value={editedDetails.format}
                onChangeText={(text) => setEditedDetails({ ...editedDetails, format: text })}
              />

              {/* Venues */}
              <Text style={styles.inputLabel}>Venues</Text>
              {editedDetails.venues.map((venue, index) => (
                <TextInput
                  key={index}
                  style={styles.input}
                  placeholder={`Venue ${index + 1}`}
                  placeholderTextColor={AppColors.textLight}
                  value={venue}
                  onChangeText={(text) => {
                    const newVenues = [...editedDetails.venues];
                    newVenues[index] = text;
                    setEditedDetails({ ...editedDetails, venues: newVenues });
                  }}
                />
              ))}

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() =>
                  setEditedDetails({
                    ...editedDetails,
                    venues: [...editedDetails.venues, ""],
                  })
                }
              >
                <Icon name="add" size={20} color={AppColors.primary} />
                <Text style={styles.secondaryButtonText}>Add Venue</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setEditingTournament(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={updateTournamentDetails}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={AppColors.card} />
                ) : (
                  <Text style={styles.buttonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 20,
    backgroundColor: AppColors.background,
  },
  animatedContainer: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    overflow: 'hidden',
    // Stronger shadow for modern feel
    shadowColor: AppColors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centeredContainer: {
    flex: 1,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: AppColors.card,
    borderRadius: 12,
    marginTop: 10,

  },
  loader: {
    marginBottom: 16
  },
  errorText: {
    color: AppColors.error,
    marginVertical: 16,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 10,
  },
  emptyText: {
    color: AppColors.textLight,
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500'
  },

  // --- Header Section Styles ---
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    backgroundColor: AppColors.background, // Light gray header background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: AppColors.textDark,
    flex: 1,
    marginRight: 12,
    lineHeight: 32,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: AppColors.primary + '10', // Very light primary background
  },
  dateLocationContainer: {
    paddingTop: 10,
  },
  dateLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateLocationText: {
    color: AppColors.textLight,
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  contentContainer: {
    padding: 20,
  },

  // --- Card Styles ---
  card: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
    shadowColor: AppColors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textDark,
    marginLeft: 10,
    flex: 1,
  },
  cardContent: {
    fontSize: 16,
    color: AppColors.textDark,
    fontWeight: '600',
  },
  eyeButton: {
    padding: 4,
  },
  teamsCount: {
    fontSize: 15,
    color: AppColors.textLight,
    fontWeight: '500',
  },

  // --- Details Grid Styles ---
  detailsSection: {
    marginTop: 8,
    padding: 10, // Slight padding to separate from cards above
    borderRadius: 12,
    backgroundColor: AppColors.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textDark,
    marginBottom: 16,
    paddingLeft: 10,
  },
  detailGrid: {
    flexDirection: 'column',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  detailIconContainer: {
    backgroundColor: AppColors.primary + '10', // Light primary color background
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailLabel: {
    fontSize: 13,
    color: AppColors.textLight,
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textDark,
  },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.shadowColor + '80', // Darker overlay
  },
  teamsModalContainer: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    width: "90%",
    maxHeight: "85%",
    overflow: 'hidden',
    shadowColor: AppColors.textDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  editModalContainer: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    width: "90%",
    maxHeight: "95%",
    shadowColor: AppColors.textDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.textDark,
  },
  closeButton: {
    padding: 4,
  },
  teamsCountHeader: {
    backgroundColor: AppColors.background,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  teamsCountText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.textDark,
    textAlign: 'center',
  },
  teamsList: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  teamListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border + '50',
  },
  teamNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamNumberText: {
    color: AppColors.card,
    fontWeight: '700',
    fontSize: 14,
  },
  teamListName: {
    fontSize: 16,
    color: AppColors.textDark,
    fontWeight: '600',
  },
  noTeamsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noTeamsText: {
    textAlign: 'center',
    color: AppColors.textLight,
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },

  // --- Edit Modal Inputs ---
  modalScrollView: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.textDark,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: AppColors.textDark,
    backgroundColor: AppColors.card,
    marginBottom: 12,
    // Slight inner shadow for depth
    shadowColor: AppColors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  dateSeparator: {
    marginHorizontal: 8,
    fontWeight: "600",
    color: AppColors.textLight,
    fontSize: 15,
  },
  placeholderText: {
    fontSize: 16,
    color: AppColors.textDark,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.secondary + '15',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.secondary + '50',
  },
  secondaryButtonText: {
    color: AppColors.primary,
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 15,
  },
  buttonText: {
    color: AppColors.card,
    fontWeight: "600",
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    backgroundColor: AppColors.background,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  cancelButtonText: {
    fontWeight: "600",
    fontSize: 16,
    color: AppColors.textDark,
  },
});

export default Info;