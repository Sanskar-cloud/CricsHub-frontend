import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Pressable,
  TextInput,
  Image,
  Vibration,
  Platform,
  Animated,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppNavigation } from '../../NavigationService';
import apiService from "../../APIservices";
import { AppColors } from "../../../assets/constants/colors.js";
import { AppGradients } from "../../../assets/constants/colors.js";
import CustomAlertDialog from "../../Customs/CustomDialog.js";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from 'react-native-safe-area-context';

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

              <FlatList
                data={filteredTeam1Players}
                keyExtractor={(item) =>
                  `team-${team1Details.id}-player-${item.id}`
                }
                renderItem={({ item }) => renderPlayerItem({ item, team: 1 })}
                contentContainerStyle={styles.playerList}
                keyboardShouldPersistTaps="handled"
              />

              <Pressable
                style={[
                  styles.actionButton,
                  selectedTeam1.length !== 11 && styles.disabledButton,
                ]}
                onPress={handleContinueToTeam2}
              >
                <Text style={styles.actionButtonText}>
                  Continue to{" "}
                  <Text style={styles.teamNameHighlightSmall}>
                    {team2Details?.name || "Team 2"}
                  </Text>
                </Text>
              </Pressable>
            </>
          )}

          {currentSelectionTeam === 2 && team2Details && (
            <>
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

              <FlatList
                data={filteredTeam2Players}
                keyExtractor={(item) =>
                  `team-${team2Details.id}-player-${item.id}`
                }
                renderItem={({ item }) => renderPlayerItem({ item, team: 2 })}
                contentContainerStyle={styles.playerList}
                keyboardShouldPersistTaps="handled"
              />

              <Pressable
                style={[
                  styles.actionButton,
                  selectedTeam2.length !== 11 && styles.disabledButton,
                ]}
                onPress={handleStartMatch}
                disabled={isLoading}
              >
                <Text style={styles.actionButtonText}>Start Match</Text>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.BgColor,
  },
  mainScreenContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: AppColors.BgColor,
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
  playerList: {
    flexGrow: 1,
    paddingBottom: 80,
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
  actionButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: AppColors.primaryBlue,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    elevation: 5,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  disabledButton: {
    backgroundColor: AppColors.infoGrey,
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