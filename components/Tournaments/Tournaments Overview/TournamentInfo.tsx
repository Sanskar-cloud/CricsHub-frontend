import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import apiService from '../../APIservices';

const { width } = Dimensions.get('window');

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
          {/* <Text style={styles.loadingText}>Loading tournament details...</Text> */}
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <Icon name="error-outline" size={50} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
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
                  style={styles.iconButton}
                  onPress={() => setEditingTournament(true)}
                >
                  <Icon name="edit" size={22} color="#4A90E2" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.dateLocationContainer}>
              <View style={styles.dateLocationRow}>
                <Icon name="event" size={16} color="#6c757d" />
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
                <Icon name="location-on" size={16} color="#6c757d" />
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
                <Icon name="person" size={20} color="#4A90E2" />
                <Text style={styles.cardTitle}>Organizer</Text>
              </View>
              <Text style={styles.cardContent}>
                {tournamentDetails.creatorName?.name || 'N/A'}
              </Text>
            </View>

            {/* Teams Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="groups" size={20} color="#4A90E2" />
                <Text style={styles.cardTitle}>Teams</Text>
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowTeamsModal(true)}
                >
                  <Icon name="visibility" size={20} color="#4A90E2" />
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
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Icon name="timer" size={20} color="#4A90E2" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Overs</Text>
                    <Text style={styles.detailValue}>{tournamentDetails.type || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Icon name="sports-cricket" size={20} color="#4A90E2" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Ball Type</Text>
                    <Text style={styles.detailValue}>{tournamentDetails.ballType || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Icon name="description" size={20} color="#4A90E2" />
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
          <Icon name="info-outline" size={50} color="#95A5A6" />
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
                <Icon name="close" size={24} color="#6c757d" />
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
                  <Icon name="info-outline" size={40} color="#95a5a6" />
                  <Text style={styles.noTeamsText}>No teams registered yet</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Editing tournament modal */}
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
                <Icon name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {/* Tournament Name */}
              <Text style={styles.inputLabel}>Tournament Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Tournament Name"
                value={editedDetails.name}
                onChangeText={(text) => setEditedDetails({ ...editedDetails, name: text })}
              />

              {/* Dates */}
              <Text style={styles.inputLabel}>Tournament Dates</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.placeholderText}>
                    {moment(startDate).format('MMM D, YYYY')}
                  </Text>
                  <Icon name="calendar-today" size={20} color="#4A90E2" />
                </TouchableOpacity>

                <Text style={styles.dateSeparator}>to</Text>

                <TouchableOpacity
                  style={[styles.input, styles.dateInput]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.placeholderText}>
                    {moment(endDate).format('MMM D, YYYY')}
                  </Text>
                  <Icon name="calendar-today" size={20} color="#4A90E2" />
                </TouchableOpacity>
              </View>

              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowStartDatePicker(false);
                    if (selectedDate) {
                      setStartDate(selectedDate);
                      if (selectedDate > endDate) {
                        setEndDate(selectedDate);
                      }
                    }
                  }}
                />
              )}

              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  minimumDate={startDate}
                  onChange={(event, selectedDate) => {
                    setShowEndDatePicker(false);
                    if (selectedDate) setEndDate(selectedDate);
                  }}
                />
              )}

              {/* Tournament Type */}
              <Text style={styles.inputLabel}>Overs</Text>
              <TextInput
                style={styles.input}
                placeholder="Number of overs"
                value={editedDetails.type}
                onChangeText={(text) => setEditedDetails({ ...editedDetails, type: text })}
                keyboardType="numeric"
              />

              {/* Ball Type */}
              <Text style={styles.inputLabel}>Ball Type</Text>
              <TextInput
                style={styles.input}
                placeholder="Ball type"
                value={editedDetails.ballType}
                onChangeText={(text) => setEditedDetails({ ...editedDetails, ballType: text })}
              />

              {/* Format */}
              <Text style={styles.inputLabel}>Format</Text>
              <TextInput
                style={styles.input}
                placeholder="Tournament format"
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
                <Icon name="add" size={20} color="#4A90E2" />
                <Text style={styles.secondaryButtonText}>Add Venue</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setEditingTournament(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={updateTournamentDetails}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
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
    marginTop: 10,
    flexGrow: 1,
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    padding: 10,
  },
  animatedContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  loader: {
    marginBottom: 16
  },
  loadingText: {
    marginTop: 16,
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500'
  },
  errorText: {
    color: '#dc3545',
    marginVertical: 16,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500'
  },
  emptyText: {
    color: '#6c757d',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500'
  },
  headerContainer: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 12,
  },
  iconButton: {
    padding: 4,
  },
  dateLocationContainer: {
    marginTop: 8,
  },
  dateLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  dateLocationText: {
    color: '#6c757d',
    marginLeft: 8,
    fontSize: 14
  },
  contentContainer: {
    padding: 20
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  cardContent: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22
  },
  eyeButton: {
    padding: 4,
  },
  teamsCount: {
    fontSize: 14,
    color: '#6c757d',
  },
  detailsSection: {
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16
  },
  detailGrid: {
    flexDirection: 'column',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  detailIconContainer: {
    backgroundColor: '#e8f4fd',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  detailLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2c3e50'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
  },
  teamsModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "95%",
    maxHeight: "80%",
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  closeButton: {
    padding: 4,
  },
  teamsCountHeader: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  teamsCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
  },
  teamsList: {
    padding: 20,
  },
  teamListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  teamNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamNumberText: {
    color: '#4A90E2',
    fontWeight: '600',
    fontSize: 14,
  },
  teamListName: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  noTeamsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noTeamsText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  modalScrollView: {
    padding: 20,
    maxHeight: '70%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 6,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#f9f9f9",
    marginBottom: 12,
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
    backgroundColor: "#f9f9f9",
  },
  dateSeparator: {
    marginHorizontal: 8,
    fontWeight: "500",
    color: "#495057",
  },
  placeholderText: {
    fontSize: 15,
    color: "#2c3e50",
  },
  primaryButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8f4fd",
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: "#4A90E2",
    marginLeft: 6,
    fontWeight: "500",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 15,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: "#f1f3f5",
  },
  cancelButtonText: {
    fontWeight: "500",
    fontSize: 15,
    color: "#6c757d",
  },
});

export default Info;