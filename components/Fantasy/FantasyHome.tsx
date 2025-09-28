import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Animated,
  ImageBackground,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

const FantasyCricketHome = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("");
  const sidebarAnim = useRef(new Animated.Value(-width)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const name = await AsyncStorage.getItem("userName");
        if (name) setUserName(name);
      } catch (error) {
        console.error("Failed to fetch user name:", error);
      }
    };

    fetchUserName();
  }, []);

  const getMatches = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      setLoading(true);
      const [matchesResponse] = await Promise.all([
        axios.get(`https://score360-7.onrender.com/api/v1/matches/status`, {
          params: { status: activeTab },
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      setMatches(matchesResponse.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load matches. Pull down to refresh.');
      if (err.response?.status === 401) {
        navigation.navigate('Login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', getMatches);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    getMatches();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    getMatches();
  };

  const handleCardPress = (matchId) => {
    navigation.navigate('Contests', { matchId });
  };

  const tabs = ['Upcoming', 'Live'];

  const toggleSidebar = () => {
    if (isSidebarVisible) {
      Animated.parallel([
        Animated.timing(sidebarAnim, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setIsSidebarVisible(false));
    } else {
      setIsSidebarVisible(true);
      Animated.parallel([
        Animated.timing(sidebarAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const closeSidebar = () => {
    if (isSidebarVisible) {
      toggleSidebar();
    }
  };

  const LogOutHandler = async () => {
    try {
      await AsyncStorage.removeItem('jwtToken');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  };

  const renderMatchCard = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={800}
      delay={index * 100}
      style={styles.matchCard}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleCardPress(item.id)}
      >
        <LinearGradient
          colors={['#0866AA', '#6BB9F0']}
          style={styles.matchCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.matchHeader}>
            <Text style={styles.leagueText} numberOfLines={1} ellipsizeMode="tail">
              {item.tournamentResponse?.name || 'Premium League'}
            </Text>
            {activeTab === 'Live' && (
              <View style={styles.liveBadge}>
                <View style={styles.livePulse} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>

          <View style={styles.teamsContainer}>
            <View style={styles.team}>
              <Image
                source={{ uri: item.team1?.logoPath }}
                style={styles.teamLogo}
              />
              <Text style={styles.teamName} numberOfLines={1} ellipsizeMode="tail">
                {item.team1?.shortName || item.team1?.name || 'T1'}
              </Text>
            </View>

            <View style={styles.matchInfoContainer}>
              <Text style={styles.matchStatusText}>
                {activeTab === 'Upcoming' ?
                  new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                  'In Progress'}
              </Text>
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
              </View>
              <Text style={styles.matchVenueText} numberOfLines={1} ellipsizeMode="tail">
                {item.venue || 'International Stadium'}
              </Text>
            </View>

            <View style={styles.team}>
              <Image
                source={{ uri: item.team2?.logoPath }}
                style={styles.teamLogo}
              />
              <Text style={styles.teamName} numberOfLines={1} ellipsizeMode="tail">
                {item.team2?.shortName || item.team2?.name || 'T2'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderEmptyState = () => (
    <Animatable.View
      animation="fadeIn"
      duration={1000}
      style={styles.emptyContainer}
    >
      <MaterialIcons name="sports-cricket" size={60} color="#0866AA" />
      <Text style={styles.emptyText}>No {activeTab.toLowerCase()} matches available</Text>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={getMatches}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#0866AA', '#6BB9F0']}
          style={styles.refreshButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name="refresh" size={20} color="#fff" />
          <Text style={styles.refreshText}>Refresh</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  if (loading && matches.length === 0) {
    return (
      <ImageBackground
        source={require('../../assets/images/cricsLogo.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container}>
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
            style={styles.loadingContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ActivityIndicator size="large" color="#0866AA" />
            <Text style={styles.loadingText}>Loading matches...</Text>
          </LinearGradient>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/cricsLogo.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {isSidebarVisible && (
          <TouchableWithoutFeedback onPress={closeSidebar}>
            <Animated.View
              style={[
                styles.overlay,
                {
                  opacity: overlayAnim,
                },
              ]}
            />
          </TouchableWithoutFeedback>
        )}

        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: sidebarAnim }],
            },
          ]}
        >
          <View style={styles.sidebarHeader}>
            <Image
              source={require('../../assets/defaultLogo.png')}
              style={styles.userImage}
            />
            <Text
              style={styles.sidebarTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {userName}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              navigation.navigate("Profile");
              closeSidebar();
            }}
          >
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.sidebarItemText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              navigation.navigate("Performance");
              closeSidebar();
            }}
          >
            <Ionicons name="stats-chart-outline" size={24} color="#333" />
            <Text style={styles.sidebarItemText}>Performance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              navigation.navigate("Support");
              closeSidebar();
            }}
          >
            <Ionicons name="help-circle-outline" size={24} color="#333" />
            <Text style={styles.sidebarItemText}>Support & Help</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              navigation.navigate("RateUs");
              closeSidebar();
            }}
          >
            <Ionicons name="star-outline" size={24} color="#333" />
            <Text style={styles.sidebarItemText}>Rate Us</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              navigation.navigate("Settings");
              closeSidebar();
            }}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
            <Text style={styles.sidebarItemText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => LogOutHandler()}
          >
            <Ionicons name="log-out-outline" size={24} color="#333" />
            <Text style={styles.sidebarItemText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.sidebarFooter}>
            <Text style={styles.footerText}>cricshub @2025</Text>
          </View>
        </Animated.View>

        <View style={styles.mainContent}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={toggleSidebar}>
              <MaterialIcons name="menu" size={30} color="#333" />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Fantasy Cricket</Text>
            <FontAwesome name="filter" size={24} color="#333" />
          </View>

          <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && styles.activeTab,
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}>
                  {tab}
                </Text>
                {activeTab === tab && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0866AA']}
                tintColor="#0866AA"
                progressBackgroundColor="#f8f9fa"
              />
            }
            contentContainerStyle={styles.scrollContainer}
          >
            {error && (
              <Animatable.View
                animation="fadeInDown"
                duration={500}
                style={styles.errorContainer}
              >
                <MaterialIcons name="error-outline" size={30} color="#dc3545" />
                <Text style={styles.errorText}>{error}</Text>
              </Animatable.View>
            )}

            {matches.length > 0 ? (
              <View style={styles.matchesContainer}>
                <FlatList
                  data={matches}
                  renderItem={renderMatchCard}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  contentContainerStyle={styles.verticalMatchList}
                />
              </View>
            ) : (
              renderEmptyState()
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
    marginTop: StatusBar?.currentHeight || 0,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width * 0.7,
    height: "100%",
    backgroundColor: "#FFF",
    zIndex: 100,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebarHeader: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    width: '100%',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    maxWidth: '100%',
  },
  userImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  sidebarItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  sidebarFooter: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#888",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 99,
  },
  mainContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    position: "relative",
  },
  activeTab: {
    backgroundColor: "#FFF",
  },
  tabText: {
    color: "#6c757d",
    fontWeight: "600",
    fontSize: 14,
  },
  activeTabText: {
    color: "#0866AA",
    fontWeight: "bold",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    width: "50%",
    backgroundColor: "#0866AA",
    borderRadius: 3,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    margin: 20,
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#0866AA",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 15,
    color: "#0866AA",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  refreshButton: {
    marginTop: 20,
    borderRadius: 25,
    overflow: "hidden",
  },
  refreshButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  refreshText: {
    marginLeft: 8,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  errorContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8d7da",
    margin: 15,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  errorText: {
    color: "#dc3545",
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  matchesContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  verticalMatchList: {
    paddingBottom: 20,
  },
  matchCard: {
    width: "100%",
    borderRadius: 15,

    marginBottom: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,

  },
  matchCardGradient: {
    padding: 15,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  leagueText: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "bold",
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc3545",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginRight: 5,
  },
  liveText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  teamsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  team: {
    alignItems: "center",
    flex: 1,
  },
  teamLogo: {
    width: 60,
    height: 60,
    marginBottom: 8,
    resizeMode: "contain",
  },
  teamName: {
    fontWeight: "600",
    fontSize: 16,
    color: "#FFF",
    textAlign: "center",
    maxWidth: "100%",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  matchInfoContainer: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  matchStatusText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 5,
  },
  vsContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 5,
  },
  vsText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "white",
  },
  matchVenueText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    marginTop: 5,
    textAlign: "center",
    maxWidth: 100,
  },
});

export default FantasyCricketHome;