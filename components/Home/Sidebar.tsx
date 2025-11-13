// Sidebar.js - PROPER SLIDE ANIMATION VERSION

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import apiService from "../APIservices";

// Colors matching the home page theme
const AppColors = {
  white: '#FFFFFF',
  black: '#121212',
  blue: '#3498DB',
  darkBlue: '#2980B9',
  lightBlue: '#E0E7FF',
  background: '#F8F9FF',
  error: '#E74C3C',
  gray: '#7F8C9A',
  lightGray: '#F0F4F8',
  text: '#2C3E50',
  secondaryText: '#7F8C9A',
};

const AppGradients = {
  primaryCard: ['#3498DB', '#2980B9'],
  sidebarHeader: ['#3498DB', '#2980B9'],
  sidebarItem: ['#FFFFFF', '#F8F9FF'],
};

const USER_PLACEHOLDER_IMAGE = require('../../assets/defaultLogo.png');

const { width, height } = Dimensions.get("window");

const APP_VERSION = Constants.expoConfig?.version || "1.0.0";
const COPYRIGHT_TEXT = "© 2025 CricsHub. All rights reserved.";

const Sidebar = ({
  sidebarAnim,
  navigation,
  closeSidebar,
  isSidebarVisible,
}) => {
  const [userName, setUserName] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Additional animation values for smoother transitions
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentSlideAnim = useRef(new Animated.Value(30)).current;

  const navigateToScreen = (screenName) => {
    if (screenName === "Login") {
      navigation.navigate("Login");
    } else {
      navigation.navigate('Main', { screen: screenName });
    }
    closeSidebar();
  };

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiService({
        endpoint: "profile/current",
        method: "GET",
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to load profile data");
      }

      const profileData = response.data.data || response.data;
      setUserName(profileData?.name);
      setProfilePicture(profileData?.logoPath);
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Enhanced slide animation handling
  useEffect(() => {
    if (isSidebarVisible) {
      // Slide in animation
      Animated.parallel([
        Animated.timing(sidebarAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(contentSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    } else {
      // Slide out animation
      Animated.parallel([
        Animated.timing(sidebarAnim, {
          toValue: -width,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(contentSlideAnim, {
          toValue: 30,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSidebarVisible]);

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

  const sidebarItems = [
    { icon: "person-outline", text: "Profile", screen: "Profile" },
    { icon: "stats-chart-outline", text: "Performance", screen: "Performance" },
    { icon: "help-circle-outline", text: "Support", screen: "Support" },
    { icon: "radio-button-on", text: "Toss", screen: "TossFlip" },
    { icon: "shield-checkmark-outline", text: "Privacy Policy", screen: "PrivacyPolicy" },
  ];

  const styles = StyleSheet.create({
    sidebar: {
      position: "absolute",
      top: 0,
      left: 0,
      width: width * 0.85,
      height: height,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      overflow: "hidden",
      zIndex: 100,
      backgroundColor: AppColors.white,
      shadowColor: "#000",
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 20,
    },
    sidebarBackground: {
      flex: 1,
      backgroundColor: AppColors.white
    },
    closeSidebarButton: {
      position: "absolute",
      top: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 15,
      right: 15,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: AppColors.white,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
      zIndex: 101,
      borderWidth: 1,
      borderColor: AppColors.lightGray,
    },
    sidebarHeaderEnhanced: {
      padding: 25,
      alignItems: "center",
      marginBottom: 10,
      paddingTop: Platform.OS === "ios" ? 80 : (StatusBar.currentHeight || 20) + 50,
    },
    userImageWrapperEnhanced: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 4,
      borderColor: AppColors.white,
      marginBottom: 15,
      backgroundColor: "rgba(255,255,255,0.2)",
      shadowColor: AppColors.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    userImage: { 
      width: 78, 
      height: 78, 
      borderRadius: 39, 
      resizeMode: "cover",
      backgroundColor: AppColors.lightGray 
    },
    sidebarTitleEnhanced: {
      fontSize: 24,
      fontWeight: "800",
      color: AppColors.white,
      textAlign: "center",
      marginBottom: 4,
    },
    sidebarSubtitleEnhanced: {
      fontSize: 14,
      fontWeight: "500",
      color: "rgba(255, 255, 255, 0.9)",
      textAlign: "center",
    },
    sidebarOptionsWrapper: {
      flex: 1,
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: 10,
    },
    sidebarItemPatch: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: AppColors.white,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: AppColors.lightGray,
    },
    sidebarItemTextDark: {
      fontSize: 16,
      marginLeft: 16,
      fontWeight: "600",
      color: AppColors.text,
      flex: 1,
    },
    sidebarItemIcon: {
      width: 24,
      alignItems: 'center',
    },
    logoutPatch: {
      backgroundColor: '#FFF0F0',
      borderColor: AppColors.error,
      borderWidth: 1.5,
      marginTop: 10,
    },
    sidebarFooter: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: AppColors.lightGray,
      alignItems: 'center',
      backgroundColor: AppColors.white,
      paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    versionText: {
      fontSize: 13,
      color: AppColors.gray,
      marginBottom: 6,
      fontWeight: '500',
    },
    copyrightText: {
      fontSize: 11,
      color: AppColors.gray,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: AppColors.white,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: AppColors.text,
      marginBottom: 15,
      marginLeft: 5,
      marginTop: 10,
    },
  });

  if (!isSidebarVisible) return null;

  return (
    <Animated.View
      style={[
        styles.sidebar, 
        { 
          transform: [{ translateX: sidebarAnim }],
          opacity: fadeAnim
        }
      ]}
    >
      <View style={styles.sidebarBackground}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.blue} />
            <Text style={{ marginTop: 10, color: AppColors.gray }}>Loading...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              onPress={closeSidebar}
              style={styles.closeSidebarButton}
              activeOpacity={0.8}
            >
              <Ionicons name="close" color={AppColors.blue} size={24} />
            </TouchableOpacity>

            <Animated.View
              style={{
                transform: [{ translateY: contentSlideAnim }]
              }}
            >
              <LinearGradient
                colors={AppGradients.sidebarHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sidebarHeaderEnhanced}
              >
                <View style={styles.userImageWrapperEnhanced}>
                  <Image
                    source={profilePicture ? { uri: profilePicture } : USER_PLACEHOLDER_IMAGE}
                    style={styles.userImage}
                  />
                </View>
                <Text style={styles.sidebarTitleEnhanced}>
                  {userName || "Guest User"}
                </Text>
                <Text style={styles.sidebarSubtitleEnhanced}>
                  Cricket Enthusiast
                </Text>
              </LinearGradient>
            </Animated.View>

            <Animated.View
              style={{
                flex: 1,
                transform: [{ translateY: contentSlideAnim }]
              }}
            >
              <ScrollView 
                contentContainerStyle={styles.sidebarOptionsWrapper} 
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sectionTitle}>Menu</Text>
                
                {sidebarItems.map(({ icon, text, screen }, index) => (
                  <Animated.View
                    key={screen}
                    style={{
                      transform: [{
                        translateX: contentSlideAnim.interpolate({
                          inputRange: [0, 30],
                          outputRange: [0, -20 * (index + 1)],
                        })
                      }]
                    }}
                  >
                    <TouchableOpacity
                      style={styles.sidebarItemPatch}
                      onPress={() => navigateToScreen(screen)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.sidebarItemIcon}>
                        <Ionicons name={icon} size={22} color={AppColors.blue} />
                      </View>
                      <Text style={styles.sidebarItemTextDark}>{text}</Text>
                      <Ionicons name="chevron-forward" size={18} color={AppColors.gray} />
                    </TouchableOpacity>
                  </Animated.View>
                ))}

                <Animated.View
                  style={{
                    transform: [{
                      translateX: contentSlideAnim.interpolate({
                        inputRange: [0, 30],
                        outputRange: [0, -20 * (sidebarItems.length + 1)],
                      })
                    }]
                  }}
                >
                  <TouchableOpacity
                    style={[styles.sidebarItemPatch, styles.logoutPatch]}
                    onPress={LogOutHandler}
                    activeOpacity={0.8}
                  >
                    <View style={styles.sidebarItemIcon}>
                      <Ionicons
                        name="log-out-outline"
                        size={22}
                        color={AppColors.error}
                      />
                    </View>
                    <Text
                      style={[styles.sidebarItemTextDark, { color: AppColors.error }]}
                    >
                      Logout
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={AppColors.error} />
                  </TouchableOpacity>
                </Animated.View>
              </ScrollView>
            </Animated.View>

            <Animated.View
              style={[
                styles.sidebarFooter,
                {
                  transform: [{ translateY: contentSlideAnim }]
                }
              ]}
            >
              <Text style={styles.versionText}>
                Version {APP_VERSION}
              </Text>
              <Text style={styles.copyrightText}>
                {COPYRIGHT_TEXT}
              </Text>
            </Animated.View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

export default Sidebar;