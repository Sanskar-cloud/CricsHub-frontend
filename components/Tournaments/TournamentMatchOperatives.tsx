import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppColors } from "../../assets/constants/colors";
import apiService from "../APIservices";
import CustomAlertDialog from "../Customs/CustomDialog.js";

// Define gradient colors for the alert buttons
const AlertGradients = {
  primary: ['#4A90E2', '#357ABD'],
  success: ['#4CAF50', '#45a049'],
  error: ['#F44336', '#d32f2f'],
  warning: ['#FFC107', '#ff8f00'],
  info: ['#17A2B8', '#0288d1']
};

const TournamentMatchOperatives = ({ route, navigation }) => {
  const { tournamentData } = route.params;
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOperatives, setSelectedOperatives] = useState([]);
  const [enableButton, setEnableButton] = useState(true);
  const [creatingTournament, setCreatingTournament] = useState(false);

  // Custom Alert Dialog States
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });

  // Custom Alert Helper Function
  const showCustomAlert = (message, type = 'info', buttons = []) => {
    setAlertConfig({
      title: '',
      message,
      type,
      buttons: buttons.length > 0 ? buttons : [{ 
        text: 'OK', 
        onPress: () => setShowAlert(false),
        gradientColors: AlertGradients.primary
      }]
    });
    setShowAlert(true);
  };

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
      
      // Remove duplicates based on player id
      const allPlayers = [...nameData, ...phoneData];
      const uniquePlayers = allPlayers.filter((player, index, self) =>
        index === self.findIndex(p => p.id === player.id)
      );
      
      setFilteredPlayers(uniquePlayers);
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
      showCustomAlert(`${player.name} is already selected.`, 'warning');
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
      showCustomAlert("Please select at least one operative.", 'error');
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
          }
        );
      }

      setEnableButton(false);
      setCreatingTournament(true);

      const response = await apiService({
        endpoint: `tournaments/${tournamentData.userId}`,
        method: "POST",
        body: formData,
        isMultipart: true
      });

      if (response.success) {
        showCustomAlert('Tournament created successfully!', 'success', [
          { 
            text: 'OK', 
            onPress: () => {
              setShowAlert(false);
              navigation.navigate("Tournaments");
            },
            gradientColors: AlertGradients.success
          }
        ]);
      } else {
        setEnableButton(true);
        setCreatingTournament(false);
        showCustomAlert(response.error?.message || "Failed to create tournament", 'error');
      }
    } catch (err) {
      setEnableButton(true);
      setCreatingTournament(false);
      console.error(err);
      showCustomAlert("Something went wrong while creating tournament.", 'error');
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
          {item.role && <Text style={styles.playerRole}>{item.role}</Text>}
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
              : require("../../assets/defaultLogo.png")
          }
          style={styles.userImage}
        />
      </View>
      <View style={styles.playerTextContainer}>
        <Text style={styles.playerText}>{item.name}</Text>
        {item.role && <Text style={styles.playerRole}>{item.role}</Text>}
      </View>
      <TouchableOpacity onPress={() => handleRemovePlayer(item.id)}>
        <Ionicons name="close-circle" size={20} color={AppColors.black} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.white} translucent={true} />
      
      {/* Content Wrapper */}
      <View style={styles.contentWrapper}>
        <Text style={styles.title}>Select Tournament Operatives</Text>
        <Text style={styles.subTitle}>
          Tournament operatives will manage scoring and streaming
        </Text>

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
                <FlatList
                  data={filteredPlayers}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderPlayerItem}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                />
              </View>
            )
          )}
        </View>

        {/* Selected Operatives List */}
        <View style={styles.selectedListContainer}>
          <FlatList
            data={selectedOperatives}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSelectedOperatives}
            contentContainerStyle={{ gap: 10 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

      {/* Submit Button Container */}
      <View style={styles.submitButtonContainer}>
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            (!enableButton || creatingTournament) && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmit} 
          disabled={!enableButton || creatingTournament}
        >
          {creatingTournament ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Create Tournament</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Custom Alert Dialog */}
      <CustomAlertDialog
        visible={showAlert}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setShowAlert(false)}
      />
    </View>
  );
};

export default TournamentMatchOperatives;

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
    color: AppColors.darkText,
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 20,
    color: AppColors.infoGrey,
  },
  searchSection: {
    position: "relative",
    marginBottom: 20,
    zIndex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    fontSize: 16,
    color: AppColors.darkText,
  },
  dropdownContainer: {
    position: "absolute",
    top: "100%",
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
    padding: 12,
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
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  submitButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#4A90E2",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
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
    marginRight: 12,
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
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.darkText,
    marginBottom: 2,
  },
  playerRole: {
    fontSize: 14,
    color: AppColors.lightText,
    fontWeight: "400",
  },
});