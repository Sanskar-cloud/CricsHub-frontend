import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppColors, AppGradients } from "../../assets/constants/colors.js";
import apiService from "../APIservices";

const { width, height } = Dimensions.get("window");

const Home = ({ navigation, toggleSidebar, userName, setUserName }) => {

  const [viewableItems, setViewableItems] = useState([]);
  const [showFantasyPopup, setShowFantasyPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const animatedValues = useRef(new Map()).current;

  const sections = [
    {
      title: "Start a Match",
      buttonText: "Start",
      navigateTo: "InstantMatch",
      icon: "sports-cricket",
      description: "Quick cricket matches"
    },
    {
      title: "Host a Tournament",
      buttonText: "Host",
      navigateTo: "CreateTournaments",
      icon: "emoji-events",
      description: "Organize tournaments"
    },
    {
      title: "Create a Team",
      buttonText: "Create",
      navigateTo: "CreateTeam",
      icon: "group",
      description: "Build your squad"
    },
    {
      title: "CricsHub Playground",
      buttonText: "Explore",
      navigateTo: "FantasyCricketScreen",
      icon: "bar-chart",
      description: "Fantasy cricket"
    },
    {
      title: "Stream Match",
      buttonText: "Stream Now",
      navigateTo: "StreamMatch",
      icon: "live-tv",
      description: "Live streaming"
    },
  ];

  // --- Initial Setup & Data Fetch ---
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const response = await apiService({
          endpoint: "profile/current",
          method: "GET",
        });

        if (!response.success) {
          throw new Error(response.error?.message || "Failed to load profile data");
        }
        const profileData = response.data.data || response.data;
        setUserName(profileData.name);
        await AsyncStorage.setItem("userName", profileData.name);
      } catch (error) {
        console.error("Failed to fetch user name:", error);
      }
    };

    fetchUserName();
  }, [setUserName]);

  // --- Profile Prompt Logic ---
  useEffect(() => {
    const checkFirstTimeLogin = async () => {
      try {
        const hasCompletedProfilePrompt = await AsyncStorage.getItem("hasCompletedProfilePrompt");
        if (hasCompletedProfilePrompt !== "true") {
          setShowProfilePopup(true);
        }
      } catch (error) {
        console.error("Failed to check first-time login status:", error);
      }
    };
    checkFirstTimeLogin();
  }, []);

  // --- FIX: Animation Trigger on Initial Mount ---
  useEffect(() => {
    if (animatedValues.size === 0) {
      sections.forEach((_, index) => {
        if (!animatedValues.has(index)) {
          animatedValues.set(index, new Animated.Value(0));
        }

        Animated.spring(animatedValues.get(index), {
          toValue: 1,
          friction: 5,
          tension: 40,
          delay: 50 * index,
          useNativeDriver: true,
        }).start();
      });
    }
  }, []);

  // --- Viewability-based Animation ---
  useEffect(() => {
    viewableItems.forEach((item) => {
      if (item.isViewable) {
        if (!animatedValues.has(item.index)) {
          animatedValues.set(item.index, new Animated.Value(0));
          Animated.spring(animatedValues.get(item.index), {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      }
    });
  }, [viewableItems]);

  const handleButtonPressIn = (index) => {
    if (!animatedValues.has(index)) {
      animatedValues.set(index, new Animated.Value(1));
    }
    Animated.spring(animatedValues.get(index), {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = (index) => {
    if (!animatedValues.has(index)) {
      animatedValues.set(index, new Animated.Value(1));
    }
    Animated.spring(animatedValues.get(index), {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const onViewableItemsChanged = useRef(({ viewableItems: vItems }) => {
    setViewableItems(vItems);
  }).current;

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  const handleProfilePromptClosed = async (shouldNavigate = false) => {
    try {
      await AsyncStorage.setItem("hasCompletedProfilePrompt", "true");
      setShowProfilePopup(false);
      if (shouldNavigate) {
        navigation.navigate("Profile");
      }
    } catch (error) {
      console.error("Failed to set profile prompt flag:", error);
      setShowProfilePopup(false);
    }
  };

  // --- Enhanced Modals ---
  const ProfilePopup = () => (
    <Modal
      visible={showProfilePopup}
      transparent={true}
      animationType="fade"
      onRequestClose={() => handleProfilePromptClosed(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={AppGradients.primaryCard}
            style={styles.modalGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => handleProfilePromptClosed(false)}
            >
              <Ionicons name="close" size={24} color={AppColors.white} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-circle-outline" size={32} color={AppColors.white} />
              </View>
              <Text style={styles.modalTitle}>Complete Your Profile!</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Welcome! To start playing and get full access to all features,
                please complete your profile with the essential details:
              </Text>

              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name="person-outline" size={18} color={AppColors.white} />
                  </View>
                  <Text style={styles.featureText}>Full Name</Text>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name="call-outline" size={18} color={AppColors.white} />
                  </View>
                  <Text style={styles.featureText}>Phone Number</Text>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name="tennisball-outline" size={18} color={AppColors.white} />
                  </View>
                  <Text style={styles.featureText}>Playing Role</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleProfilePromptClosed(true)}
                activeOpacity={0.9}
                style={styles.profileButtonShadow}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F8F9FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.profileButton}
                >
                  <Text style={styles.profileButtonTextEnhanced}>
                    Go to Profile Settings
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={AppColors.blue} style={{ marginLeft: 10 }} />
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.popupFooterText}>You can update your profile later from the sidebar.</Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  const FantasyPopup = () => (
    <Modal
      visible={showFantasyPopup}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFantasyPopup(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.compactModalContent}>
          <LinearGradient
            colors={AppGradients.primaryCard}
            style={styles.modalGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFantasyPopup(false)}
            >
              <Ionicons name="close" size={24} color={AppColors.white} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="rocket-outline" size={28} color={AppColors.white} />
              </View>
              <Text style={styles.compactModalTitle}>Get Ready for CricsHub Playground!</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.compactModalText}>
                We're building something extraordinary for cricket fans! Our Fantasy Cricket platform is coming soon.
              </Text>

              <View style={styles.compactFeatureList}>
                {[
                  "Create your dream team",
                  "Earn points from real matches", 
                  "Compete for amazing prizes",
                  "Challenge friends"
                ].map((feature, index) => (
                  <View key={index} style={styles.compactFeatureItem}>
                    <View style={styles.featureIconContainer}>
                      <Ionicons name="checkmark" size={14} color={AppColors.white} />
                    </View>
                    <Text style={styles.compactFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.countdownContainer}>
                <Text style={styles.countdownTitle}>Coming Soon!</Text>
                <Text style={styles.countdownDate}>Launching December 20, 2025</Text>
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
                <Text style={styles.popupFooterText}>Development in progress</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  // --- Main Render ---
  return (
    <View style={styles.appContainer}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={AppColors.white}
        translucent={true}
      />
      
      <FantasyPopup />
      <ProfilePopup />
      
      <View style={styles.safeArea}>
        {/* Compact Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FF']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={toggleSidebar} style={styles.profileButton}>
                <View style={styles.profileIconContainer}>
                  <Ionicons name="person-circle-outline" size={28} color={AppColors.blue} />
                </View>
              </TouchableOpacity>
              
              <View style={styles.headerCenter}>
                <Image
                  source={require("../../assets/images/textLogo.png")}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
              </View>
              
              <View style={styles.headerRight} />
            </View>
          </LinearGradient>
        </View>

        {/* Main Content - Stretchable Grid like Swiggy */}
        <View style={styles.mainContent}>
          <FlatList
            data={sections}
            numColumns={2}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            renderItem={({ item, index }) => {
              const animatedStyle = {
                opacity: animatedValues.has(index)
                  ? animatedValues.get(index).interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.5, 1],
                  })
                  : 0,
                transform: [
                  {
                    scale: animatedValues.has(index)
                      ? animatedValues.get(index).interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.5, 1.1, 1],
                      })
                      : 0.5,
                  },
                  {
                    translateY: animatedValues.has(index)
                      ? animatedValues.get(index).interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      })
                      : 50,
                  }
                ],
              };

              return (
                <Animated.View
                  style={[
                    styles.cardContainer,
                    animatedStyle,
                  ]}
                >
                  <LinearGradient
                    colors={AppGradients.primaryCard}
                    style={styles.cardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardIconContainer}>
                        <MaterialIcons
                          name={item.icon}
                          size={24}
                          color={AppColors.white}
                        />
                      </View>
                    </View>
                    
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardDescription}>{item.description}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.cardButton}
                      onPressIn={() => handleButtonPressIn(index)}
                      onPressOut={() => handleButtonPressOut(index)}
                      onPress={() => {
                        if (item.title === "CricsHub Playground") {
                          setShowFantasyPopup(true);
                        } else {
                          navigation.navigate(item.navigateTo);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.cardButtonText}>
                          {item.buttonText}
                        </Text>
                        <Ionicons name="arrow-forward" size={14} color={AppColors.white} />
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </Animated.View>
              );
            }}
          />
        </View>
      </View>
    </View>
  );
};

export const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  safeArea: { 
    flex: 1, 
    backgroundColor: "transparent" 
  },
  
  // Compact Header Styles
  headerContainer: {
    backgroundColor: AppColors.white,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 40,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 50,
  },
  profileButton: {
    padding: 6,
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8EFFF',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerLogo: {
    width: 130,
    height: 32,
  },
  headerRight: {
    width: 40,
  },

  // Main Content - Swiggy Style Stretchable
  mainContent: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  listContainer: {
    flexGrow: 1,
    padding: 12,
    paddingTop: 15,
    paddingBottom: 100, // Extra padding for footer
  },

  // Stretchable Card Styles
  cardContainer: {
    flex: 1,
    margin: 6,
    aspectRatio: 0.9, // Square-ish cards like Swiggy
    minHeight: 180,
    maxHeight: 220,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardHeader: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.white,
    marginBottom: 6,
    lineHeight: 20,
  },
  cardDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  cardButton: {
    marginTop: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardButtonText: {
    color: AppColors.white,
    fontWeight: '600',
    fontSize: 13,
    marginRight: 6,
  },

  // Modal Styles (unchanged)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  compactModalContent: {
    width: "90%",
    maxWidth: 350,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    maxHeight: height * 1.65,
  },
  modalGradient: {
    padding: 24,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 16,
    padding: 6,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 5,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: AppColors.white,
    textAlign: "center",
    lineHeight: 26,
  },
  compactModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.white,
    textAlign: "center",
    lineHeight: 24,
    marginTop: 5,
  },
  modalBody: {
    marginBottom: 8,
  },
  modalText: {
    color: AppColors.white,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  compactModalText: {
    color: AppColors.white,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  featureList: {
    marginBottom: 20,
  },
  compactFeatureList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 14,
    borderRadius: 10,
  },
  compactFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  featureIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  featureText: {
    color: AppColors.white,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  compactFeatureText: {
    color: AppColors.white,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  popupFooterText: {
    color: AppColors.white,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 12,
    textAlign: "center",
    opacity: 0.9,
  },
  profileButtonShadow: {
    width: "100%",
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 14,
  },
  profileButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  profileButtonTextEnhanced: {
    color: AppColors.blue,
    fontWeight: "600",
    fontSize: 15,
  },
  countdownContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  countdownTitle: {
    color: AppColors.white,
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
  },
  countdownDate: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "75%",
    backgroundColor: AppColors.white,
    borderRadius: 3,
  },
});

export default Home;