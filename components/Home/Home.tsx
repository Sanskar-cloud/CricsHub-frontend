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
// Assuming AppGradients and AppColors are available here
import { AppColors, AppGradients } from "../../assets/constants/colors.js";


const { width } = Dimensions.get("window");

// Home now receives toggleSidebar and setUserName as props from MainScreens
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
    },
    {
      title: "Host a Tournament",
      buttonText: "Host",
      navigateTo: "CreateTournaments",
      icon: "emoji-events",
    },
    {
      title: "Create a Team",
      buttonText: "Create",
      navigateTo: "CreateTeam",
      icon: "group",
    },
    {
      title: "CricsHub Playground",
      buttonText: "Explore",
      navigateTo: "FantasyCricketScreen",
      icon: "bar-chart",
    },
    {
      title: "Stream Match",
      buttonText: "Stream Now",
      navigateTo: "StreamMatch",
      icon: "live-tv",
    },
  ];

  // --- Initial Setup & Data Fetch ---
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const name = await AsyncStorage.getItem("userName");
        if (name) {
          setUserName(name); // Use the setter prop
        }
      } catch (error) {
        console.error("Failed to fetch user name:", error);
      }
    };

    // const askPermissions = async () => {
    //   await ensureMediaPermission();
    // };

    fetchUserName();
    // askPermissions();
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
    // If no animations have started, start them immediately for all cards.
    if (animatedValues.size === 0) {
      sections.forEach((_, index) => {
        if (!animatedValues.has(index)) {
          animatedValues.set(index, new Animated.Value(0));
        }

        Animated.spring(animatedValues.get(index), {
          toValue: 1,
          friction: 5,
          tension: 40,
          delay: 50 * index, // Staggered entry for a nice effect
          useNativeDriver: true,
        }).start();
      });
    }
  }, []); // Runs once on mount

  // --- Viewability-based Animation (Kept for potential re-scroll animation) ---
  useEffect(() => {
    viewableItems.forEach((item) => {
      if (item.isViewable) {
        if (!animatedValues.has(item.index)) {
          animatedValues.set(item.index, new Animated.Value(0));
          // Start animation here if it hasn't started yet (unlikely after the fix above, but safe)
          Animated.spring(animatedValues.get(item.index), {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      }
      // Note: No need for an else block to animate out, as cards should remain visible
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
        // Navigate to 'Profile' screen within the current (Main) stack
        navigation.navigate("Profile");
      }
    } catch (error) {
      console.error("Failed to set profile prompt flag:", error);
      setShowProfilePopup(false);
    }
  };

  // --- Modals ---
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
              <Ionicons name="person-circle-outline" size={40} color={AppColors.white} />
              <Text style={styles.modalTitle}>Complete Your Profile!</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Welcome! To start playing and get full access to all features,
                please complete your profile with the essential details:
              </Text>

              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Ionicons name="person-outline" size={20} color={AppColors.white} />
                  <Text style={styles.featureText}>Full Name</Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="call-outline" size={20} color={AppColors.white} />
                  <Text style={styles.featureText}>Phone Number</Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="tennisball-outline" size={20} color={AppColors.white} />
                  <Text style={styles.featureText}>Playing Role (Batsman, Bowler, etc.)</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleProfilePromptClosed(true)}
                activeOpacity={0.9}
                style={styles.profileButtonShadow}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#E0E0E0']}
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
        <View style={styles.modalContent}>
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
              <Ionicons name="rocket-outline" size={40} color={AppColors.white} />
              <Text style={styles.modalTitle}>Get Ready for CricsHub Playground!</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                We're building something extraordinary for cricket fans!
                Our Fantasy Cricket platform will let you:
              </Text>

              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Ionicons name="trophy-outline" size={20} color={AppColors.white} />
                  <Text style={styles.featureText}>Create your dream team with real players</Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="trending-up-outline" size={20} color={AppColors.white} />
                  <Text style={styles.featureText}>Earn points based on real-match performances</Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="cash-outline" size={20} color={AppColors.white} />
                  <Text style={styles.featureText}>Compete for amazing prizes and bragging rights</Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="people-outline" size={20} color={AppColors.white} />
                  <Text style={styles.featureText}>Challenge friends and join leagues</Text>
                </View>
              </View>

              <View style={styles.countdownContainer}>
                <Text style={styles.countdownTitle}>Mark Your Calendar!</Text>
                <Text style={styles.countdownDate}>Launching on November 20, 2025</Text>
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
                <Text style={styles.popupFooterText}>We're 75% complete with development</Text>
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
      {/* Include both popups */}
      <FantasyPopup />
      <ProfilePopup />
      <View style={styles.safeArea}>
        <View style={styles.topBarWrapper}>
          <View style={styles.topBar}>
            {/* Call the prop function toggleSidebar */}
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <Ionicons
                name="person-circle-outline"
                size={30}
                color={AppColors.blue}
              />
            </TouchableOpacity>
            <Image
              source={require("../../assets/images/textLogo.png")}
              style={styles.topBarImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.content}>
            <FlatList
              data={sections}
              numColumns={2}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={true}
              // Only needed for re-scrolling animations, initial load is handled by useEffect
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              renderItem={({ item, index }) => {
                const animatedStyle = {
                  opacity: animatedValues.has(index)
                    ? animatedValues.get(index).interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 0.5, 1],
                    })
                    : 0, // Fallback opacity for safety
                  transform: [
                    {
                      scale: animatedValues.has(index)
                        ? animatedValues.get(index).interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.5, 1.1, 1],
                        })
                        : 0.5, // Fallback scale for safety
                    },
                  ],
                };

                return (
                  <Animated.View
                    style={[
                      styles.card,
                      item.isFullWidth ? styles.fullWidthCard : {},
                      animatedStyle,
                    ]}
                  >
                    <LinearGradient
                      colors={AppGradients.primaryCard}
                      style={styles.cardBackground}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <MaterialIcons
                        name={item.icon}
                        size={40}
                        color={AppColors.white}
                        style={styles.cardIcon}
                      />
                      <Text style={styles.cardTitle}>{item.title}</Text>
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
                        <Text style={styles.cardButtonText}>
                          {item.buttonText}
                        </Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </Animated.View>
                );
              }}
            />
          </View>
        </View>
      </View >
    </View >
  );
};

