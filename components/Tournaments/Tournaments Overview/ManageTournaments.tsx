import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Animated,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { useNavigation, RouteProp } from "@react-navigation/native";
import apiService from "../../APIservices";
import moment from "moment";
import { SafeAreaView } from 'react-native-safe-area-context';

import Info from "./TournamentInfo";
import Teams from "./TournamentTeams";
import Matches from "./TournamentMatches";
import PointsTable from "./TournamentPointtable";
import { AppGradients } from "../../../assets/constants/colors";

const { width, height } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 120; // Reduced header height
const HEADER_MIN_HEIGHT = 60 + (StatusBar.currentHeight || 0);
const TAB_BAR_HEIGHT = 60;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Calculate status bar height for different platforms
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

type ManageTournamentsRouteParams = {
  tab: string;
  id: string;
  isCreator: boolean;
};

type ManageTournamentsRouteProp = RouteProp<
  { ManageTournaments: ManageTournamentsRouteParams },
  "ManageTournaments"
>;

export default function ManageTournaments({
  route,
}: {
  route: ManageTournamentsRouteProp;
}) {
  const { id, isCreator } = route.params;
  const [activeTab, setActiveTab] = useState(route.params.tab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournamentDetails, setTournamentsDetails] = useState<any>(null);

  const navigation = useNavigation();

  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const headerContentOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const collapsedTitleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.7, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  const tabTopPosition = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const fetchTournamentDetails = async (tournamentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService({
        endpoint: `tournaments/${tournamentId}`,
        method: "GET",
      });

      if (response.success) {
        setTournamentsDetails(response.data.data);
      } else {
        console.error("Error fetching tournament:", response.error);
        setError("Failed to fetch tournament details. Please try again.");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentDetails(id);
  }, [id]);

  const formatTournamentDates = () => {
    if (tournamentDetails?.startDate && tournamentDetails?.endDate) {
      const start = moment([
        tournamentDetails.startDate[0],
        tournamentDetails.startDate[1] - 1,   // month (0-based)
        tournamentDetails.startDate[2]
      ]).format("DD MMM YYYY");

      const end = moment([
        tournamentDetails.endDate[0],
        tournamentDetails.endDate[1] - 1,
        tournamentDetails.endDate[2]
      ]).format("DD MMM YYYY");

      return `${start} - ${end}`;
    }
    return "";
  };

  const tabs = ["INFO", "TEAMS", "MATCHES", "POINTS TABLE"];

  const renderTab = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.toggleButton,
        activeTab === item && styles.activeToggleButton,
      ]}
      onPress={() => setActiveTab(item)}
    >
      <Text
        style={[
          styles.toggleText,
          activeTab === item && styles.activeToggleText,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const handleScrollEnd = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const halfwayPoint = HEADER_SCROLL_DISTANCE / 2;

    if (scrollPosition > halfwayPoint && scrollPosition < HEADER_SCROLL_DISTANCE) {
      Animated.timing(scrollY, {
        toValue: HEADER_SCROLL_DISTANCE,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else if (scrollPosition > 0 && scrollPosition <= halfwayPoint) {
      Animated.timing(scrollY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <LinearGradient
        colors={["#34B8FF", "#192f6a"]}
        style={styles.gradientOverlay}
      >
        <SafeAreaView style={styles.safeArea} edges={['right', 'left', 'top']}>
          {/* Simplified Header Area */}
          <Animated.View style={[styles.headerArea, { height: headerHeight }]}>
            <Animated.View
              style={[
                styles.headerContentWrapper,
                { opacity: headerContentOpacity },
              ]}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Icon name="arrow-back" size={24} color="white" />
              </TouchableOpacity>

              {!loading && tournamentDetails && (
                <View style={styles.tournamentDetailsTextContainer}>
                  <Text style={styles.tournamentNameHeader}>
                    {tournamentDetails.name}
                  </Text>
                  {tournamentDetails.startDate && tournamentDetails.endDate && (
                    <Text style={styles.tournamentSubDetail}>
                      <Icon
                        name="calendar-today"
                        size={14}
                        color="rgba(255,255,255,0.8)"
                      />{" "}
                      {formatTournamentDates()}
                    </Text>
                  )}
                  {tournamentDetails.location && (
                    <Text style={styles.tournamentSubDetail}>
                      <Icon
                        name="location-on"
                        size={14}
                        color="rgba(255,255,255,0.8)"
                      />{" "}
                      {tournamentDetails.location}
                    </Text>
                  )}
                </View>
              )}
            </Animated.View>
          </Animated.View>

          {/* Collapsed Header */}
          <Animated.View
            style={[styles.collapsedHeader, { opacity: collapsedTitleOpacity }]}
          >
            {/* <TouchableOpacity
              style={styles.backButtonCollapsed}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity> */}
            <Text style={styles.collapsedHeaderText} numberOfLines={1}>
              {tournamentDetails?.name || "Tournament"}
            </Text>
          </Animated.View>

          {/* Sticky Tab Bar */}
          <Animated.View
            style={[
              styles.toggleContainer,
              { transform: [{ translateY: tabTopPosition }] },
            ]}
          >
            <FlatList
              ref={flatListRef}
              data={tabs}
              renderItem={renderTab}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toggleScrollViewContent}
            />
          </Animated.View>

          {/* Main Content Area */}
          <Animated.ScrollView
            style={styles.mainContentScrollView}
            contentContainerStyle={{
              paddingTop: HEADER_MAX_HEIGHT + TAB_BAR_HEIGHT,
              paddingHorizontal: 15,
              paddingBottom: 20,
            }}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={handleScrollEnd}
          >
            {loading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#34B8FF" />
                <Text style={styles.loadingText}>Loading tournament data...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => fetchTournamentDetails(id)}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {activeTab === "INFO" && <Info id={id} isCreator={isCreator} />}
                {activeTab === "TEAMS" && <Teams id={id} isCreator={isCreator} />}
                {activeTab === "MATCHES" && (
                  <Matches id={id} isCreator={isCreator} />
                )}
                {activeTab === "POINTS TABLE" && <PointsTable id={id} />}
              </>
            )}
          </Animated.ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa"
  },

  safeArea: {
    flex: 1,
  },

  gradientOverlay: {
    flex: 1
  },

  headerArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    zIndex: 10,
    paddingTop: STATUS_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },

  headerContentWrapper: {
    width: "100%",
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },

  backButton: {
    position: "absolute",
    left: 15,
    zIndex: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 8,
    // Center vertically within the header
    top: '50%',
    marginTop: -20, // Half of button height (icon size 24 + padding 16 = ~40/2 = 20)
  },

  tournamentDetailsTextContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 50, // Add padding to prevent text overlapping with back button
  },

  tournamentNameHeader: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 6
  },

  tournamentSubDetail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 4,
    fontWeight: "500",
  },

  collapsedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_MIN_HEIGHT,
    backgroundColor: "#34B8FF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: STATUS_BAR_HEIGHT,
    zIndex: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },

  collapsedHeaderText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 50, // Add padding to prevent text overlapping with back button
  },

  backButtonCollapsed: {
    position: "absolute",
    left: 15,
    zIndex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 8,
    // Center vertically within the collapsed header
    top: '50%',
    marginTop: -20, // Half of button height
  },

  toggleContainer: {
    position: "absolute",
    left: 15,
    right: 15,
    height: TAB_BAR_HEIGHT,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 30,
    justifyContent: "center",
    zIndex: 9,
    overflow: 'hidden', // Prevent overflow
  },

  toggleScrollViewContent: {
    alignItems: "center",
    paddingHorizontal: 10,
    justifyContent: 'center',
    flexGrow: 1,
  },

  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    backgroundColor: "transparent",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    minWidth: 100, // Fixed width for better alignment
    height: 40, // Fixed height for consistent sizing
  },

  activeToggleButton: {
    backgroundColor: "#fff",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2.62,
    elevation: 3
  },

  toggleText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13, // Slightly smaller to fit better
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  activeToggleText: {
    color: "#34B8FF",
    fontSize: 14,
    fontWeight: "bold"
  },

  mainContentScrollView: {
    flex: 1,
  },

  loadingOverlay: {
    flex: 1,
    minHeight: height - (HEADER_MIN_HEIGHT + TAB_BAR_HEIGHT + STATUS_BAR_HEIGHT + 30),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 15,
    marginVertical: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
    fontWeight: "500"
  },

  errorContainer: {
    flex: 1,
    minHeight: height - (HEADER_MIN_HEIGHT + TAB_BAR_HEIGHT + STATUS_BAR_HEIGHT + 30),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF3F3",
    borderRadius: 15,
    padding: 25,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },

  errorText: {
    fontSize: 17,
    color: "#D32F2F",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500"
  },

  retryButton: {
    backgroundColor: "#34B8FF",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5
  },

  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase"
  },
});