import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { AppGradients, AppColors } from "../../assets/constants/colors.js";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar"; // Expo StatusBar
import apiService from "../APIservices";

const loaderAnimation = require("../../assets/animations/loader.json");
const emptyTeamsAnimation = require("../../assets/empty.json");

const TeamPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userUUID");

      const response = await apiService({
        endpoint: "teams",
        method: "GET",
      });

      if (response.success && response.data?.data) {
        const filteredTeams = (response.data.data || []).filter(
          (team) =>
            team.creator?.id === userId ||
            team.captain?.id === userId ||
            (team.players || []).some((player) => player?.id === userId)
        );
        setTeams(filteredTeams);
      } else {
        setTeams([]);
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
      setTeams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTeamPress = (teamId) => {
    navigation.navigate("TeamDetailsScreen", { teamId });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeams();
  };

  const renderTeamCard = ({ item }) => {
    const playersCount = (item.players || []).length;
    const captainCount = item.captain ? 1 : 0;
    const creatorCount =
      item.creator && item.creator.id !== item.captain?.id ? 1 : 0;
    const totalMembers = playersCount;

    return (
      <TouchableOpacity
        onPress={() => handleTeamPress(item.id)}
        activeOpacity={0.8}
        style={styles.cardContainer}
      >
        <LinearGradient
          colors={AppGradients.primaryCard}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Image
            source={{
              uri: item.logoPath || "https://via.placeholder.com/60x60",
            }}
            style={styles.teamLogo}
          />
          <View style={styles.teamInfo}>
            <Text style={styles.teamName} numberOfLines={1}>
              {item.name || "N/A"}
            </Text>
            <View style={styles.teamMeta}>
              <View style={styles.memberContainer}>
                <MaterialIcons name="people" size={14} color={AppColors.white} />
                <Text style={styles.memberCount}>{totalMembers}</Text>
              </View>
              <View style={styles.captainContainer}>
                <Text style={styles.captainIcon}>Ⓒ</Text>
                <Text style={styles.captain}>
                  {item.captain?.name || "Unknown"}
                </Text>
              </View>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={AppColors.white} />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ✅ Fixes Android SafeArea with padding */}
      {Platform.OS === "android" && <RNStatusBar backgroundColor="#87CEEB" barStyle="light-content" />}
      <StatusBar style={Platform.OS === "ios" ? "dark" : "light"} />

      {/* Header - Always visible */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={26} color={AppColors.darkText} />
        </TouchableOpacity>
        <Text style={styles.heading}>My Teams</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate("CreateTeam")}
          activeOpacity={0.7}
        >
          <MaterialIcons name="add" size={26} color={AppColors.darkText} />
        </TouchableOpacity>
      </View>

      {/* Content area */}
      <View style={styles.container}>
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <LottieView source={loaderAnimation} autoPlay loop style={styles.loaderAnimation} />
          </View>
        ) : (
          <>
            {/* List / Empty State */}
            {teams.length > 0 ? (
              <FlatList
                data={teams}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderTeamCard}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#00BFFF"
                  />
                }
              />
            ) : (
              <View style={styles.emptyContainer}>
                <LottieView source={emptyTeamsAnimation} autoPlay loop={false} style={styles.emptyAnimation} />
                <Text style={styles.emptyTitle}>No Teams Found</Text>
                <Text style={styles.emptySubtitle}>Create your first team to get started</Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => navigation.navigate("CreateTeam")}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={["#00BFFF", "#1E90FF"]} style={styles.createButtonSolid}>
                    <MaterialIcons name="add" size={20} color={AppColors.white} />
                    <Text style={styles.createButtonText}>Create Team</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffff", // Sky blue background
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.lightBackground,
    paddingBottom:30
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.darkText,
  },
  headerButton: {
    padding: 6,
  },
  listContent: {
    paddingVertical: 15,
    paddingBottom: 40,
  },
  cardContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    elevation: 2,
  },
  teamLogo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: AppColors.white,
    marginRight: 14,
  },
  teamInfo: {
    flex: 1,
    marginRight: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.white,
  },
  teamMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  memberContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  memberCount: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.white,
    marginLeft: 4,
  },
  captainContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  captainIcon: {
    fontSize: 13,
    color: AppColors.white,
    marginRight: 3,
  },
  captain: {
    fontSize: 12,
    color: AppColors.white,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderAnimation: {
    width: 120,
    height: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.darkText,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: AppColors.lightText,
    marginBottom: 20,
    textAlign: "center",
  },
  createButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  createButtonSolid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  createButtonText: {
    color: AppColors.white,
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 8,
  },
});

export default TeamPage;