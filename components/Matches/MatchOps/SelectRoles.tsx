import { FlatList, Pressable, StyleSheet, Text, View, Animated, Image, ActivityIndicator, Vibration, Platform, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import apiService from '../../APIservices';
import { AppGradients, AppColors } from '../../../assets/constants/colors.js';
import LottieView from 'lottie-react-native';
import CustomAlertDialog from '../../Customs/CustomDialog.js';
const MIN_LOAD_TIME = 3000;

const SelectRoles = ({ route, navigation }) => {
  const { matchId, isFirstInnings } = route.params;

  const [battingXI, setBattingXI] = useState([]);
  const [bowlingXI, setBowlingXI] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [strikerId, setStrikerId] = useState(null);
  const [strikerName, setStrikerName] = useState(null);
  const [nonStrikerId, setNonStrikerId] = useState(null);
  const [nonStrikerName, setNonStrikerName] = useState(null);
  const [bowlerId, setBowlerId] = useState(null);
  const [bowlerName, setBowlerName] = useState(null);
  const [step, setStep] = useState(1);

  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const [isAlertDialogVisible, setIsAlertDialogVisible] = useState(false);
  const [alertDialogTitle, setAlertDialogTitle] = useState("");
  const [alertDialogMessage, setAlertDialogMessage] = useState("");
  const [alertDialogType, setAlertDialogType] = useState("info");
  const [alertDialogButtons, setAlertDialogButtons] = useState([]);

  const handleCloseAlertDialog = () => {
    setIsAlertDialogVisible(false);
    setAlertDialogTitle("");
    setAlertDialogMessage("");
    setAlertDialogType("info");
    setAlertDialogButtons([]);
  };

  const fetchPlayingXI = useCallback(async () => {
    console.log("Fetching Playing XI for matchId:", matchId);
    let startTime = Date.now();

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      console.log("Retrieved JWT Token:", token ? "Token Found" : "Token NOT Found");
      if (!token) throw new Error("Please login again. JWT token not found.");

      const [responseBatting, responseBowling] = await Promise.all([
        apiService({
          endpoint: `matches/${matchId}/playingXI/batting`,
          method: 'GET',
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        }),
        apiService({
          endpoint: `matches/${matchId}/playingXI/bowling`,
          method: 'GET',
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        }),
      ]);

      console.log("API Response - Batting:", responseBatting);
      console.log("API Response - Bowling:", responseBowling);

      if (responseBatting.success && responseBowling.success) {
        setBattingXI(responseBatting.data || []);
        setBowlingXI(responseBowling.data || []);
        console.log("Batting XI set:", responseBatting.data);
        console.log("Bowling XI set:", responseBowling.data);
      } else {
        const battingError = responseBatting.error?.message || 'Unknown batting error';
        const bowlingError = responseBowling.error?.message || 'Unknown bowling error';
        setAlertDialogTitle("Error Loading Players");
        setAlertDialogMessage(`Unable to load playing XIs. Batting: ${battingError}. Bowling: ${bowlingError}`);
        setAlertDialogType("error");
        setIsAlertDialogVisible(true);
      }
    } catch (err) {
      console.error("Error fetching playing XI:", err);
      setAlertDialogTitle("Network Error");
      setAlertDialogMessage(`Failed to fetch playing XI: ${err.message || 'Network error'}.`);
      setAlertDialogType("error");
      setIsAlertDialogVisible(true);
    } finally {
      // --- Ensure minimum load time ---
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MIN_LOAD_TIME - elapsedTime;

      if (remainingTime > 0) {
        console.log(`Delaying loader for ${remainingTime}ms to meet minimum load time.`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      // --- End of minimum load time logic ---

      setIsLoading(false);
      console.log("Finished fetching playing XI. isLoading set to false.");
    }
  }, [matchId]);

  useEffect(() => {
    fetchPlayingXI();
  }, []);

  const shakeScreen = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const handleSelectBatsman = ({ playerId, name }) => {
    if (strikerId === playerId) {
      setStrikerId(null);
      setStrikerName(null);
    } else if (nonStrikerId === playerId) {
      setNonStrikerId(null);
      setNonStrikerName(null);
    } else if (!strikerId) {
      setStrikerId(playerId);
      setStrikerName(name);
    } else if (!nonStrikerId) {
      if (playerId === strikerId) {
        setAlertDialogTitle("Invalid Selection");
        setAlertDialogMessage("This player is already selected as the Striker. Please select a different Non-Striker.");
        setAlertDialogType("warning");
        setAlertDialogButtons([{ text: 'OK', onPress: handleCloseAlertDialog }]);
        setIsAlertDialogVisible(true);
        Vibration.vibrate(500);
        shakeScreen();
        return;
      }
      setNonStrikerId(playerId);
      setNonStrikerName(name);
    } else {
      setAlertDialogTitle("Selection Limit");
      setAlertDialogMessage("You can only select two batsmen (Striker and Non-Striker). Please deselect one first if you want to change.");
      setAlertDialogType("info");
      setAlertDialogButtons([{ text: 'OK', onPress: handleCloseAlertDialog }]);
      setIsAlertDialogVisible(true);
      Vibration.vibrate(500);
      shakeScreen();
    }
  };

  const handleSelectBowler = ({ playerId, name }) => {
    if (bowlerId === playerId) {
      setBowlerId(null);
      setBowlerName(null);
    } else if (!bowlerId) {
      if (playerId === strikerId || playerId === nonStrikerId) {
        setAlertDialogTitle("Invalid Selection");
        setAlertDialogMessage("This player is already selected as a batsman. Please select a different bowler.");
        setAlertDialogType("warning");
        setAlertDialogButtons([{ text: 'OK', onPress: handleCloseAlertDialog }]);
        setIsAlertDialogVisible(true);
        Vibration.vibrate(500);
        shakeScreen();
        return;
      }
      setBowlerId(playerId);
      setBowlerName(name);
    } else {
      setAlertDialogTitle("Change Bowler");
      setAlertDialogMessage("A bowler is already selected. Do you want to select this player as the new bowler?");
      setAlertDialogType("info");
      setAlertDialogButtons([
        {
          text: "CANCEL",
          onPress: handleCloseAlertDialog,
          gradientColors: AppGradients.errorButton,
          style: styles.cancelButton
        },
        {
          text: "YES",
          onPress: () => {
            handleCloseAlertDialog();
            if (playerId === strikerId || playerId === nonStrikerId) {
              setAlertDialogTitle("Invalid Selection");
              setAlertDialogMessage("This player is already selected as a batsman. Please select a different bowler.");
              setAlertDialogType("warning");
              setAlertDialogButtons([{ text: 'OK', onPress: handleCloseAlertDialog }]);
              setIsAlertDialogVisible(true);
              Vibration.vibrate(500);
              shakeScreen();
              return;
            }
            setBowlerId(playerId);
            setBowlerName(name);
          },
          gradientColors: AppGradients.successButton,
        }
      ]);
      setIsAlertDialogVisible(true);
      Vibration.vibrate(500);
      shakeScreen();
    }
  };

  const handleSubmit = async () => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      setAlertDialogTitle('Missing Selection');
      setAlertDialogMessage('Please select a striker, non-striker, and bowler to proceed.');
      setAlertDialogType("error");
      setAlertDialogButtons([{ text: 'OK', onPress: handleCloseAlertDialog }]);
      setIsAlertDialogVisible(true);
      Vibration.vibrate(500);
      shakeScreen();
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) throw new Error("Please login again");

      const response = await apiService({
        endpoint: `matches/${matchId}/players/update`,
        method: 'POST',
        body: {
          striker: strikerId,
          nonStriker: nonStrikerId,
          bowler: bowlerId,
        },
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });

      if (response.success) {
        navigation.replace('MatchStartTransition', {
          matchId,
          strikerId,
          nonStrikerId,
          bowler: bowlerId,
          selectedStrikerName: strikerName,
          selectedNonStrikerName: nonStrikerName,
          selectedBowlerName: bowlerName,
          isFirstInnings,
          score: 0,
          wicket: 0,
          completedOvers: 0,
          matchDetails: route.params.matchDetails
        });
      } else {
        setAlertDialogTitle('Update Failed');
        setAlertDialogMessage(`Failed to update players: ${response.error?.message || 'Unknown error'}. Please try again.`);
        setAlertDialogType("error");
        setAlertDialogButtons([{ text: 'OK', onPress: handleCloseAlertDialog }]);
        setIsAlertDialogVisible(true);
        Vibration.vibrate(500);
        shakeScreen();
      }
    } catch (err) {
      console.error("Submit players error:", err);
      setAlertDialogTitle('Submission Error');
      setAlertDialogMessage(`Failed to update players due to a network error or server issue: ${err.message || 'Unknown error'}.`);
      setAlertDialogType("error");
      setAlertDialogButtons([{ text: 'OK', onPress: handleCloseAlertDialog }]);
      setIsAlertDialogVisible(true);
      Vibration.vibrate(500);
      shakeScreen();
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlayerItem = ({ item }) => {
    const isStriker = strikerId === item.playerId;
    const isNonStriker = nonStrikerId === item.playerId;
    const isBowler = bowlerId === item.playerId;

    const isSelected = isStriker || isNonStriker || isBowler;

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
            {String(item.name)}
          </Text>
          {item.role && (
            <Text
              style={[styles.playerRole, isSelected && styles.selectedPlayerRole]}
            >
              {String(item.role)}
            </Text>
          )}
        </View>
      </View>
    );

    return (
      <TouchableOpacity
        style={[styles.playerButton, !isSelected && styles.unselectedPlayerButton]}
        onPress={() => step === 1 ?
          handleSelectBatsman({ playerId: item.playerId, name: item.name }) :
          handleSelectBowler({ playerId: item.playerId, name: item.name })}
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
            <View style={styles.selectedRoleIndicator}>
              {isStriker && <Text style={styles.selectedRoleText}>Striker</Text>}
              {isNonStriker && <Text style={styles.selectedRoleText}>Non-Striker</Text>}
              {isBowler && <Text style={styles.selectedRoleText}>Bowler</Text>}
              <MaterialIcons
                name="check-circle"
                size={24}
                color="#fff"
                style={styles.checkIcon}
              />
            </View>
          </LinearGradient>
        ) : (
          <>
            {PlayerContent}
          </>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../../assets/animations/Search for Players.json')}
          autoPlay
          loop
          style={styles.lottieLoader}
        />
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.BgColor} translucent={true} />
      <Animated.View
        style={[
          styles.mainScreenContent,
          { transform: [{ translateX: shakeAnimation }] }
        ]}
      >
        <Text style={styles.sectionTitle}>
          Select Player Roles
        </Text>

        <Text style={styles.selectedCount}>
          {step === 1 ? `Batsmen Selected: ${strikerId ? 1 : 0} + ${nonStrikerId ? 1 : 0} / 2` : `Bowler Selected: ${bowlerId ? 1 : 0} / 1`}
        </Text>

        <TextInput
          style={styles.searchBar}
          placeholder="Search players..."
          placeholderTextColor="#888"
          editable={false}
        />

        {step === 1 ? (
          <FlatList
            data={battingXI}
            keyExtractor={(item) => item.playerId?.toString() || Math.random().toString()}
            renderItem={renderPlayerItem}
            contentContainerStyle={styles.playerList}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          <FlatList
            data={bowlingXI}
            keyExtractor={(item) => item.playerId?.toString() || Math.random().toString()}
            renderItem={renderPlayerItem}
            contentContainerStyle={styles.playerList}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {step === 1 ? (
          <Pressable
            style={[
              styles.actionButton,
              (!strikerId || !nonStrikerId) && styles.disabledButton,
            ]}
            onPress={() => setStep(2)}
            disabled={!strikerId || !nonStrikerId}
          >
            <Text style={styles.actionButtonText}>Continue to Bowler</Text>
          </Pressable>
        ) : (
          <View style={styles.bottomButtonContainer}>
            <Pressable
              onPress={() => setStep(1)}
              style={[
                styles.actionButton,
                styles.smallActionButton,
                { width: '48%', backgroundColor: AppColors.infoGrey },
              ]}
            >
              <Text style={styles.actionButtonText}>Back</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={isLoading || !bowlerId}
              style={[
                styles.actionButton,
                styles.smallActionButton,
                { width: '48%' },
                (isLoading || !bowlerId) && styles.disabledButton,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={AppColors.white} />
              ) : (
                <Text style={styles.actionButtonText}>Start Scoring</Text>
              )}
            </Pressable>
          </View>
        )}
      </Animated.View>

      <CustomAlertDialog
        visible={isAlertDialogVisible}
        title={alertDialogTitle}
        message={alertDialogMessage}
        onClose={handleCloseAlertDialog}
        type={alertDialogType}
        buttons={alertDialogButtons}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: AppColors.BgColor,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.BgColor,
  },
  mainScreenContent: {
    flex: 1,
    paddingHorizontal: 20,
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
  selectedCount: {
    textAlign: "center",
    marginBottom: 20,
    color: AppColors.mediumText,
    fontSize: 18,
    fontWeight: '600',
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
    marginBottom: 2,
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
  selectedRoleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  selectedRoleText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: AppColors.white,
    marginRight: 5,
  },
  checkIcon: {
    marginLeft: 5,
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
    justifyContent: "center",
    elevation: 5,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  smallActionButton: {
    position: 'relative',
    bottom: 0,
    left: 0,
    right: 0,
    width: 'auto',
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
  bottomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  shimmerContainer: {
    backgroundColor: AppColors.inputBackground,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 6,
    height: 60,
    justifyContent: 'center',
  },
  shimmerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AppColors.cardBorder,
    opacity: 0.7,
  },
  cancelButton: {
  }
});

export default SelectRoles;