import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import moment from "moment";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAppNavigation } from '../NavigationService';

// Refined Color Palette
const AppColors = {
  white: "#FFFFFF",
  black: "#000000",
  background: "#F8F9FA",
  cardBorder: "#F0F0F0",
  error: "#E74C3C",
  darkText: "#2D3748",
  lightText: "#718096",
  lightBackground: "#F8F9FA",
  primary: "#4A90E2",
  primaryLight: "#EBF4FF",
  success: "#2ECC71",
  warning: "#F39C12",
  card: "#FFFFFF",
  border: "#E2E8F0",
  subtleBackground: "#F7FAFC",
};

const { height, width } = Dimensions.get('window');
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// Minimal Notification Component
const Notification = ({ message, type, visible, onHide }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide && onHide();
      });
    }
  }, [visible, fadeAnim, onHide]);

  if (!visible) return null;

  const bgColor = type === "success" ? AppColors.success : AppColors.error;

  return (
    <Animated.View
      style={[
        styles.notificationContainer,
        { opacity: fadeAnim, backgroundColor: bgColor },
      ]}
    >
      <View style={styles.notificationContent}>
        <Ionicons 
          name={type === "success" ? "checkmark-circle" : "alert-circle"} 
          size={20} 
          color="#fff" 
        />
        <Text style={styles.notificationText}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onHide} style={styles.notificationClose}>
        <Ionicons name="close" size={18} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Clean Dropdown Modal