export const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  safeArea: { flex: 1, backgroundColor: "transparent" },
  topBarWrapper: {
    backgroundColor: AppColors.white,
    shadowColor: AppColors.black,
    elevation: 3,
    zIndex: 10,
    // Safely apply status bar padding here
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 50,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 56,
  },
  menuButton: {
    paddingRight: 15,
    paddingVertical: 0,
  },
  topBarImage: {
    width: 120,
    height: 30,
    marginLeft: 5,
  },

  mainContent: {
    flex: 1,
    backgroundColor: AppColors.white,
  },

  content: { flex: 1, padding: 20 },
  card: {
    flex: 1,
    borderRadius: 15,
    margin: 10,
    height: 180,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: AppColors.cardBorder,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.75,
    shadowRadius: 4,
    elevation: 5,
  },
  fullWidthCard: {
    width: width - 40,
    marginHorizontal: 10,
  },
  cardBackground: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  cardIcon: { marginBottom: 10 },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.white,
    marginBottom: 10,
    textAlign: "center",
  },
  cardButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.white,
  },
  cardButtonText: {
    color: AppColors.white,
    fontWeight: "600",
    fontSize: 14,
  },

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
    borderRadius: 20,
    overflow: "hidden",
  },
  modalGradient: {
    padding: 25,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 15,
    padding: 5,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: AppColors.white,
    textAlign: "center",
    marginTop: 10,
  },
  modalBody: {
    marginBottom: 25,
  },
  modalText: {
    color: AppColors.white,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  featureList: {
    marginBottom: 25,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 10,
  },
  featureText: {
    color: AppColors.white,
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  popupFooterText: {
    color: AppColors.white,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 15,
    textAlign: "center",
  },

  profileButtonShadow: {
    width: "100%",
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    borderRadius: 12,
  },
  profileButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  profileButtonTextEnhanced: {
    color: AppColors.blue,
    fontWeight: "600",
    fontSize: 16,
  },
  countdownContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  countdownTitle: {
    color: AppColors.white,
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 5,
  },
  countdownDate: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "75%",
    backgroundColor: AppColors.white,
    borderRadius: 4,
  },
});

export default Home;