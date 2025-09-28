import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiService from "../APIservices";

const { width } = Dimensions.get("window");
const AppColors = {
  white: "#FFFFFF",
  black: "#000000",
  blue: "#3498DB",
  background: "#F8F9FA",
  cardBorder: "rgba(255, 255, 255, 0.2)",
  error: "#E74C3C",
};

const AppGradients = {
  primaryCard: ["#34B8FF", "#0575E6"],
  secondaryCard: ["#6C5CE7", "#3498DB"],
};

const Performance = ({ navigation, route }) => {
  const playerId = route?.params?.playerId || null;
  const [playerData, setPlayerData] = useState({
    careerStats: {
      matchesPlayed: 0,
      hundreds: 0,
      fifties: 0,
      runsScored: 0,
      highestScore: "N/A",
      battingAverage: "N/A",
      strikeRate: "N/A",
      ballsFaced: 0,
      bowlingAverage: "N/A",
      economyRate: "N/A",
      overs: 0,
      ballsBowled: 0,
      bestBowlingFigures: "N/A",
      catchesTaken: 0,
      totalOuts: 0
    },
    totalSixes: 0,
    totalFours: 0,
    totalWickets: 0,
    role: "Player",
    name: "Player Name",
    email: "player@example.com",
    logoPath: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    fetchPlayerData();
  }, []);

  const fetchPlayerData = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) throw new Error("Authentication required");

      var response = null;
      if (playerId === null) {
        response = await apiService({
          endpoint: 'profile/current',
          method: 'GET',
        });
      } else {
        response = await apiService({
          endpoint: `profile/user-details/${playerId}`,
          method: 'GET',
        });
      }

      if (!response.success) {
        throw new Error(response.error || 'Failed to load player data');
      }

      const data = response.data;

      setPlayerData({
        ...data,
        careerStats: {
          matchesPlayed: data.careerStats?.matchesPlayed || 0,
          hundreds: data.careerStats?.hundreds || 0,
          fifties: data.careerStats?.fifties || 0,
          runsScored: data.careerStats?.runsScored || 0,
          highestScore: data.careerStats?.highestScore || "N/A",
          battingAverage: data.careerStats?.battingAverage || "N/A",
          strikeRate: data.careerStats?.strikeRate || "N/A",
          ballsFaced: data.careerStats?.ballsFaced || 0,
          bowlingAverage: data.careerStats?.bowlingAverage || "N/A",
          economyRate: data.careerStats?.economyRate || "N/A",
          overs: data.careerStats?.overs || 0,
          ballsBowled: data.careerStats?.ballsBowled || 0,
          bestBowlingFigures: data.careerStats?.bestBowlingFigures || "N/A",
          catchesTaken: data.careerStats?.catchesTaken || 0,
          totalOuts: data.careerStats?.totalOuts || 0,
        },
        totalSixes: data.totalSixes || 0,
        totalFours: data.totalFours || 0,
        totalWickets: data.totalWickets || 0,
        role: data.role || "Player",
        name: data.name || "Player Name",
        email: data.email || "player@example.com",
        logoPath: data.logoPath || null,
      });

      animateContent();
    } catch (err) {
      setError(err.message || "Failed to load player data");
    } finally {
      setLoading(false);
    }
  };

  const animateContent = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();
  };

  const StatCard = ({ title, value, color = AppColors.blue, delay = 0 }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      setTimeout(() => {
        Animated.spring(cardAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }, delay);
    }, []);

    return (
      <Animated.View
        style={[
          styles.statCard,
          {
            opacity: cardAnim,
            transform: [{
              scale: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={[AppGradients.primaryCard[0], AppGradients.primaryCard[1]]}
          style={styles.statCardBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel}>{title}</Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderTabContent = () => {
    const { careerStats } = playerData;

    switch (activeTab) {
      case "overview":
        return (
          <ScrollView style={styles.tabContent}>
            <View style={styles.statsGrid}>
              <StatCard
                title="Matches"
                value={careerStats.matchesPlayed}
                delay={100}
              />
              <StatCard
                title="Runs"
                value={careerStats.runsScored}
                delay={200}
              />
              <StatCard
                title="Wickets"
                value={playerData.totalWickets}
                delay={300}
              />
              <StatCard
                title="Centuries"
                value={careerStats.hundreds}
                delay={400}
              />
              <StatCard
                title="Fifties"
                value={careerStats.fifties}
                delay={500}
              />
              <StatCard
                title="Catches"
                value={careerStats.catchesTaken}
                delay={600}
              />
            </View>
          </ScrollView>
        );
      case "detailed":
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Batting Statistics</Text>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Highest Score</Text>
                  <Text style={styles.detailValue}>{careerStats.highestScore}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Batting Average</Text>
                  <Text style={styles.detailValue}>{careerStats.battingAverage}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Strike Rate</Text>
                  <Text style={styles.detailValue}>{careerStats.strikeRate}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Balls Faced</Text>
                  <Text style={styles.detailValue}>{careerStats.ballsFaced}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Bowling Statistics</Text>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Bowling Average</Text>
                  <Text style={styles.detailValue}>{careerStats.bowlingAverage}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Economy Rate</Text>
                  <Text style={styles.detailValue}>{careerStats.economyRate}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Best Bowling</Text>
                  <Text style={styles.detailValue}>{careerStats.bestBowlingFigures}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Overs Bowled</Text>
                  <Text style={styles.detailValue}>{careerStats.overs}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Additional Stats</Text>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Sixes</Text>
                  <Text style={styles.detailValue}>{playerData.totalSixes}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Fours</Text>
                  <Text style={styles.detailValue}>{playerData.totalFours}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Total Outs</Text>
                  <Text style={styles.detailValue}>{careerStats.totalOuts}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.blue} />
          {/* <Text style={styles.loadingText}>Loading Player Data...</Text> */}
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={50} color={AppColors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPlayerData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={[AppGradients.primaryCard[0], AppGradients.primaryCard[1]]}
          style={styles.profileCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              {playerData.logoPath ? (
                <Image
                  source={{ uri: playerData.logoPath }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="person" size={30} color={AppColors.white} />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.playerName}>{playerData.name}</Text>
              <Text style={styles.playerRole}>{playerData.role}</Text>
              <Text style={styles.playerEmail}>{playerData.email}</Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "overview" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("overview")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "overview" && styles.activeTabText,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "detailed" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("detailed")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "detailed" && styles.activeTabText,
              ]}
            >
              Detailed
            </Text>
          </TouchableOpacity>
        </View>
        {renderTabContent()}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.white} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={AppColors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Performance Stats</Text>
          <View style={styles.headerRight} />
        </View>
        {renderContent()}
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.black,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: AppColors.white,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: AppColors.white,
  },
  profileInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.white,
    marginBottom: 2,
  },
  playerRole: {
    fontSize: 14,
    color: AppColors.white,
    opacity: 0.9,
    marginBottom: 2,
  },
  playerEmail: {
    fontSize: 12,
    color: AppColors.white,
    opacity: 0.8,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 5,
    marginBottom: 20,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: AppColors.blue,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.black,
  },
  activeTabText: {
    color: AppColors.white,
  },
  tabContent: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    height: 120,
    marginBottom: 15,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardBackground: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: AppColors.white,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: AppColors.white,
    opacity: 0.9,
    textAlign: "center",
  },
  detailSection: {
    backgroundColor: AppColors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.black,
    marginBottom: 15,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  detailItem: {
    width: "48%",
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: AppColors.black,
    opacity: 0.7,
    marginBottom: 5,
    textAlign: "center",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.black,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    color: AppColors.black,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: AppColors.background,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: AppColors.error,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: AppColors.blue,
    borderRadius: 8,
  },
  retryButtonText: {
    color: AppColors.white,
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default Performance;