const DropdownModal = ({ visible, options, onSelect, onClose, selectedValue, title }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <TouchableOpacity
        style={modalStyles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[modalStyles.modalContainer, { transform: [{ translateY }] }]}
        >
          <View style={modalStyles.modalHandle} />
          <Text style={modalStyles.modalTitle}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  modalStyles.optionItem,
                  selectedValue === item.value && modalStyles.selectedOption,
                ]}
                onPress={() => onSelect(item.value)}
              >
                <Text style={[
                  modalStyles.optionText,
                  selectedValue === item.value && modalStyles.selectedOptionText
                ]}>
                  {item.label}
                </Text>
                {selectedValue === item.value && (
                  <Ionicons name="checkmark" size={20} color={AppColors.primary} />
                )}
              </TouchableOpacity>
            )}
            style={modalStyles.optionsList}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const CreateTournament = () => {
  const navigation = useAppNavigation();

  // Tournament state
  const [tournamentName, setTournamentName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [format, setFormat] = useState('');
  const [ballType, setBallType] = useState('');
  const [overs, setOvers] = useState('');
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showBallTypeModal, setShowBallTypeModal] = useState(false);
  const [venues, setVenues] = useState([]);
  const [venueInput, setVenueInput] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const [isFormValid, setIsFormValid] = useState(false);
  
  useEffect(() => {
    const isValid =
      tournamentName.trim() !== '' &&
      format !== '' &&
      ballType !== '' &&
      overs.trim() !== '' &&
      parseInt(overs) > 0 &&
      venues.length > 0 &&
      startDate < endDate;
    setIsFormValid(isValid);
  }, [tournamentName, format, ballType, overs, venues, startDate, endDate]);

  const showNotification = (message, type = "success") => {
    setNotification({
      visible: true,
      message,
      type,
    });
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const getUserUUID = useCallback(async () => {
    try {
      return await AsyncStorage.getItem('userUUID');
    } catch (error) {
      console.error('Error retrieving user UUID:', error);
      return null;
    }
  }, []);

  const handleCreateTournament = useCallback(async () => {
    setLoading(true);
    const userId = await getUserUUID();

    if (!tournamentName.trim() || !format || !ballType || !overs.trim() || venues.length === 0) {
      showNotification('Please fill all required fields, including overs.', 'error');
      setLoading(false);
      return;
    }

    const oversNum = Number(overs);
    if (isNaN(oversNum) || oversNum <= 0) {
      showNotification('Number of overs must be a valid number greater than 0.', 'error');
      setLoading(false);
      return;
    }

    if (startDate > endDate) {
      showNotification('End date must be after start date.', 'error');
      setLoading(false);
      return;
    }

    if (moment(startDate).isSame(moment(endDate), 'day')) {
      showNotification('Start date and end date cannot be the same.', 'error');
      setLoading(false);
      return;
    }

    try {
      const tournamentData = {
        userId,
        name: tournamentName.trim(),
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        format,
        type: overs,
        ballType,
        matchesPerDay: "1",
        matchesPerTeam: "1",
        venues,
        banner,
      };

      navigation.navigate("TournamentMatchOperatives", { tournamentData });
    } catch (error) {
      console.error("Unexpected error:", error);
      showNotification('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [tournamentName, startDate, endDate, format, venues, overs, ballType, getUserUUID, navigation]);

  const pickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your gallery to choose an image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        if (selectedImage.fileSize && selectedImage.fileSize > MAX_IMAGE_SIZE) {
          showNotification('Image size should be less than 5MB', 'error');
          return;
        }

        setBanner(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showNotification('Failed to pick image. Please try again.', 'error');
    }
  }, []);

  const addVenue = () => {
    if (venueInput.trim() !== '') {
      setVenues([...venues, venueInput.trim()]);
      setVenueInput('');
    }
  };

  const removeVenue = (index) => {
    const updated = [...venues];
    updated.splice(index, 1);
    setVenues(updated);
  };

  const getFormatLabel = (value) => {
    switch (value) {
      case 'DOUBLE_ROUND_ROBIN': return 'Double Round Robin';
      case 'SINGLE_ROUND_ROBIN': return 'Single Round Robin';
      case 'CUSTOM': return 'Custom';
      default: return 'Select Tournament Format *';
    }
  };

  const getBallTypeLabel = (value) => {
    switch (value) {
      case 'TENNIS': return 'Tennis Ball';
      case 'LEATHER': return 'Leather Ball';
      default: return 'Select Ball Type *';
    }
  };

  const formatOptions = [
    { label: "Double Round Robin", value: "DOUBLE_ROUND_ROBIN" },
    { label: "Single Round Robin", value: "SINGLE_ROUND_ROBIN" },
    { label: "Custom", value: "CUSTOM" },
  ];

  const ballTypeOptions = [
    { label: "Tennis Ball", value: "TENNIS" },
    { label: "Leather Ball", value: "LEATHER" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {Platform.OS === "android" && <RNStatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />}

      <Notification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={hideNotification}
      />

      {/* Original Header - Unchanged */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={26} color={AppColors.darkText} />
        </TouchableOpacity>
        <Text style={styles.heading}>Create Tournament</Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Banner Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tournament Banner</Text>
            <TouchableOpacity onPress={pickImage} style={styles.bannerUploadContainer}>
              {banner ? (
                <Image source={{ uri: banner }} style={styles.bannerImage} />
              ) : (
                <View style={styles.bannerPlaceholder}>
                  <MaterialCommunityIcons name="image-plus" size={32} color={AppColors.primary} />
                  <Text style={styles.bannerUploadText}>Upload Tournament Banner</Text>
                  {/* <Text style={styles.bannerSubText}>Optional</Text> */}
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tournament Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter tournament name"
                placeholderTextColor={AppColors.lightText}
                value={tournamentName}
                onChangeText={setTournamentName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tournament Dates *</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.dateInput]}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
                      {moment(startDate).format('MMM D, YYYY')}
                    </Text>
                    <MaterialCommunityIcons name="calendar" size={18} color={AppColors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.dateSeparatorContainer}>
                  <Text style={styles.dateSeparator}>to</Text>
                </View>

                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>End Date</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.dateInput]}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
                      {moment(endDate).format('MMM D, YYYY')}
                    </Text>
                    <MaterialCommunityIcons name="calendar" size={18} color={AppColors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
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
          </View>

          {/* Tournament Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tournament Settings</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tournament Format *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowFormatModal(true)}
              >
                <Text style={[styles.dropdownButtonText, !format && styles.placeholderText]}>
                  {getFormatLabel(format)}
                </Text>
                <Ionicons
                  name={"chevron-down"}
                  size={18}
                  color={AppColors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ball Type *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowBallTypeModal(true)}
              >
                <Text style={[styles.dropdownButtonText, !ballType && styles.placeholderText]}>
                  {getBallTypeLabel(ballType)}
                </Text>
                <Ionicons
                  name={"chevron-down"}
                  size={18}
                  color={AppColors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of Overs *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter number of overs per inning"
                placeholderTextColor={AppColors.lightText}
                value={overs}
                onChangeText={setOvers}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Venues */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Venues</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Add Venues *</Text>
              <View style={styles.venueInputRow}>
                <TextInput
                  style={[styles.input, styles.venueInput]}
                  placeholder="Enter venue name"
                  placeholderTextColor={AppColors.lightText}
                  value={venueInput}
                  onChangeText={setVenueInput}
                  returnKeyType="done"
                  onSubmitEditing={addVenue}
                />
                <TouchableOpacity 
                  onPress={addVenue} 
                  style={styles.addVenueButton}
                  disabled={!venueInput.trim()}
                >
                  <MaterialCommunityIcons 
                    name="plus" 
                    size={20} 
                    color={venueInput.trim() ? AppColors.primary : AppColors.lightText} 
                  />
                </TouchableOpacity>
              </View>

              {venues.length > 0 && (
                <View style={styles.venueList}>
                  {venues.map((venue, index) => (
                    <View key={index} style={styles.venueChip}>
                      <Text style={styles.venueText}>{venue}</Text>
                      <TouchableOpacity 
                        onPress={() => removeVenue(index)} 
                        style={styles.removeVenueButton}
                      >
                        <Ionicons name="close" size={16} color={AppColors.lightText} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <DropdownModal
        visible={showFormatModal}
        options={formatOptions}
        onSelect={(value) => {
          setFormat(value);
          setShowFormatModal(false);
        }}
        onClose={() => setShowFormatModal(false)}
        selectedValue={format}
        title="Select Tournament Format"
      />

      <DropdownModal
        visible={showBallTypeModal}
        options={ballTypeOptions}
        onSelect={(value) => {
          setBallType(value);
          setShowBallTypeModal(false);
        }}
        onClose={() => setShowBallTypeModal(false)}
        selectedValue={ballType}
        title="Select Ball Type"
      />

      {!keyboardOpen && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              (loading || !isFormValid) && styles.disabledButton
            ]}
            onPress={handleCreateTournament}
            disabled={loading || !isFormValid}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={AppColors.white} size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <MaterialCommunityIcons name="trophy-outline" size={20} color={AppColors.white} />
                <Text style={styles.buttonText}>Create Tournament</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.white,
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.subtleBackground,
  },
  scrollView: {
    flex: 1,
  },
  // Original Header Styles - Unchanged
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.darkText,
  },
  headerButton: {
    padding: 6,
    width: 40,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 20,
  },
  // Minimal Section Styles
  section: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.darkText,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.darkText,
    marginBottom: 8,
  },
  // Clean Banner Styles
  bannerUploadContainer: {
    height: 140,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  bannerUploadText: {
    color: AppColors.darkText,
    fontSize: 14,
    marginTop: 8,
    fontWeight: '400',
  },
  bannerSubText: {
    color: AppColors.lightText,
    fontSize: 12,
    marginTop: 2,
  },
  // Minimal Input Styles
  input: {
    borderColor: AppColors.border,
    borderWidth: 1,
    padding: 14,
    color: AppColors.darkText,
    borderRadius: 8,
    backgroundColor: AppColors.white,
    fontSize: 15,
    fontWeight: '400',
  },
  // Clean Date Picker Styles
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: AppColors.darkText,
    marginBottom: 8,
    fontWeight: '500',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  dateText: {
    fontSize: 15,
    color: AppColors.darkText,
    fontWeight: '400',
  },
  dateSeparatorContainer: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  dateSeparator: {
    color: AppColors.lightText,
    fontSize: 14,
    fontWeight: '400',
  },
  // Minimal Dropdown Styles
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: AppColors.border,
    borderWidth: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: AppColors.white,
  },
  dropdownButtonText: {
    fontSize: 15,
    color: AppColors.darkText,
    fontWeight: '400',
  },
  // Clean Venue Styles
  venueInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueInput: {
    flex: 1,
    marginRight: 12,
  },
  addVenueButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: AppColors.primaryLight,
  },
  venueList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  venueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primaryLight,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  venueText: {
    fontSize: 13,
    color: AppColors.darkText,
    marginRight: 6,
    fontWeight: '400',
  },
  removeVenueButton: {
    padding: 2,
  },
  // Professional Floating Button
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  floatingButton: {
    backgroundColor: AppColors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  placeholderText: {
    color: AppColors.lightText,
  },
  // Clean Notification Styles
  notificationContainer: {
    position: "absolute",
    top: 70,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  notificationText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
    fontWeight: "400",
    marginLeft: 10,
  },
  notificationClose: {
    padding: 4,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: height * 0.5,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: AppColors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
    color: AppColors.darkText,
  },
  optionsList: {
    flexGrow: 0,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  optionText: {
    fontSize: 15,
    color: AppColors.darkText,
    fontWeight: '400',
  },
  selectedOption: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 8,
    marginHorizontal: -4,
    paddingHorizontal: 12,
  },
  selectedOptionText: {
    color: AppColors.primary,
    fontWeight: '500',
  },
});

export default CreateTournament;