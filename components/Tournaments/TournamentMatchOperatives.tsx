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
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiService from "../APIservices";
import { AppColors } from "../../assets/constants/colors";

const TournamentMatchOperatives = ({ route, navigation }) => {
  const { tournamentData } = route.params;
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOperatives, setSelectedOperatives] = useState([]);
  const [enableButton, setEnableButton] = useState(true);

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

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) throw new Error("Please login again");

      const formData = new FormData();
      formData.append("name", tournamentData.name);
      formData.append("startDate", tournamentData.startDate);
      formData.append("endDate", tournamentData.endDate);
      formData.append("format", tournamentData.format);
      formData.append("type", tournamentData.type);
      formData.append("ballType", tournamentData.ballType);
      formData.append("matchesPerDay", tournamentData.matchesPerDay);
      formData.append("matchesPerTeam", tournamentData.matchesPerTeam);
      formData.append("venues", tournamentData.venues);
      formData.append(
        "tnmtMatchOps",
        JSON.stringify(selectedOperatives.map((p) => p.id))
      );

      console.log(formData);

      if (tournamentData.banner) {
        const fileName = tournamentData.banner.split("/").pop();
        const fileType = fileName.split(".").pop();
        formData.append(
          "banner",
          {
            uri: tournamentData.banner,
            name: fileName,
            type: `image/${fileType}`,
          } as any // Cast to any for React Native compatibility
        );
      }

      setEnableButton(false);
      const response = await apiService({
        endpoint: `tournaments/${tournamentData.userId}`,
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.success) {
        Alert.alert("Success", "Tournament created successfully!");
        navigation.navigate("Tournaments");
      } else {
        setEnableButton(true);
        Alert.alert("Error", response.error?.message || "Failed to create tournament");
      }
    } catch (err) {
      setEnableButton(true);
      console.error(err);
      Alert.alert("Error", "Something went wrong while creating tournament.");
    }
  };

  const getInitialOperative = async () => {
    const name = await AsyncStorage.getItem("userName");
    const id = await AsyncStorage.getItem("userUUID");
    if (id && name) {
      const defaultOperative = { id, name, logoPath: null, role: null };
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
                : require("../../assets/defaultLogo.png")
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
    <View style={styles.selectedItem} key={item.id}>
      <View style={styles.profileIconContainer}>
        <Image
          source={
            item.logoPath
              ? { uri: item.logoPath }
              : require("../../assets/defaultLogo.png")
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
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <View style={styles.container}>
        <Text style={styles.title}>Select Tournament Operatives</Text>
        <Text style={styles.subTitle}>
          Tournament operatives will manage scoring and streaming
        </Text>

        <View style={styles.selectedList}>
          <FlatList
            data={selectedOperatives}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSelectedOperatives}
            contentContainerStyle={{ gap: 10 }}
          />
        </View>

        <View style={{ position: "relative", marginBottom: 10 }}>
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
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={AppColors.darkText}
                />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.dropdownContainer}>
              <ActivityIndicator
                size="small"
                color="#4A90E2"
                style={{ margin: 8 }}
              />
            </View>
          ) : (
            filteredPlayers.length > 0 && (
              <View style={styles.dropdownContainer}>
                <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                  {filteredPlayers.map((player) => (
                    <View key={player.id}>{renderPlayerItem({ item: player })}</View>
                  ))}
                </ScrollView>
              </View>
            )
          )}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={!enableButton}>
          <Text style={styles.submitButtonText}>Create Tournament</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default TournamentMatchOperatives;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold" },
  subTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    color: AppColors.infoGrey,
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
  input: { flex: 1, marginLeft: 8, paddingVertical: 12 },
  dropdownContainer: {
    position: "absolute",
    top: 50,
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
  selectedList: { marginVertical: 20 },
  selectedItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    gap: 10,
  },
  submitButton: {
    backgroundColor: "#4A90E2",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  playerInfoContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
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
  userImage: { width: "100%", height: "100%", borderRadius: 24 },
  playerTextContainer: { flex: 1 },
  playerText: { fontSize: 17, fontWeight: "600", color: AppColors.darkText },
  playerRole: {
    fontSize: 14,
    color: AppColors.lightText,
    fontWeight: "400",
  },
});
