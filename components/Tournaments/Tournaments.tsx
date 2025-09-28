import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  TextInput,
  Pressable,
  Platform,
  StatusBar as RNStatusBar,
  Dimensions,
  Animated,
  SafeAreaView,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppNavigation } from '../NavigationService';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { AppGradients, AppColors } from '../../assets/constants/colors.js';
import apiService from '../APIservices';

const { width } = Dimensions.get('window');

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

  const sanitizedBannerUrl = tournament.banner?.replace(
    'https://score360-7.onrender.com/api/v1/files/http:/',
    'https://'
  );

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
          <Text style={styles.tournamentName} numberOfLines={1}>
            {tournament.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Icon name={statusInfo.icon} size={14} color={AppColors.white} />
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.tournamentImageContainer}>
            <Image
              source={{ uri: sanitizedBannerUrl }}
              style={styles.tournamentImage}
              resizeMode='cover'
            />
          </View>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Icon name="calendar-today" size={14} color={AppColors.primaryBlue} />
              <Text style={styles.detailText} numberOfLines={1}>
                {`${tournament.startDate[2]}/${tournament.startDate[1]}/${tournament.startDate[0]} - ${tournament.endDate[2]}/${tournament.endDate[1]}/${tournament.endDate[0]}`}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="sports-cricket" size={14} color={AppColors.primaryBlue} />
              <Text style={styles.detailText} numberOfLines={1}>
                {tournament.type} overs • {tournament.ballType}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="location-on" size={14} color={AppColors.primaryBlue} />
              <Text style={styles.detailText} numberOfLines={1}>
                {tournament.location || 'Location not specified'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>Tap to View Tournament</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const TournamentCardMy = ({ tournament, onTournamentDeleted, index }) => {
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

  const manageTournamentHandler = useCallback(async (id, currentTournament) => {
    const isCreator = await checkIsCreator(currentTournament);
    const tab = 'INFO';
    navigation.navigate('ManageTournaments', { id, isCreator, tab });
  }, [checkIsCreator, navigation]);

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

  const sanitizedBannerUrl = tournament.banner?.replace(
    'https://score360-7.onrender.com/api/v1/files/http:/',
    'https://'
  );

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
          <Text style={styles.tournamentName} numberOfLines={1}>{tournament.name}</Text>
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
        </View>

        <View style={styles.cardContent}>
          <View style={styles.tournamentImageContainer}>
            <Image
              source={{ uri: sanitizedBannerUrl }}
              style={styles.tournamentImage}
              resizeMode='cover'
            />
          </View>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Icon name="calendar-today" size={14} color={AppColors.primaryBlue} />
              <Text style={styles.detailText} numberOfLines={1}>
                {`${tournament.startDate[2]}/${tournament.startDate[1]}/${tournament.startDate[0]} - ${tournament.endDate[2]}/${tournament.endDate[1]}/${tournament.endDate[0]}`}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="sports-cricket" size={14} color={AppColors.primaryBlue} />
              <Text style={styles.detailText} numberOfLines={1}>
                {tournament.type} overs • {tournament.ballType}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="location-on" size={14} color={AppColors.primaryBlue} />
              <Text style={styles.detailText} numberOfLines={1}>
                {tournament.venues?.join(', ') || 'Location not specified'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>Tap to Manage Tournament</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// New Shimmer Skeleton Card
const ShimmerTournamentCard = () => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <ShimmerPlaceholder style={styles.shimmerTournamentName} />
        <ShimmerPlaceholder style={styles.shimmerStatusBadge} />
      </View>
      <View style={styles.cardContent}>
        <ShimmerPlaceholder style={styles.shimmerImage} />
        <View style={styles.detailsContainer}>
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
  const [activeTab, setActiveTab] = useState('LIVE');
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

  const onSearchTextChange = (text) => {
    setSearchQuery(text);
    filterTournaments(text);
  };

  useEffect(() => {
    RNStatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      RNStatusBar.setTranslucent(true);
      RNStatusBar.setBackgroundColor('transparent');
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={AppGradients.primaryCard}
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

          <View style={styles.searchBarContainer}>
            <Icon name="search" size={20} color={AppColors.white} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tournaments..."
              placeholderTextColor="rgba(255,255,255,0.8)"
              onChangeText={onSearchTextChange}
              value={searchQuery}
              returnKeyType="search"
            />
          </View>
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
                    : searchQuery
                      ? <Text>No results found for "<Text style={{ fontWeight: 'bold' }}>{searchQuery}</Text>" in <Text style={{ textTransform: 'lowercase' }}>{activeTab}</Text> tournaments.</Text>
                      : <Text>No <Text style={{ textTransform: 'lowercase' }}>{activeTab}</Text> tournaments available.</Text>
                  }
                </Text>
                {activeTab === 'MY' && (
                  <TouchableOpacity style={styles.exploreButton} onPress={() => setActiveTab('LIVE')}>
                    <Text style={styles.exploreButtonText}>EXPLORE TOURNAMENTS</Text>
                  </TouchableOpacity>
                )}
                {searchQuery && (
                  <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchQuery('')}>
                    <Text style={styles.clearSearchButtonText}>CLEAR SEARCH</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.lightBackground,
  },
  header: {
    paddingBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : RNStatusBar.currentHeight + 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
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
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
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
  // No longer needed since we are using shimmer effect
  // loaderContainer: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   backgroundColor: AppColors.lightBackground,
  // },
  // lottieLoader: {
  //   width: 150,
  //   height: 150,
  // },
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
  clearSearchButton: {
    backgroundColor: AppColors.gray,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  clearSearchButtonText: {
    color: AppColors.white,
    fontWeight: 'bold',
  },

  // === Common Card Styles (Refined) ===
  cardContainer: {
    backgroundColor: AppColors.white,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardPressable: {
    borderRadius: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.darkText,
    flexShrink: 1,
    paddingRight: 10,
  },
  statusBadge: {
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  tournamentImageContainer: {
    width: 80,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 15,
    backgroundColor: AppColors.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tournamentImage: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    flex: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 12,
    color: AppColors.mediumText,
    flex: 1,
  },
  cardFooter: {
    padding: 12,
    backgroundColor: AppColors.lightBackground,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    alignItems: 'center',
  },
  footerText: {
    color: AppColors.mediumText,
    fontSize: 14,
  },
  deleteButton: {
    padding: 4,
  },
  // Shimmer-specific styles
  shimmerTournamentName: {
    height: 20,
    width: '60%',
    borderRadius: 4,
  },
  shimmerStatusBadge: {
    height: 20,
    width: '30%',
    borderRadius: 10,
  },
  shimmerImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  shimmerDetailLine: {
    height: 12,
    width: '80%',
    borderRadius: 4,
    marginBottom: 8,
  },
  shimmerFooterText: {
    height: 14,
    width: '70%',
    borderRadius: 4,
  },
});

export default Tournaments;