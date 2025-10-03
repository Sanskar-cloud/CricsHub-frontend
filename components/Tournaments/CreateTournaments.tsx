import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import moment from "moment";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import ensureMediaPermission from '../Permissions';

// Color constants for consistency
const AppColors = {
  white: "#FFFFFF",
  black: "#000000",
  blue: "#3498DB",
  background: "#F8F9FA",
  cardBorder: "rgba(255, 255, 255, 0.2)",
  error: "#E74C3C",
  darkText: "#000000",
  lightText: "#666666",
  lightBackground: "#F8F9FA",
  primary: "#4A90E2",
  primaryDark: "#357ABD",
  success: "#2ECC71",
  warning: "#F39C12",
};

const { height, width } = Dimensions.get('window');
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Reusable Notification Component
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

  const bgColor = type === "success" ? "#4CAF50" : "#F44336";
  const iconName = type === "success" ? "check-circle" : "alert-circle";

  return (
    <Animated.View
      style={[
        styles.notificationContainer,
        { opacity: fadeAnim, backgroundColor: bgColor },
      ]}
    >
      <View style={styles.notificationContent}>
        <Ionicons name={iconName === 'check-circle' ? 'checkmark-circle' : iconName} size={22} color="#fff" />
        <Text style={styles.notificationText}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onHide} style={styles.notificationClose}>
        <Ionicons name="close" size={18} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Reusable Dropdown Modal Component
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
                <Text style={modalStyles.optionText}>{item.label}</Text>
                {selectedValue === item.value && (
                  <Ionicons name="checkmark-circle" size={20} color={AppColors.primary} />
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
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [showFormatModal, setShowFormatModal] = useState(false); // 👈 New state for modal
  const [showBallTypeModal, setShowBallTypeModal] = useState(false); // 👈 New state for modal
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const [isFormValid, setIsFormValid] = useState(false);
  useEffect(() => {
    const isValid = tournamentName.trim() !== '' &&
      format !== '' &&
      ballType !== '';
    setIsFormValid(isValid);
  }, [tournamentName, format, ballType]);

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

  useEffect(() => {
    (async () => {
      await requestPermission();
    })();
  }, [requestPermission]);

  const getToken = useCallback(async () => {
    try {
      return await AsyncStorage.getItem('jwtToken');
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
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

    if (!tournamentName || !format || !ballType) {
      showNotification('Please fill all required fields.', 'error');
      setLoading(false);
      return;
    }

    if (startDate > endDate) {
      showNotification('End date must be after start date.', 'error');
      setLoading(false);
      return;
    }

    try {
      const tournamentData = {
        userId,
        name: tournamentName,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        format,
        type: overs,
        ballType,
        matchesPerDay: "1",
        matchesPerTeam: "1",
        venues: "Default Venue",
        banner,
      };

      navigation.navigate("TournamentMatchOperatives", { tournamentData });
    } catch (error) {
      console.error("Unexpected error:", error);
      showNotification('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [tournamentName, startDate, endDate, format, overs, ballType, banner, getUserUUID, navigation]);

  const pickImage = useCallback(async () => {
    const hasPermission = await ensureMediaPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled) {
      if (result.assets[0].fileSize > MAX_IMAGE_SIZE) {
        showNotification('Image size should be less than 5MB', 'error');
        return;
      }
      setBanner(result.assets[0].uri);
    }
  }, []);

  const getFormatLabel = (value) => {
    switch (value) {
      case 'DOUBLE_ROUND_ROBIN': return 'Double Round Robin';
      case 'SINGLE_ROUND_ROBIN': return 'Single Round Robin';
      case 'KNOCKOUT': return 'Knockout';
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
    { label: "Knockout", value: "KNOCKOUT" },
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
          <View style={styles.card}>
            <Text style={styles.label}>Tournament Banner</Text>
            <TouchableOpacity onPress={pickImage} style={styles.bannerUploadContainer}>
              {banner ? (
                <Image source={{ uri: banner }} style={styles.bannerImage} />
              ) : (
                <View style={styles.bannerPlaceholder}>
                  <MaterialCommunityIcons name="image-plus" size={40} color={AppColors.primary} />
                  <Text style={styles.bannerUploadText}>Upload Tournament Banner</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.label}>Tournament Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter tournament name"
              placeholderTextColor={AppColors.lightText}
              value={tournamentName}
              onChangeText={setTournamentName}
            />
            <Text style={styles.label}>Tournament Dates *</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.placeholderText}>
                    {moment(startDate).format('MMM D, YYYY')}
                  </Text>
                  <MaterialCommunityIcons name="calendar" size={20} color={AppColors.primary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.dateSeparator}>to</Text>

              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>End Date</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.placeholderText}>
                    {moment(endDate).format('MMM D, YYYY')}
                  </Text>
                  <MaterialCommunityIcons name="calendar" size={20} color={AppColors.primary} />
                </TouchableOpacity>
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
                size={20}
                color={AppColors.primary}
              />
            </TouchableOpacity>

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
                size={20}
                color={AppColors.primary}
              />
            </TouchableOpacity>

            <Text style={styles.label}>Number of Overs</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number of overs per inning"
              placeholderTextColor={AppColors.lightText}
              value={overs}
              onChangeText={setOvers}
              keyboardType="numeric"
            />
          </View>

          <View style={{ height: 80 }} />
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
              <ActivityIndicator color={AppColors.white} />
            ) : (
              <View style={styles.buttonContent}>
                <MaterialCommunityIcons name="trophy" size={20} color={AppColors.white} />
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
    backgroundColor: AppColors.lightBackground,
  },
  scrollView: {
    flex: 1,
  },
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
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.darkText,
    marginBottom: 8,
    marginLeft: 4,
  },
  bannerUploadContainer: {
    height: 150,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.primary,
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
    color: AppColors.primary,
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  input: {
    borderColor: '#E0E0E0',
    borderWidth: 1,
    padding: 16,
    color: AppColors.darkText,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: AppColors.background,
    fontSize: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: AppColors.darkText,
    marginBottom: 8,
    marginLeft: 4,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dateSeparator: {
    color: AppColors.darkText,
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 32,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: AppColors.background,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: AppColors.darkText,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingButton: {
    backgroundColor: AppColors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  placeholderText: {
    color: AppColors.lightText,
  },
  // Notification styles
  notificationContainer: {
    position: "absolute",
    top: 70,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  notificationText: {
    color: "#fff",
    fontSize: 15,
    flex: 1,
    fontWeight: "500",
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: height * 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 20,
  },
  modalHandle: {
    width: 60,
    height: 6,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: AppColors.darkText,
  },
  optionsList: {
    flexGrow: 0,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: AppColors.darkText,
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
  },
});

export default CreateTournament;