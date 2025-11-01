// Sidebar.js - FINAL VERSION WITH FOOTER (Updated for Nested Navigation)

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- START FIX: Mocking missing imports/files ---
// Mocking AppColors to resolve missing import error
const AppColors = {
  white: '#FFFFFF',
  black: '#121212',
  blue: '#0575E6',
  error: '#DC3545',
  gray: '#6c757d',
  lightGray: '#F0F0F0',
};

// Placeholder URL to resolve asset require() error
const USER_PLACEHOLDER_IMAGE = require('../../assets/defaultLogo.png');
// --- END FIX ---

const { width, height } = Dimensions.get("window");

// 1. USE EXPO-CONSTANTS TO GET THE VERSION
const APP_VERSION = Constants.expoConfig?.version || "1.0.0";
const COPYRIGHT_TEXT = "© 2024 CricsHub. All rights reserved.";

const Sidebar = ({
  sidebarAnim,
  userName,
  navigation, // This is the navigation object from the OUTER STACK (the 'rootNavigation' you passed)
  closeSidebar,
  isSidebarVisible,
}) => {

  // IMPORTANT: The sidebar items use screen names from the INNER STACK (defined in MainScreens).
  // Therefore, navigation must target the 'Main' screen, passing the desired screen name as a param.
  const navigateToScreen = (screenName) => {
    // If navigating to 'Login', we navigate directly in the outer stack.
    if (screenName === "Login") {
      navigation.navigate("Login");
    } else {
      // For all other internal screens (Profile, Performance, etc.),
      // we navigate to the 'Main' screen and pass the target screen name.
      navigation.navigate('Main', { screen: screenName });
    }
    closeSidebar();
  };

  const LogOutHandler = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Logout",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("hasCompletedProfilePrompt");
              await AsyncStorage.removeItem("jwtToken");

              // Logout navigates back to the Login screen in the Outer Stack
              navigation.navigate("Login");

            } catch (error) {
              console.error("Error removing token:", error);
              Alert.alert(
                "Logout Failed",
                "Could not log out. Please try again."
              );
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Note: All these screen names must match the screen names in the inner stack
  const sidebarItems = [
    { icon: "person-outline", text: "Profile", screen: "Profile" },
    { icon: "stats-chart-outline", text: "Performance", screen: "Performance" },
    { icon: "help-circle-outline", text: "Support", screen: "Support" },
    { icon: "radio-button-on", text: "Toss", screen: "TossFlip" },
    { icon: "copy", text: "Privacy Policy", screen: "PrivacyPolicy" },
  ];

  const styles = StyleSheet.create({
    sidebar: {
      position: "absolute",
      top: 0,
      left: 0,
      width: width,
      height: height,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      overflow: "hidden",
      zIndex: 100,
      backgroundColor: AppColors.white,
      shadowColor: "#000",
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 10,
    },
    sidebarBackground: {
      flex: 1,
      backgroundColor: AppColors.white
    },
    closeSidebarButton: {
      position: "absolute",
      top: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight + 10,
      right: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: AppColors.white,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
      zIndex: 101,
    },
    sidebarHeaderEnhanced: {
      padding: 20,
      alignItems: "center",
      marginBottom: 10,
      paddingTop:
        Platform.OS === "ios"
          ? 80
          : (StatusBar.currentHeight || 20) + 40,
    },
    userImageWrapperEnhanced: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      borderColor: AppColors.white,
      marginBottom: 10,
      backgroundColor: "rgba(255,255,255,0.15)",
      shadowColor: AppColors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    userImage: { width: 88, height: 88, borderRadius: 44, resizeMode: "cover" },
    sidebarTitleEnhanced: {
      fontSize: 22,
      fontWeight: "700",
      color: AppColors.white,
      textAlign: "center",
    },
    sidebarSubtitleEnhanced: {
      fontSize: 14,
      fontWeight: "500",
      color: "rgba(255, 255, 255, 0.8)",
      marginTop: 4,
    },
    sidebarOptionsWrapper: {
      marginTop: 10,
      paddingHorizontal: 15,
      paddingBottom: 40,
    },
    sidebarItemPatch: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#f8f9fa",
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 15,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    sidebarItemTextDark: {
      fontSize: 16,
      marginLeft: 15,
      fontWeight: "500",
      color: AppColors.black,
    },
    logoutPatch: {
      backgroundColor: "#fff0f0",
      borderColor: AppColors.error,
      borderWidth: 1,
      marginTop: 20,
    },
    sidebarFooter: {
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: AppColors.lightGray,
      alignItems: 'center',
      backgroundColor: AppColors.white,
      paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    },
    versionText: {
      fontSize: 12,
      color: AppColors.gray,
      marginBottom: 4,
    },
    copyrightText: {
      fontSize: 10,
      color: AppColors.gray,
    },
  });

  if (!isSidebarVisible) return null;

  return (
    <Animated.View
      style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}
    >
      <View style={styles.sidebarBackground}>
        <TouchableOpacity
          onPress={closeSidebar}
          style={styles.closeSidebarButton}
        >
          <Ionicons name="close" color={AppColors.black} size={28} />
        </TouchableOpacity>

        <LinearGradient
          colors={["#34B8FF", "#0575E6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sidebarHeaderEnhanced}
        >
          <View style={styles.userImageWrapperEnhanced}>
            <Image
              source={USER_PLACEHOLDER_IMAGE}
              style={styles.userImage}
            />
          </View>
          <Text style={styles.sidebarTitleEnhanced}>
            {userName || "Guest User"}
          </Text>
          <Text style={styles.sidebarSubtitleEnhanced}>
            View Profile & Stats
          </Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.sidebarOptionsWrapper} style={{ flex: 1 }}>
          {sidebarItems.map(({ icon, text, screen }) => (
            <TouchableOpacity
              key={screen}
              style={styles.sidebarItemPatch}
              onPress={() => navigateToScreen(screen)} // Using the nested navigation handler
            >
              <Ionicons name={icon} size={22} color={AppColors.blue} />
              <Text style={styles.sidebarItemTextDark}>{text}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.sidebarItemPatch, styles.logoutPatch]}
            onPress={LogOutHandler}
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color={AppColors.error}
            />
            <Text
              style={[styles.sidebarItemTextDark, { color: AppColors.error }]}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.sidebarFooter}>
          <Text style={styles.versionText}>
            Version: {APP_VERSION}
          </Text>
          <Text style={styles.copyrightText}>
            {COPYRIGHT_TEXT}
          </Text>
        </View>
      </View>

    </Animated.View>
  );
};

export default Sidebar;
