import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiService from '../APIservices';
import { useAppNavigation } from '../NavigationService';

const { width } = Dimensions.get('window');
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

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const TournamentCardOthers = ({ tournament, tournamentTimeStatus, index }) => {
  const navigation = useAppNavigation();
  const [scaleValue] = useState(new Animated.Value(1));
  const [opacityValue] = useState(new Animated.Value(0));

  useEffect(() => {
    (Animated.sequence([
      Animated.delay(index * 100),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]) as any).start();
  }, [index, opacityValue]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const checkIsCreator = useCallback(async (currentTournament) => {
    try {
      const creatorId = currentTournament.creatorName?.id;
      const userId = await AsyncStorage.getItem('userUUID');
      return creatorId === userId;
    } catch (error) {
      console.error("Error in checkIsCreator:", error);
      return false;
    }
  }, []);

  const handleNavigation = useCallback(async (tournamentData, tab) => {
    const isCreator = await checkIsCreator(tournamentData);
    navigation.navigate('ManageTournaments', { id: tournamentData.id, isCreator, tab });
  }, [checkIsCreator, navigation]);

  const getStatusInfo = () => {
    switch (tournamentTimeStatus) {
      case 'LIVE':
        return { text: 'LIVE', color: AppColors.liveGreen, icon: 'live-tv' };
      case 'UPCOMING':
        return { text: 'UPCOMING', color: AppColors.upcomingOrange, icon: 'schedule' };
      case 'PAST':
        return { text: 'COMPLETED', color: AppColors.pastGray, icon: 'check-circle' };
      default:
        return { text: tournamentTimeStatus, color: AppColors.primaryBlue, icon: 'info' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: opacityValue,
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => handleNavigation(tournament, 'INFO')}
        style={styles.cardPressable}
      >
        <View style={styles.cardHeader}>
          {tournament?.banner ? (
            <Image source={{ uri: tournament.banner }} style={styles.tournamentImage} />
          ) : (
            <View style={[styles.tournamentImage, { backgroundColor: '#ccc' }]} />
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.tournamentName} numberOfLines={2}>
              {tournament.name}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Icon name={statusInfo.icon} size={14} color={AppColors.white} />
              <Text style={styles.statusText}>{statusInfo.text}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Icon name="calendar-today" size={16} color={AppColors.primaryBlue} />
              <Text style={styles.detailText} numberOfLines={1}>
                {`${tournament.startDate[2]}/${tournament.startDate[1]}/${tournament.startDate[0]} - ${tournament.endDate[2]}/${tournament.endDate[1]}/${tournament.endDate[0]}`}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="sports-cricket" size={16} color={AppColors.primaryBlue} />
              <Text style={styles.detailText} numberOfLines={1}>
                {tournament.type} overs • {tournament.ballType}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="location-on" size={16} color={AppColors.primaryBlue} />
              <Text style={styles.detailText} numberOfLines={1}>
                {tournament.location || 'Location not specified'}
              </Text>
            </View>
            {tournament.prizePool && (
              <View style={styles.detailItem}>
                <Icon name="emoji-events" size={16} color={AppColors.primaryBlue} />
                <Text style={styles.detailText} numberOfLines={1}>
                  Prize: {tournament.prizePool}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>Tap to View Tournament</Text>
          <Icon name="arrow-forward" size={16} color={AppColors.primaryBlue} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const TournamentCardMy = ({ tournament, onTournamentDeleted, index }) => {
  const navigation = useAppNavigation();
  const [scaleValue] = useState(new Animated.Value(1));
  const [opacityValue] = useState(new Animated.Value(0));
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    (Animated.sequence([
      Animated.delay(index * 100),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]) as any).start();
  }, [index, opacityValue]);

  useEffect(() => {
    const checkCreator = async () => {
      try {
        const creatorId = tournament.creatorName?.id;
        const userId = await AsyncStorage.getItem('userUUID');
        setIsCreator(creatorId === userId);
      } catch (error) {
        console.error("Error checking creator:", error);
        setIsCreator(false);
      }
    };
    checkCreator();
  }, [tournament]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const manageTournamentHandler = useCallback(async (id, currentTournament) => {
    const tab = 'INFO';
    navigation.navigate('ManageTournaments', { id, isCreator, tab });
  }, [navigation, isCreator]);

  const deleteTournamentHandler = useCallback(async (id) => {
    Alert.alert(
      'Delete Tournament',
      'Are you sure you want to delete this tournament? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              if (!token) throw new Error('Authentication required.');

              const { success, error } = await apiService({
                endpoint: `tournaments/${id}`,
                method: 'DELETE',
                headers: { Authorization: token ? `Bearer ${token}` : '' },
              });

              if (success) {
                Alert.alert('Success', 'Tournament deleted successfully.');
                onTournamentDeleted();
              } else {
                console.error('Delete error:', error);
                Alert.alert('Error', error?.message || 'Failed to delete the tournament. Please try again.');
              }
            } catch (err) {
              console.error('Unexpected error during delete:', err.message);
              Alert.alert('Error', err.message || 'Something went wrong while deleting.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  }, [onTournamentDeleted]);

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: opacityValue,
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => manageTournamentHandler(tournament.id, tournament)}
        style={styles.cardPressable}
      >
        <View style={styles.cardHeader}>
          {tournament?.banner ? (
            <Image source={{ uri: tournament.banner }} style={styles.tournamentImage} />
          ) : (
            <View style={[styles.tournamentImage, { backgroundColor: '#ccc' }]} />
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.tournamentName} numberOfLines={2}>{tournament.name}</Text>
            {isCreator && (
              <View style={styles.creatorBadge}>
                <Icon name="star" size={14} color={AppColors.white} />
                <Text style={styles.creatorText}>CREATOR</Text>
              </View>
            )}
          </View>
          {isCreator && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                deleteTournamentHandler(tournament.id);
              }}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="delete-outline" size={24} color={AppColors.errorRed} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Icon name="calendar-today" size={16} color={AppColors.primaryBlue} />
              <Text style={styles.detailText} numberOfLines={1}>
                {`${tournament.startDate[2]}/${tournament.startDate[1]}/${tournament.startDate[0]} - ${tournament.endDate[2]}/${tournament.endDate[1]}/${tournament.endDate[0]}`}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="sports-cricket" size={16} color={AppColors.primaryBlue} />
              <Text style={styles.detailText} numberOfLines={1}>
                {tournament.type} overs • {tournament.ballType}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="location-on" size={16} color={AppColors.primaryBlue} />
              <Text style={styles.detailText} numberOfLines={1}>
                {tournament.venues?.join(', ') || 'Location not specified'}
              </Text>
            </View>
            {tournament.prizePool && (
              <View style={styles.detailItem}>
                <Icon name="emoji-events" size={16} color={AppColors.primaryBlue} />
                <Text style={styles.detailText} numberOfLines={1}>
                  Prize: {tournament.prizePool}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>Tap to Manage Tournament</Text>
          <Icon name="settings" size={16} color={AppColors.primaryBlue} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

// Updated Shimmer Skeleton Card without image
const ShimmerTournamentCard = () => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <ShimmerPlaceholder style={styles.shimmerTournamentName} />
          <ShimmerPlaceholder style={styles.shimmerStatusBadge} />
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.detailsContainer}>
          <ShimmerPlaceholder style={styles.shimmerDetailLine} />
          <ShimmerPlaceholder style={styles.shimmerDetailLine} />
          <ShimmerPlaceholder style={styles.shimmerDetailLine} />
          <ShimmerPlaceholder style={styles.shimmerDetailLine} />
        </View>
      </View>
      <View style={styles.cardFooter}>
        <ShimmerPlaceholder style={styles.shimmerFooterText} />
      </View>
    </View>
  );
};

const Tournaments = () => {
  const [activeTab, setActiveTab] = useState('MY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allTournaments, setAllTournaments] = useState([]);
  const navigation = useAppNavigation();

  const filterTournaments = (query) => {
    if (query) {
      const filtered = allTournaments.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase())
      );
      setTournaments(filtered);
    } else {
      setTournaments(allTournaments);
    }
  };

  const fetchTournaments = useCallback(async (status) => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const endpoint =
        status === 'MY'
          ? `tournaments/tournaments-play`
          : `tournaments/status`;

      const params = (status !== 'MY') ? { status } : {};

      const response = await apiService({
        endpoint,
        method: 'GET',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        params: params,
      });

      if (response.success) {
        setAllTournaments(response.data.data || []);
        setTournaments(response.data.data || []);
        setError(null);
      } else {
        console.error('Fetch tournaments API error:', response.error);
        setError(response.error?.message || 'Failed to load tournaments.');
        setAllTournaments([]);
        setTournaments([]);
      }
    } catch (err) {
      console.error('Fetch tournaments unexpected error:', err);
      setError(err.message || 'An unexpected error occurred while loading tournaments.');
      setAllTournaments([]);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setSearchQuery('');
      fetchTournaments(activeTab.toUpperCase());
    }, [activeTab, fetchTournaments])
  );

  const handleMyTournamentDeleted = useCallback(() => {
    fetchTournaments('MY');
  }, [fetchTournaments]);

  useEffect(() => {
    RNStatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      RNStatusBar.setTranslucent(true);
      RNStatusBar.setBackgroundColor('transparent');
    }
  }, []);

  return (
    <View style={styles.container}>
      <RNStatusBar />
      <LinearGradient
        colors={AppGradients.primaryCard}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContentRow}>
          <Text style={styles.headerTitle}>Tournaments</Text>
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
              onPress={() => {
                setActiveTab(tab);
                setSearchQuery('');
                fetchTournaments(tab.toUpperCase());
              }}
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

      <View style={styles.content}>
        {loading ? (
          <FlatList
            data={['1', '2', '3']}
            renderItem={() => <ShimmerTournamentCard />}
            keyExtractor={item => item}
            contentContainerStyle={styles.tournamentsContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={40} color={AppColors.errorRed} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.tournamentsContainer}>
            {tournaments.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="emoji-events" size={60} color={AppColors.infoGrey} />
                <Text style={styles.emptyText}>
                  {activeTab === 'MY'
                    ? <Text>You haven't joined any tournaments yet.</Text>
                    : <Text>No <Text style={{ textTransform: 'lowercase' }}>{activeTab}</Text> tournaments available.</Text>
                  }
                </Text>
                {activeTab === 'MY' && (
                  <TouchableOpacity style={styles.exploreButton} onPress={() => setActiveTab('LIVE')}>
                    <Text style={styles.exploreButtonText}>EXPLORE TOURNAMENTS</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              tournaments.map((tournament, index) => (
                activeTab === 'MY' ?
                  <TournamentCardMy
                    key={tournament.id}
                    tournament={tournament}
                    onTournamentDeleted={handleMyTournamentDeleted}
                    index={index}
                  /> :
                  <TournamentCardOthers
                    key={tournament.id}
                    tournament={tournament}
                    tournamentTimeStatus={activeTab}
                    index={index}
                  />
              ))
            )}
          </ScrollView>
        )}
      </View>
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
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.white,
    textAlign: 'center',
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: AppColors.errorRed,
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  tournamentsContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 250,
  },
  emptyText: {
    color: AppColors.infoGrey,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 25,
  },
  exploreButton: {
    backgroundColor: AppColors.primaryBlue,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  exploreButtonText: {
    color: AppColors.white,
    fontWeight: 'bold',
  },
  // Enhanced Card styles without image
  cardContainer: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
  },
  cardPressable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 18,
    paddingBottom: 12,
    backgroundColor: AppColors.lightBackground,
  },
  tournamentImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.darkText,
    marginBottom: 8,
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: AppColors.primaryBlue,
  },
  creatorText: {
    color: AppColors.white,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cardContent: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 2,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 14,
    color: AppColors.mediumText,
    flex: 1,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: AppColors.lightBackground,
    borderTopWidth: 1,
    borderTopColor: AppColors.cardBorder,
  },
  footerText: {
    color: AppColors.primaryBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  // Shimmer-specific styles
  shimmerTournamentName: {
    height: 22,
    width: '80%',
    borderRadius: 6,
    marginBottom: 8,
  },
  shimmerStatusBadge: {
    height: 20,
    width: '40%',
    borderRadius: 10,
  },
  shimmerDetailLine: {
    height: 14,
    width: '90%',
    borderRadius: 4,
    marginBottom: 10,
  },
  shimmerFooterText: {
    height: 14,
    width: '60%',
    borderRadius: 4,
  },
});

export default Tournaments;