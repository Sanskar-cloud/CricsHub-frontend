import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, AppGradients } from "../../../assets/constants/colors.js";
import apiService from "../../APIservices";
import CustomAlertDialog from "../../Customs/CustomDialog.js";
import { useAppNavigation } from '../../NavigationService';

const SelectPlayingXI = ({ route }) => {
  const navigation = useAppNavigation();
  const { matchDetails, requestBody } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [team1Details, setTeam1Details] = useState(null);
  const [team2Details, setTeam2Details] = useState(null);
  const [selectedTeam1, setSelectedTeam1] = useState([]);
  const [selectedTeam2, setSelectedTeam2] = useState([]);
  const [currentSelectionTeam, setCurrentSelectionTeam] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTeam1Players, setFilteredTeam1Players] = useState([]);
  const [filteredTeam2Players, setFilteredTeam2Players] = useState([]);
  const [isAlertDialogVisible, setIsAlertDialogVisible] = useState(false);
  const [alertDialogMessage, setAlertDialogMessage] = useState("");
  const [alertDialogType, setAlertDialogType] = useState("info");
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // guard to prevent duplicate API call in StrictMode
  const initialized = useRef(false);
  
  // Define the gradient to be used for the active action button
  const actionButtonGradient = AppGradients.primaryButton; 


  // ✅ Initialize match and fetch only Team1
  const initializeTeams = async () => {
    setIsLoading(true);
    setError(null);
    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) {
      setError("Please login again.");
      setIsLoading(false);
      return;
    }

    try {
      setMatchId(route.params.matchId);

      // Fetch only team1 initially
      const response1 = await apiService({
        endpoint: `teams/${matchDetails.team1Id}`,
        method: "GET",
      });

      if (response1.success) {
        setTeam1Details(response1.data.data);
        setFilteredTeam1Players(response1.data.data.players || []);
        console.log("Team 1 details fetched.");
      } else {
        setError(
          `Failed to fetch team 1 details: ${response1.error?.message || "Unknown error"}`
        );
      }
    } catch (err) {
      setError("An unexpected error occurred: " + err.message);
      console.error("Initialize error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Fetch team2 only when needed
  const fetchTeam2Details = async () => {
    setIsLoading(true);
    const token = await AsyncStorage.getItem("jwtToken");
    try {
      const response2 = await apiService({
        endpoint: `teams/${matchDetails.team2Id}`,
        method: "GET",
      });

      if (response2.success) {
        setTeam2Details(response2.data.data);
        setFilteredTeam2Players(response2.data.data.players || []);
        console.log("Team 2 details fetched.");
      } else {
        setError(
          `Failed to fetch team 2 details: ${response2.error?.message || "Unknown error"
          }`
        );
      }
    } catch (err) {
      setError("Error fetching team 2: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialized.current) {
      initializeTeams();
      initialized.current = true;
    }
  }, []);

  const handleSearch = (query, teamNum) => {
    setSearchQuery(query);
    let playersToFilter = [];
    if (teamNum === 1 && team1Details) {
      playersToFilter = team1Details.players || [];
    } else if (teamNum === 2 && team2Details) {
      playersToFilter = team2Details.players || [];
    }

    const filtered = playersToFilter.filter(
      (player) =>
        player.name.toLowerCase().includes(query.toLowerCase()) ||
        (player.role &&
          player.role.toLowerCase().includes(query.toLowerCase()))
    );

    teamNum === 1
      ? setFilteredTeam1Players(filtered)
      : setFilteredTeam2Players(filtered);
  };

  const togglePlayerSelection = (teamNum, playerId) => {
    const selectedTeam = teamNum === 1 ? selectedTeam1 : selectedTeam2;
    const setSelectedTeam = teamNum === 1 ? setSelectedTeam1 : setSelectedTeam2;

    setSelectedTeam((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : prev.length < 11
          ? [...prev, playerId]
          : prev
    );
  };

  const renderPlayerItem = ({ item, team }) => {
    const isSelected = (team === 1 ? selectedTeam1 : selectedTeam2).includes(
      item.id
    );

    const PlayerContent = (
      <View style={styles.playerInfoContainer}>
        <View style={styles.profileIconContainer}>
          <Image
            source={require("../../../assets/defaultLogo.png")}
            style={styles.userImage}
          />
        </View>

        <View style={styles.playerTextContainer}>
          <Text
            style={[styles.playerText, isSelected && styles.selectedPlayerText]}
          >
            {item.name}
          </Text>
          {item.role && (
            <Text
              style={[
                styles.playerRole,
                isSelected && styles.selectedPlayerRole,
              ]}
            >
              {item.role}
            </Text>
          )}
        </View>
      </View>
    );

    return (
      <TouchableOpacity
        style={[
          styles.playerButton,
          !isSelected && styles.unselectedPlayerButton,
        ]}
        onPress={() => togglePlayerSelection(team, item.id)}
        activeOpacity={0.7}
      >
        {isSelected ? (
          <LinearGradient
            colors={AppGradients.primaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.selectedPlayerGradient}
          >
            {PlayerContent}
            <MaterialIcons
              name="check-circle"
              size={24}
              color="#fff"
              style={styles.checkIcon}
            />
          </LinearGradient>
        ) : (
          <>{PlayerContent}</>
        )}
      </TouchableOpacity>
    );
  };

  const shakeScreen = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCloseAlertDialog = () => {
    setIsAlertDialogVisible(false);
    setAlertDialogMessage("");
    setAlertDialogType("info");
  };

  const handleContinueToTeam2 = async () => {
    if (selectedTeam1.length !== 11) {
      setAlertDialogMessage(
        `Please select exactly 11 players for ${team1Details?.name} to continue.`
      );
      setAlertDialogType("error");
      setIsAlertDialogVisible(true);
      Platform.OS === "ios" ? Vibration.vibrate() : Vibration.vibrate(500);
      shakeScreen();
      return;
    }

    await fetchTeam2Details(); // ✅ Fetch team2 only here
    setCurrentSelectionTeam(2);
    setSearchQuery("");
  };

  const handleStartMatch = async () => {
    if (selectedTeam2.length !== 11) {
      setAlertDialogMessage(
        `Please select exactly 11 players for ${team2Details?.name} to start the match.`
      );
      setAlertDialogType("error");
      setIsAlertDialogVisible(true);
      Platform.OS === "ios" ? Vibration.vibrate() : Vibration.vibrate(500);
      shakeScreen();
      return;
    }

    navigation.navigate("TossScreen", {
      matchDetails,
      matchId,
      team1PlayingXIIds: selectedTeam1,
      team2PlayingXIIds: selectedTeam2,
    });
  };

  const initializeMatchAndTeams = async () => {
    // Re-call the initial fetch logic for retry
    await initializeTeams();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={AppColors.BgColor} barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <LottieView
            source={require("../../../assets/animations/Search for Players.json")}
            autoPlay
            loop
            style={styles.lottieLoader}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={AppColors.BgColor} barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={
              currentSelectionTeam === 1
                ? initializeMatchAndTeams
                : fetchTeam2Details
            }
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!matchId || !team1Details) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={AppColors.BgColor} barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primaryBlue} />
          <Text style={styles.loadingText}>Initializing match...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={AppColors.BgColor} barStyle="dark-content" />
      <View style={styles.container}>
        <CustomAlertDialog
          visible={isAlertDialogVisible}
          title="Selection Required"
          message={alertDialogMessage}
          onClose={handleCloseAlertDialog}
          type={alertDialogType}
        />

        <Animated.View
          style={[
            styles.mainScreenContent,
            { transform: [{ translateX: shakeAnimation }] },
          ]}
        >
          {currentSelectionTeam === 1 && (
            <>
              {/* Header Elements */}
              <View style={styles.headerContainer}>
                <Text style={styles.sectionTitle}>
                  <Text style={styles.teamNameHighlight}>
                    {team1Details?.name}
                  </Text>{" "}
                  - Select Playing XI
                </Text>
                <Text style={styles.selectedCount}>
                  Selected:{" "}
                  <Text style={styles.countHighlight}>
                    {selectedTeam1.length}
                  </Text>
                  /11
                </Text>

                <TextInput
                  style={styles.searchBar}
                  placeholder="Search players by name or role..."
                  placeholderTextColor="#888"
                  value={searchQuery}
                  onChangeText={(query) => handleSearch(query, 1)}
                />
              </View>

              {/* Player List (uses flex: 1 to fill space) */}
              <FlatList
                data={filteredTeam1Players}
                keyExtractor={(item) =>
                  `team-${team1Details.id}-player-${item.id}`
                }
                renderItem={({ item }) => renderPlayerItem({ item, team: 1 })}
                contentContainerStyle={styles.playerList}
                keyboardShouldPersistTaps="handled"
                style={styles.flatList} // Apply flatList style with flex: 1
              />

              {/* Action Button (fixed position/footer) */}
              <Pressable
                style={[
                  styles.actionButton,
                  selectedTeam1.length !== 11 ? styles.disabledButton : null,
                ]}
                onPress={handleContinueToTeam2}
                disabled={selectedTeam1.length !== 11}
              >
                {selectedTeam1.length === 11 ? (
                  <LinearGradient
                    colors={actionButtonGradient}
                    style={styles.actionButtonGradient}
                  >
                    <Text style={styles.actionButtonText}>
                      Continue to{" "}
                      <Text style={styles.teamNameHighlightSmall}>
                        {team2Details?.name || "Team 2"}
                      </Text>
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.actionButtonDisabledView}>
                    <Text style={styles.actionButtonText}>
                      Continue to{" "}
                      <Text style={styles.teamNameHighlightSmall}>
                        {team2Details?.name || "Team 2"}
                      </Text>
                    </Text>
                  </View>
                )}
              </Pressable>
            </>
          )}

          {currentSelectionTeam === 2 && team2Details && (
            <>
              {/* Header Elements */}
              <View style={styles.headerContainer}>
                <Text style={styles.sectionTitle}>
                  <Text style={styles.teamNameHighlight}>
                    {team2Details?.name}
                  </Text>{" "}
                  - Select Playing XI
                </Text>
                <Text style={styles.selectedCount}>
                  Selected:{" "}
                  <Text style={styles.countHighlight}>
                    {selectedTeam2.length}
                  </Text>
                  /11
                </Text>

                <TextInput
                  style={styles.searchBar}
                  placeholder="Search players by name or role..."
                  placeholderTextColor="#888"
                  value={searchQuery}
                  onChangeText={(query) => handleSearch(query, 2)}
                />
              </View>

              {/* Player List (uses flex: 1 to fill space) */}
              <FlatList
                data={filteredTeam2Players}
                keyExtractor={(item) =>
                  `team-${team2Details.id}-player-${item.id}`
                }
                renderItem={({ item }) => renderPlayerItem({ item, team: 2 })}
                contentContainerStyle={styles.playerList}
                keyboardShouldPersistTaps="handled"
                style={styles.flatList} // Apply flatList style with flex: 1
              />

              {/* Action Button (fixed position/footer) */}
              <Pressable
                style={[
                  styles.actionButton,
                  selectedTeam2.length !== 11 ? styles.disabledButton : null,
                ]}
                onPress={handleStartMatch}
                disabled={selectedTeam2.length !== 11}
              >
                {selectedTeam2.length === 11 ? (
                  <LinearGradient
                    colors={actionButtonGradient}
                    style={styles.actionButtonGradient}
                  >
                    <Text style={styles.actionButtonText}>Start Match</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.actionButtonDisabledView}>
                    <Text style={styles.actionButtonText}>Start Match</Text>
                  </View>
                )}
              </Pressable>
            </>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.BgColor,
    // Removed specific Android padding here, relying on SafeAreaView and internal view padding
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.BgColor,
  },
  mainScreenContent: {
    flex: 1, // Crucial: Takes up all available space
    paddingHorizontal: 20,
    backgroundColor: AppColors.BgColor,
  },
  headerContainer: {
    // Contains header and search bar, keeps them above the list
    paddingTop: 20, // Add top padding here instead of SafeAreaView
    paddingBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.lightBackground,
  },
  lottieLoader: {
    width: 150,
    height: 150,
  },
  loadingText: {
    marginTop: 10,
    color: AppColors.primaryBlue,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.lightBackground,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: AppColors.errorRed,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: AppColors.primaryBlue,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  retryButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: AppColors.darkText,
  },
  teamNameHighlight: {
    color: AppColors.primaryBlue,
  },
  selectedCount: {
    textAlign: "center",
    marginBottom: 20,
    color: AppColors.mediumText,
    fontSize: 18,
    fontWeight: '600',
  },
  countHighlight: {
    color: AppColors.primaryBlue,
    fontWeight: 'bold',
  },
  searchBar: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: AppColors.inputBorder,
    color: AppColors.darkText,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  flatList: {
    flex: 1, // Crucial: List takes remaining vertical space
  },
  playerList: {
    flexGrow: 1,
    paddingBottom: 100, // Sufficient padding to prevent the last item from being hidden by the fixed button
  },
  playerButton: {
    marginVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unselectedPlayerButton: {
    backgroundColor: AppColors.white,
    padding: 15,
  },
  selectedPlayerGradient: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  playerInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 15,
    backgroundColor: AppColors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.inputBorder,
  },
  userImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  playerTextContainer: {
    flex: 1,
  },
  playerText: {
    fontSize: 17,
    fontWeight: "600",
    color: AppColors.darkText,
  },
  playerRole: {
    fontSize: 14,
    color: AppColors.lightText,
    fontWeight: '400',
  },
  selectedPlayerText: {
    color: AppColors.white,
  },
  selectedPlayerRole: {
    color: AppColors.inputBorder,
  },
  checkIcon: {
    marginLeft: 10,
  },
  // --- ACTION BUTTON STYLES (MODIFIED) ---
  actionButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 10,
    overflow: 'hidden',
    // Base shadow for the active state
    elevation: 5, 
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  actionButtonGradient: {
    // Active button fill (e.g., AppGradients.primaryButton)
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: 'center',
    width: '100%',
  },
  actionButtonDisabledView: {
    // Disabled button fill
    backgroundColor: AppColors.infoGrey,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: 'center',
    width: '100%',
  },
  disabledButton: {
    // Overrides active button shadow/elevation when disabled
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  actionButtonText: {
    color: AppColors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  teamNameHighlightSmall: {
    fontWeight: 'bold',
  }
});

export default SelectPlayingXI;