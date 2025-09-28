import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
  Image,
  FlatList,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiService from "../../APIservices";
import { AppColors } from "../../../assets/constants/colors";

const MatchOperatives = ({ route, navigation }) => {
  const { matchDetails, requestBody, source } = route.params;
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOperatives, setSelectedOperatives] = useState([]);
  const [disbaleButton, setDisableButton] = useState(false);

  const fetchPlayers = async (query) => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) throw new Error("Please login again");

      setLoading(true);
      const [nameRes, phoneRes] = await Promise.all([
        apiService({
          endpoint: `teams/players/search/name`,
          method: "GET",
          params: { query },
        }),
        apiService({
          endpoint: `teams/players/search/phone`,
          method: "GET",
          params: { query },
        }),
      ]);

      const nameData = nameRes.success ? nameRes.data.data || [] : [];
      const phoneData = phoneRes.success ? phoneRes.data.data || [] : [];
      setFilteredPlayers([...nameData, ...phoneData]);
    } catch (err) {
      console.error("Search failed:", err);
      setFilteredPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  // debounce search
  useEffect(() => {
    const debounceSearch = setTimeout(() => {
      if (searchQuery.trim() !== "" && searchQuery.length > 1) {
        fetchPlayers(searchQuery);
      } else {
        setFilteredPlayers([]);
      }
    }, 500);
    return () => clearTimeout(debounceSearch);
  }, [searchQuery]);

  const handleSelectPlayer = (player) => {
    if (selectedOperatives.some((op) => op.id === player.id)) {
      Alert.alert("Already Added", `${player.name} is already selected.`);
      return;
    }
    setSelectedOperatives((prev) => [...prev, player]);
    setSearchQuery("");
    setFilteredPlayers([]);
  };

  const handleRemovePlayer = (id) => {
    setSelectedOperatives((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    if (selectedOperatives.length === 0) {
      Alert.alert("Error", "Please select at least one operative.");
      return;
    }
    const finalBody = {
      ...requestBody,
      matchOperators: selectedOperatives.map((p) => p.id),
    };

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) throw new Error("Please login again");

      const oldMatchDetails = {
        overs: parseInt(matchDetails.overs, 10),
        venue: matchDetails.venue,
        team1Id: matchDetails.team1Id,
        team1Name: matchDetails.team1Name,
        team1Logo: matchDetails.team1Logo,
        team2Id: matchDetails.team2Id,
        team2Name: matchDetails.team2Name,
        team2Logo: matchDetails.team2Logo,
      };

      setDisableButton(true);

      const response = await apiService({
        endpoint: "matches/schedule",
        method: "POST",
        body: finalBody,
      });

      if (response.success) {
        const createdMatchId = response.data.data.id;
        if (source === "schedule") {
          navigation.navigate('MyMatches');
        } else {
          navigation.navigate("SelectPlayingII", {
            matchDetails: oldMatchDetails,
            requestBody: finalBody,
            matchId: createdMatchId,
          });
        }
      } else {
        setDisableButton(false);
        Alert.alert("Error", response.error || "Failed to schedule match");
      }
    } catch (err) {
      setDisableButton(false);
      console.error(err);
      Alert.alert("Error", "Something went wrong while scheduling match.");
    }
  };

  const getInitialOperative = async () => {
    const name = await AsyncStorage.getItem("userName");
    const id = await AsyncStorage.getItem("userUUID");
    if (id && name) {
      const defaultOperative = {
        id,
        name,
        logoPath: null,
        role: null,
      };
      setSelectedOperatives((prev) => {
        if (prev.some((p) => p.id === id)) return prev;
        return [...prev, defaultOperative];
      });
    }
  };

  useEffect(() => {
    if (selectedOperatives.length === 0) {
      getInitialOperative();
    }
  }, []);

  const renderPlayerItem = ({ item }) => (
    <TouchableOpacity
      style={styles.playerItem}
      onPress={() => handleSelectPlayer(item)}
    >
      <View style={styles.playerInfoContainer}>
        <View style={styles.profileIconContainer}>
          <Image
            source={
              item.logoPath
                ? { uri: item.logoPath }
                : require("../../../assets/defaultLogo.png")
            }
            style={styles.userImage}
          />
        </View>
        <View style={styles.playerTextContainer}>
          <Text style={styles.playerText}>{item.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSelectedOperatives = ({ item }) => (
    <View style={styles.selectedItem}>
      <View style={styles.profileIconContainer}>
        <Image
          source={
            item.logoPath
              ? { uri: item.logoPath }
              : require("../../../assets/defaultLogo.png")
          }
          style={styles.userImage}
        />
      </View>
      <View style={styles.playerTextContainer}>
        <Text style={styles.playerText}>{item.name}</Text>
      </View>
      <TouchableOpacity onPress={() => handleRemovePlayer(item.id)}>
        <Ionicons name="close-circle" size={20} color={AppColors.black} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.white} translucent={true} />
      <View style={styles.contentWrapper}>
        <Text style={styles.title}>Select Match Operatives</Text>
        <Text style={styles.subTitle}>Match operatives score and stream match</Text>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#4A90E2" />
            <TextInput
              style={styles.input}
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={AppColors.darkText} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.dropdownContainer}>
              <ActivityIndicator size="small" color="#4A90E2" style={{ margin: 8 }} />
            </View>
          ) : (
            filteredPlayers.length > 0 && (
              <View style={styles.dropdownContainer}>
                <FlatList
                  data={filteredPlayers}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderPlayerItem}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            )
          )}
        </View>

        <View style={styles.selectedListContainer}>
          <FlatList
            data={selectedOperatives}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSelectedOperatives}
            contentContainerStyle={{ gap: 10 }}
          />
        </View>
      </View>
      <View style={styles.submitButtonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={disbaleButton}>
          <Text style={styles.submitButtonText}>Schedule Match</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MatchOperatives;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
  },
  contentWrapper: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "semibold",
    marginBottom: 10,
    color: AppColors.infoGrey,
  },
  searchSection: {
    position: "relative",
    marginBottom: 10,
    zIndex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  input: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
  },
  dropdownContainer: {
    position: "absolute",
    top: "100%", // Position below the search bar
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  playerItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  selectedListContainer: {
    flex: 1,
    marginVertical: 10,
  },
  selectedItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    gap: 10,
  },
  submitButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  submitButton: {
    backgroundColor: "#4A90E2",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
    overflow: "hidden",
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
});