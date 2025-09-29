import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import apiService from "../APIservices";
import ensureMediaPermission from "../Permissions";

const { width, height } = Dimensions.get("window");
const ROLE_OPTIONS = ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"];
const AppColors = {
  white: "#FFFFFF",
  black: "#000000",
  blue: "#3498DB",
  background: "#F8F9FA",
  cardBorder: "rgba(255, 255, 255, 0.2)",
  error: "#E74C3C",
};

const ShimmerPlaceholder = ({ style, visible, children }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      animation.setValue(0);
      return;
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [visible]);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  if (!visible) return children;

  return (
    <View style={[style, { overflow: "hidden" }]}>
      {children}
      <Animated.View
        style={[
          styles.shimmerOverlay,
          {
            transform: [{ translateX }],
            opacity: animation,
          },
        ]}
      />
    </View>
  );
};

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
  }, [visible, fadeAnim]);

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
        <Icon name={iconName} size={22} color="#fff" />
        <Text style={styles.notificationText}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onHide} style={styles.notificationClose}>
        <Icon name="x" size={18} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const DropdownModal = ({ visible, options, onSelect, onClose }) => {
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY }] },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Role</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                <Icon name="x" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsContainer}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionItem}
                  onPress={() => onSelect(option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                  <Icon name="chevron-right" size={18} color="#ccc" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const Settings = ({ navigation }) => {
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
    profilePicture: null,
  });
  const [loading, setLoading] = useState(true);
  const [editField, setEditField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const showNotification = (message, type = "success") => {
    setNotification({
      visible: true,
      message,
      type,
    });
  };

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  // Function to request OTP
  const requestEmailOtp = async () => {
    if (!tempValue.trim()) {
      showNotification("Email cannot be empty", "error");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await apiService({
        endpoint: "auth/sendOtp",
        method: "POST",
        body: { email: tempValue.trim() },
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to send OTP");
      }

      showNotification("OTP sent to your email");
      setEmailOtpSent(true);
    } catch (err) {
      console.error("Send OTP error:", err);
      showNotification(err.message || "Failed to send OTP", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to update email with OTP
  const handleUpdateEmail = async () => {
    if (!otpValue.trim()) {
      showNotification("OTP cannot be empty", "error");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await apiService({
        endpoint: "profile/update-email",
        method: "POST",
        body: {
          newEmail: tempValue.trim(),
          newEmailOtp: otpValue.trim(),
        },
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to update email");
      }

      setProfile((prev) => ({ ...prev, email: tempValue.trim() }));
      showNotification("Email updated successfully");
      setEditField(null);
      setEmailOtpSent(false);
      setOtpValue("");
    } catch (err) {
      console.error("Update email error:", err);
      showNotification(err.message || "Failed to update email", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, visible: false }));
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await apiService({
        endpoint: "profile/current",
        method: "GET",
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to load profile data");
      }

      const profileData = response.data.data || response.data;
      setProfile({
        name: profileData.name || "",
        phone: profileData.phone || profileData.phoneNumber || "",
        email: profileData.email || "",
        role: profileData.role || "",
        profilePicture: profileData.logoPath
          ? `${profileData.logoPath}?${new Date().getTime()}`
          : null,
      });
    } catch (err) {
      console.error("Profile fetch error:", err);
      showNotification("Failed to load profile data", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = async (updatedData) => {
    try {
      setIsUpdating(true);

      const formData = new FormData();
      for (let key in updatedData) {
        if (key === "profilePicture" && typeof updatedData[key] === "string") {
          formData.append(
            key,
            {
              uri: updatedData[key],
              type: "image/jpeg",
              name: "profile.jpg"
            } as any
          );
        } else {
          formData.append(key, updatedData[key]);
        }
      }

      const response = await apiService({
        endpoint: "profile/update",
        method: "PUT",
        body: formData,
        isMultipart: true,
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to update profile");
      }

      setProfile((prev) => ({ ...prev, ...updatedData }));
      showNotification("Profile updated successfully");
      return true;
    } catch (err) {
      console.error("Update error:", err);
      showNotification(err.message || "Failed to update profile", "error");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const pickImage = async () => {
    try {
       const hasPermission = await ensureMediaPermission();
if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setIsUploading(true);
        const newImageUri = result.assets[0].uri;

        const success = await updateProfileData({ profilePicture: newImageUri });

        if (success) {
          setProfile((prev) => ({
            ...prev,
            profilePicture: `${newImageUri}?${new Date().getTime()}`,
          }));
        }
      }
    } catch (err) {
      console.error("Image upload error:", err);
      showNotification("Failed to update profile picture", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (field) => {
    setEditField(field);
    setTempValue(profile[field]);
  };

  const handleSave = async () => {
    if (!tempValue.trim()) {
      showNotification("Field cannot be empty", "error");
      setIsUpdating(false);
      return;
    }

    let updatedData = {};
    if (editField === "phone") {
      updatedData = { phoneNumber: tempValue };
    } else if (editField === "name") {
      updatedData = { name: tempValue };
    } else if (editField === "role") {
      updatedData = { role: tempValue };
    }

    const success = await updateProfileData(updatedData);
    if (success) setEditField(null);
  };

  const handleRoleSelect = (role) => {
    setProfile((prev) => ({ ...prev, role }));
    updateProfileData({ role });
    setDropdownVisible(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Notification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={hideNotification}
      />
      <StatusBar
        barStyle="dark-content"
        backgroundColor={AppColors.white}
        translucent={true}
      />

      <DropdownModal
        visible={dropdownVisible}
        options={ROLE_OPTIONS}
        onSelect={handleRoleSelect}
        onClose={() => setDropdownVisible(false)}
      />

      {/* Header with SafeAreaView padding */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={AppColors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Settings</Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.blue} />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileContainer}>
              <ShimmerPlaceholder
                style={styles.profileImageContainer}
                visible={!isUploading}
              >
                <TouchableOpacity
                  style={styles.profileImageContainer}
                  onPress={pickImage}
                  disabled={isUploading}
                >
                  {profile.profilePicture ? (
                    <>
                      <Image
                        source={{ uri: profile.profilePicture }}
                        style={styles.profileImage}
                      />
                      {isUploading && (
                        <View style={styles.uploadOverlay}>
                          <ActivityIndicator size="large" color="#fff" />
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.profileImagePlaceholder}>
                      <Icon name="user" size={60} color="#fff" />
                    </View>
                  )}
                  <View style={styles.editPhotoButton}>
                    <Icon name="camera" size={18} color="#fff" />
                  </View>
                </TouchableOpacity>
              </ShimmerPlaceholder>

              <View style={styles.infoContainer}>
                <Text style={styles.sectionTitle}>Personal Information</Text>

                {["name", "phone"].map((field) => (
                  <View style={styles.infoItem} key={field}>
                    {editField === field ? (
                      <View style={styles.editContainer}>
                        <TextInput
                          style={styles.editInput}
                          value={tempValue}
                          onChangeText={setTempValue}
                          placeholder={`Enter your ${field}`}
                          placeholderTextColor="#999"
                          autoFocus
                          keyboardType={
                            field === "phone"
                              ? "phone-pad"
                              : "default"
                          }
                        />
                        <View style={styles.editActions}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.saveButton]}
                            onPress={handleSave}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Icon name="check" size={18} color="#fff" />
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => setEditField(null)}
                          >
                            <Icon name="x" size={18} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.infoTextContainer}>
                        <View style={styles.infoLabelContainer}>
                          <Icon
                            name={field === "name" ? "user" : "phone"}
                            size={16}
                            color="#34B8FF"
                            style={styles.fieldIcon}
                          />
                          <Text style={styles.infoLabel}>
                            {field === "name" ? "Full Name" : "Phone Number"}
                          </Text>
                        </View>
                        <Text style={styles.infoValue} numberOfLines={1}>
                          {profile[field] || "Not set"}
                        </Text>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => handleEdit(field)}
                        >
                          <Icon name="edit-2" size={16} color="#34B8FF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}

                <View style={styles.infoItem}>
                  <View style={styles.infoTextContainer}>
                    <View style={styles.infoLabelContainer}>
                      <Icon
                        name="award"
                        size={16}
                        color="#34B8FF"
                        style={styles.fieldIcon}
                      />
                      <Text style={styles.infoLabel}>Playing Role</Text>
                    </View>
                    <Text style={styles.infoValue}>
                      {profile.role || "Not set"}
                    </Text>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => setDropdownVisible(true)}
                    >
                      <Icon name="edit-2" size={16} color="#34B8FF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* <View style={styles.infoItem}>
                  <View style={styles.infoTextContainer}>
                    <View style={styles.infoLabelContainer}>
                      <Icon
                        name="mail"
                        size={16}
                        color="#34B8FF"
                        style={styles.fieldIcon}
                      />
                      <Text style={styles.infoLabel}>Email Address</Text>
                    </View>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {profile.email || "Not set"}
                    </Text>
                  </View>
                </View> */}
              </View>
              <TouchableOpacity
                style={styles.careerStatsButton}
                onPress={() => navigation.navigate('Performance')}
              >
                <View style={styles.careerStatsContent}>
                  <Icon name="bar-chart-2" size={22} color="#fff" />
                  <Text style={styles.careerStatsText}>View Career Stats</Text>
                </View>
                <Icon name="chevron-right" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  // Add header container with padding for status bar
  headerContainer: {
    backgroundColor: AppColors.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.black,
  },
  headerRight: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.background,
  },
  loadingText: {
    color: AppColors.black,
    marginTop: 15,
    fontSize: 16,
  },
  profileContainer: {
    alignItems: "center",
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 25,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#0575E6",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  profileImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(52,184,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#34B8FF",
  },
  uploadOverlay: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  editPhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#34B8FF",
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  infoContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f4f8",
  },
  infoItem: {
    marginBottom: 20,
  },
  infoTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fieldIcon: {
    marginRight: 10,
  },
  infoLabel: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    color: "#222",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    marginLeft: 10,
    textAlign: "right",
  },
  editButton: {
    marginLeft: 15,
    padding: 8,
    backgroundColor: "rgba(52,184,255,0.1)",
    borderRadius: 8,
  },
  editContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  editInput: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    color: "#000",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    fontSize: 16,
  },
  editActions: {
    flexDirection: "row",
    marginLeft: 10,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: "#34B8FF",
    shadowColor: "#34B8FF",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: "#FF4C4C",
  },
  // Career Stats Button
  careerStatsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#34B8FF",
    padding: 18,
    borderRadius: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  careerStatsContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  careerStatsText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  notificationContainer: {
    position: "absolute",
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 80 : 80,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f4f8",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalClose: {
    padding: 4,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export default Settings;