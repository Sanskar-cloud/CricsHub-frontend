import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiService from '../../APIservices';
import { useAppNavigation } from '../../NavigationService';

const { width } = Dimensions.get('window');
const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

// Define the color palette and gradients for consistency
const AppColors = {
  primaryBlue: '#34B8FF',
  secondaryBlue: '#1E88E5',
  white: '#FFFFFF',
  black: '#000000',
  darkText: '#333333',
  mediumText: '#555555',
  lightText: '#888888',
  lightBackground: '#F8F9FA',
  cardBackground: '#FFFFFF',
  errorRed: '#FF4757',
  successGreen: '#2ED573',
  liveGreen: '#2ED573',
  upcomingOrange: '#FF9F43',
  pastGray: '#747D8C',
  infoGrey: '#A4B0BE',
  cardBorder: '#E0E0E0',
};

const AppGradients = {
  primaryCard: ['#34B8FF', '#1E88E5'],
  primaryButton: ['#34B8FF', '#1E88E5'],
  shimmer: ['#F0F0F0', '#E0E0E0', '#F0F0F0'],
};

const MatchCard = ({
  item,
  onPress,
  status = 'UPCOMING',
  showScores = true,
  showWinner = false,
  userId
}) => {
  const [scaleValue] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const matchDate = item?.matchDate ? `${item?.matchDate[2]}-${item?.matchDate[1]}-${item?.matchDate[0]}` : 'N/A';
  const isCreator = userId && item?.matchOps?.includes(userId);

  const getStatusInfo = () => {
    switch (status) {
      case 'LIVE':
        return { text: 'LIVE', color: AppColors.liveGreen, icon: 'live-tv' };
      case 'UPCOMING':
        return { text: 'UPCOMING', color: AppColors.upcomingOrange, icon: 'schedule' };
      case 'PAST':
        return { text: 'Completed', color: AppColors.pastGray, icon: 'check-circle' };
      default:
        return { text: status, color: AppColors.primaryBlue, icon: 'info' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.matchCard}
      >
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
          <Icon name={statusInfo.icon} size={16} color={AppColors.white} />
          <Text style={styles.statusText}>{statusInfo.text}</Text>
        </View>

        <LinearGradient
          colors={[AppGradients.primaryCard[0], AppGradients.primaryCard[1]]}
          style={styles.matchCardHeader}
        >
          <Text style={styles.tournamentName} numberOfLines={1}>
            {item?.tournamentResponse?.name || 'Individual Match'}
          </Text>
        </LinearGradient>

        <View style={styles.matchCardContent}>
          <View style={styles.teamRow}>
            <View style={styles.teamContainer}>
              <Image
                source={{ uri: item?.team1?.logoPath }}
                style={styles.teamLogo}
              />
              <Text style={styles.teamName} numberOfLines={1}>{item?.team1?.name}</Text>
              {showScores && (item?.team1Score > 0 || item?.team2Score > 0) && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.teamScore}>{item?.team1Score || '0'}</Text>
                </View>
              )}
            </View>

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.teamContainer}>
              <Image
                source={{ uri: item?.team2?.logoPath }}
                style={styles.teamLogo}
              />
              <Text style={styles.teamName} numberOfLines={1}>{item?.team2?.name}</Text>
              {showScores && (item?.team1Score > 0 || item?.team2Score > 0) && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.teamScore}>{item?.team2Score || '0'}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.matchDetailsRow}>
            <Icon name="calendar-month" size={14} color={AppColors.infoGrey} />
            <Text style={styles.matchDetailText}>{matchDate}</Text>
            <Text style={styles.dotSeparator}>•</Text>

            {item?.matchTime && (
              <>
                <Icon name="access-time" size={14} color={AppColors.infoGrey} />
                <Text style={styles.matchDetailText}>{item.matchTime[0]}:{item.matchTime[1]}</Text>
                <Text style={styles.dotSeparator}>•</Text>
              </>
            )}

            <Icon name="location-on" size={14} color={AppColors.infoGrey} />
            <Text style={styles.matchDetailText} numberOfLines={1}>
              {item?.venue || 'Venue not specified'}
            </Text>
          </View>
        </View>

        <View style={styles.matchCardFooter}>
          {showWinner && item?.winner ? (
            <Text style={styles.winnerText}>🏆 {item.winner} won the match!</Text>
          ) : (
            <Text style={styles.footerText}>
              {isCreator ? (status === 'LIVE' ? 'Tap to Score Match' : 'Tap to Setup Match') : 'Tap to View Match'}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

// New Shimmer Match Card Component
const ShimmerMatchCard = () => {
  return (
    <View style={styles.matchCard}>
      <View style={[styles.statusBadge, { backgroundColor: AppColors.infoGrey }]}>
        <ShimmerPlaceholder style={styles.shimmerStatusIcon} />
        <ShimmerPlaceholder style={styles.shimmerStatusText} />
      </View>
      <View style={styles.matchCardHeader}>
        <ShimmerPlaceholder style={styles.shimmerHeader} />
      </View>
      <View style={styles.matchCardContent}>
        <View style={styles.teamRow}>
          <View style={styles.teamContainer}>
            <ShimmerPlaceholder style={styles.shimmerLogo} />
            <ShimmerPlaceholder style={styles.shimmerTeamName} />
          </View>
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={styles.teamContainer}>
            <ShimmerPlaceholder style={styles.shimmerLogo} />
            <ShimmerPlaceholder style={styles.shimmerTeamName} />
          </View>
        </View>
        <View style={[styles.matchDetailsRow, { justifyContent: 'space-around' }]}>
          <ShimmerPlaceholder style={styles.shimmerDetails} />
          <ShimmerPlaceholder style={styles.shimmerDetails} />
          <ShimmerPlaceholder style={styles.shimmerDetails} />
        </View>
      </View>
      <View style={styles.matchCardFooter}>
        <ShimmerPlaceholder style={styles.shimmerFooter} />
      </View>
    </View>
  );
};

const AllMatches = () => {
  const [activeTab, setActiveTab] = useState('MY');
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useAppNavigation();

  const debounce = (func, delay) => {
    let timer;
    return function (...args) {
      const context = this;
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(context, args), delay);
    };
  };

  const onSearchTextChange = (text) => {
    setSearchQuery(text);
  };

  const debouncedSearch = useCallback(
    debounce((text) => onSearchTextChange(text), 500),
    []
  );

  return (
    <View style={styles.container}>
      {/* Header with Search and Tabs */}
      <LinearGradient
        colors={[AppGradients.primaryCard[0], AppGradients.primaryCard[1]]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContentRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={28} color={AppColors.white} />
          </TouchableOpacity>

          {/* <View style={styles.searchBarContainer}>
            <Icon name="search" size={20} color={AppColors.white} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search matches..."
              placeholderTextColor="rgba(255,255,255,0.8)"
              onChangeText={debouncedSearch}
              value={searchQuery}
              returnKeyType="search"
            />
          </View> */}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}
        >
          {['MY', 'LIVE', 'UPCOMING', 'PAST'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Content based on active tab */}
      <View style={styles.content}>
        {activeTab === 'MY' && <MyMatch searchQuery={searchQuery} />}
        {activeTab === 'LIVE' && <LiveMatch searchQuery={searchQuery} />}
        {activeTab === 'UPCOMING' && <UpcomingMatch searchQuery={searchQuery} />}
        {activeTab === 'PAST' && <PastMatch searchQuery={searchQuery} />}
      </View>
    </View>
  );
};

const MyMatch = ({ searchQuery }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigation = useAppNavigation();

  const getMyMatches = useCallback(async () => {
    try {
      const playerId = await AsyncStorage.getItem('userUUID');
      if (!playerId) throw new Error('User ID not found. Please login again.');

      setLoading(true);
      setUserId(playerId);

      const response = await apiService({
        endpoint: `matches/player/${playerId}`,
        method: 'GET',
      });

      if (response.success) {
        const filteredMatches = response.data.data.filter(match =>
          match.tournamentResponse?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
          match.team1?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
          match.team2?.name?.toLowerCase()?.includes(searchQuery.toLowerCase())
        );
        setMatches(filteredMatches);
        setError(null);
      } else {
        setError('Failed to load your matches. Pull down to refresh.');
      }
    } catch (err) {
      setError('Failed to load your matches. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      getMyMatches();
    }, [getMyMatches])
  );

  const onRefresh = () => {
    setRefreshing(true);
    getMyMatches();
  };

  const matchCardClickHandler = (item) => {
    const matchId = item?.id;
    navigation.navigate('MatchScoreCard', { matchId });
  };

  const renderMatchItem = ({ item }) => {
    const status = item.status === 'Live' ? 'LIVE' :
      item.status === 'Upcoming' ? 'UPCOMING' : 'PAST';

    return (
      <MatchCard
        item={item}
        onPress={() => matchCardClickHandler(item)}
        status={status}
        showScores={status !== 'UPCOMING'}
        showWinner={status === 'PAST'}
        userId={userId}
      />
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <ShimmerMatchCard />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {!loading && matches?.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="info-outline" size={60} color={AppColors.infoGrey} />
          <Text style={styles.emptyText}>
            {searchQuery ?
              `No matches found for "${searchQuery}"` :
              "You haven't participated in any matches yet."
            }
          </Text>
          <TouchableOpacity
            onPress={getMyMatches}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshButtonText}>REFRESH</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && matches?.length > 0 && (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatchItem}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
};

const LiveMatch = ({ searchQuery }) => {
  const navigation = useAppNavigation();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [userId, setUserId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const getLiveMatches = useCallback(async () => {
    try {
      const playerId = await AsyncStorage.getItem('userUUID');
      if (playerId) setUserId(playerId);

      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      setLoading(true);

      const response = await apiService({
        endpoint: 'matches/status',
        method: 'GET',
        params: { status: 'Live' },
      });

      if (response.success) {
        const filteredMatches = response.data.data.filter(match =>
          match.tournamentResponse?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
          match.team1?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
          match.team2?.name?.toLowerCase()?.includes(searchQuery.toLowerCase())
        );
        setMatches(filteredMatches);
        setError(null);
      } else {
        setError('Failed to load live matches. Pull down to refresh.');
      }
    } catch (err) {
      setError('Failed to load live matches. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, navigation]);

  useFocusEffect(
    useCallback(() => {
      getLiveMatches();
    }, [getLiveMatches])
  );

  const onRefresh = () => {
    setRefreshing(true);
    getLiveMatches();
  };

  const liveMatchClickHandler = async (match) => {
    try {
      const isUserInMatchOps = match.matchOps?.includes(userId);

      if (isUserInMatchOps) {
        navigation.navigate('Scoring', { matchId: match.id });
      } else {
        navigation.navigate('CommentaryScorecard', { matchId: match.id });
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const renderMatchItem = ({ item }) => (
    <MatchCard
      item={item}
      onPress={() => liveMatchClickHandler(item)}
      status="LIVE"
      showScores={true}
      userId={userId}
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <ShimmerMatchCard />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {!loading && matches?.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="sports-cricket" size={60} color={AppColors.infoGrey} />
          <Text style={styles.emptyText}>
            {searchQuery ?
              `No live matches found for "${searchQuery}"` :
              "No live matches right now"
            }
          </Text>
          <TouchableOpacity
            onPress={getLiveMatches}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshButtonText}>REFRESH</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && matches?.length > 0 && (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatchItem}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
};

const UpcomingMatch = ({ searchQuery }) => {
  const navigation = useAppNavigation();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [userId, setUserId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const getUpcomingMatches = useCallback(async () => {
    try {
      const playerId = await AsyncStorage.getItem('userUUID');
      if (playerId) setUserId(playerId);

      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) throw new Error('Please Login Again');

      setLoading(true);

      const response = await apiService({
        endpoint: 'matches/status',
        method: 'GET',
        params: { status: 'Upcoming' },
      });

      if (response.success) {
        const filteredMatches = response.data.data.filter(match =>
          match.tournamentResponse?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
          match.team1?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
          match.team2?.name?.toLowerCase()?.includes(searchQuery.toLowerCase())
        );
        setMatches(filteredMatches);
        setError(null);
      } else {
        setError('Failed to load upcoming matches. Pull down to refresh.');
      }
    } catch (err) {
      setError('Failed to load upcoming matches. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      getUpcomingMatches();
    }, [getUpcomingMatches])
  );

  const onRefresh = () => {
    setRefreshing(true);
    getUpcomingMatches();
  };

  const upcomingMatchClickHandler = async (match) => {
    try {
      const creatorId = match.creatorName.id;

      if (userId === creatorId) {
        navigation.navigate('Scoring', { matchId: match.id });
      } else {
        navigation.navigate('MatchScoreCard', { matchId: match.id });
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const renderMatchItem = ({ item }) => (
    <MatchCard
      item={item}
      onPress={() => upcomingMatchClickHandler(item)}
      status="UPCOMING"
      showScores={false}
      userId={userId}
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <ShimmerMatchCard />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {!loading && matches?.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="event-available" size={60} color={AppColors.infoGrey} />
          <Text style={styles.emptyText}>
            {searchQuery ?
              `No upcoming matches found for "${searchQuery}"` :
              "No upcoming matches scheduled"
            }
          </Text>
          <TouchableOpacity
            onPress={getUpcomingMatches}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshButtonText}>REFRESH</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && matches?.length > 0 && (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatchItem}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
};

const PastMatch = ({ searchQuery }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigation = useAppNavigation();

  useEffect(() => {
    AsyncStorage.getItem('userId').then(id => setUserId(id));
  }, []);

  const getPastMatches = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) throw new Error('Please Login Again');

      setLoading(true);
      const response = await apiService({
        endpoint: 'matches/status',
        method: 'GET',
        params: { status: 'Completed' },
      });

      if (response.success) {
        const filteredMatches = response.data.data.filter(match =>
          match.tournamentResponse?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
          match.team1?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
          match.team2?.name?.toLowerCase()?.includes(searchQuery.toLowerCase())
        );
        setMatches(filteredMatches);
        setError(null);
      } else {
        setError('Failed to load past matches. Pull down to refresh.');
      }
    } catch (err) {
      setError('Failed to load past matches. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      getPastMatches();
    }, [getPastMatches])
  );

  const onRefresh = () => {
    setRefreshing(true);
    getPastMatches();
  };

  const pastMatchClickHandler = (match) => {
    navigation.navigate('MatchScoreCard', { matchId: match.id });
  };

  const renderMatchItem = ({ item }) => (
    <MatchCard
      item={item}
      onPress={() => pastMatchClickHandler(item)}
      status="PAST"
      showScores={true}
      showWinner={true}
      userId={userId}
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <ShimmerMatchCard />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {!loading && matches?.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="history" size={60} color={AppColors.infoGrey} />
          <Text style={styles.emptyText}>
            {searchQuery ?
              `No past matches found for "${searchQuery}"` :
              "No past matches found"
            }
          </Text>
          <TouchableOpacity
            onPress={getPastMatches}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshButtonText}>REFRESH</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && matches?.length > 0 && (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatchItem}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.lightBackground,
  },
  header: {
    paddingBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  backButton: {
    marginRight: 15,
    padding: 8,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingVertical: Platform.OS === 'ios' ? 10 : 0,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: AppColors.white,
    fontSize: 16,
  },
  tabContainer: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.white,
  },
  tabText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: AppColors.primaryBlue,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
  },
  errorText: {
    color: AppColors.errorRed,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    padding: 20,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  matchCard: {
    backgroundColor: AppColors.white,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: AppColors.white,
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  matchCardHeader: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: 'center',
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.white,
    textAlign: 'center',
  },
  matchCardContent: {
    padding: 15,
    alignItems: 'center',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  teamLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: AppColors.primaryBlue,
    backgroundColor: AppColors.lightBackground,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.darkText,
    textAlign: 'center',
    marginBottom: 3,
  },
  teamScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.primaryBlue,
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.mediumText,
    marginBottom: 3,
  },
  matchDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: AppColors.cardBorder,
    paddingTop: 12,
    width: '100%',
  },
  matchDetailText: {
    marginLeft: 4,
    fontSize: 12,
    color: AppColors.mediumText,
  },
  dotSeparator: {
    fontSize: 12,
    color: AppColors.infoGrey,
    marginHorizontal: 6,
  },
  matchCardFooter: {
    padding: 12,
    backgroundColor: AppColors.lightBackground,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    alignItems: 'center',
  },
  winnerText: {
    color: AppColors.successGreen,
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    color: AppColors.mediumText,
    fontSize: 14,
  },
  scoreBadge: {
    backgroundColor: AppColors.lightBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: AppColors.infoGrey,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 25,
  },
  refreshButton: {
    backgroundColor: AppColors.primaryBlue,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: AppColors.white,
    fontWeight: 'bold',
  },
  // Shimmer-specific styles
  shimmerHeader: {
    width: '70%',
    height: 20,
    borderRadius: 4,
  },
  shimmerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: AppColors.cardBorder,
  },
  shimmerTeamName: {
    width: '80%',
    height: 16,
    marginTop: 4,
    borderRadius: 4,
  },
  shimmerVsText: {
    width: 30,
    height: 14,
  },
  shimmerDetails: {
    width: '30%',
    height: 12,
    borderRadius: 4,
  },
  shimmerFooter: {
    width: '85%',
    height: 14,
    borderRadius: 4,
  },
  shimmerStatusIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  shimmerStatusText: {
    width: 50,
    height: 11,
    marginLeft: 4,
    borderRadius: 4,
  },
});

export default AllMatches;