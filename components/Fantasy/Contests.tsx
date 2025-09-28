import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
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
  Easing
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

const Contests = ({ route, navigation }) => {
  const { matchId } = route.params;
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [scaleValue] = useState(new Animated.Value(1));

  const getContests = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      setLoading(true);
      const response = await axios.get(
        `https://score360-7.onrender.com/api/contests/match/${matchId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setContests(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load contests. Pull down to refresh.');
      if (err.response?.status === 401) {
        navigation.navigate('Login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', getContests);
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    getContests();
  };

  const handleContestPress = ({ contestId, matchId }) => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true
      })
    ]).start(() => {
      navigation.navigate('ContestDetails', { contestId, matchId });
    });
  };

  const renderContestCard = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={800}
      delay={index * 100}
      style={styles.contestCard}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleContestPress({ contestId: item.id, matchId: item.matchId })}
      >
        <LinearGradient
          colors={['#4a6da7', '#3a5a8a']}
          style={styles.contestCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.contestHeader}>
            <Text style={styles.contestName} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
            {item.full && (
              <View style={styles.fullBadge}>
                <Text style={styles.fullText}>FULL</Text>
              </View>
            )}
          </View>

          <View style={styles.contestDetails}>
            <View style={styles.contestDetailColumn}>
              <Text style={styles.detailLabel}>Entry Fee</Text>
              <Text style={styles.detailValue}>₹{item.entryFee}</Text>
            </View>

            <View style={styles.contestDetailColumn}>
              <Text style={styles.detailLabel}>Spots</Text>
              <Text style={styles.detailValue}>{item.totalSpots}</Text>
            </View>

            <View style={styles.contestDetailColumn}>
              <Text style={styles.detailLabel}>Prize Pool</Text>
              <Text style={styles.detailValue}>₹{item.prizePool}</Text>
            </View>
          </View>

          <View style={styles.prizeBreakupContainer}>
            {item.prizeBreakups.slice(0, 3).map((prize, idx) => (
              <View key={idx} style={styles.prizeRow}>
                <Text style={styles.prizeRank}>
                  Rank {prize.startRank}{prize.endRank > prize.startRank ? `-${prize.endRank}` : ''}
                </Text>
                <Text style={styles.prizeAmount}>₹{prize.prizeAmount}</Text>
              </View>
            ))}
            {item.prizeBreakups.length > 3 && (
              <Text style={styles.morePrizesText}>+{item.prizeBreakups.length - 3} more prizes</Text>
            )}
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
      <Icon name="emoji-events" size={60} color="#4a6da7" />
      <Text style={styles.emptyText}>No contests available for this match</Text>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={getContests}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#4a6da7', '#3a5a8a']}
          style={styles.refreshButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name="refresh" size={20} color="#fff" />
          <Text style={styles.refreshText}>Refresh</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  if (loading && contests.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#f8f9fa', '#e9ecef']}
          style={styles.loadingContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loadingText}>Loading contests...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4a6da7" barStyle="light-content" />
      <LinearGradient
        colors={['#4a6da7', '#3a5a8a']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Available Contests</Text>
        <View style={styles.headerRightPlaceholder} />
      </LinearGradient>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4a6da7']}
            tintColor="#4a6da7"
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
            <Icon name="error-outline" size={30} color="#dc3545" />
            <Text style={styles.errorText}>{error}</Text>
          </Animatable.View>
        )}

        {/* Contests */}
        {contests.length > 0 ? (
          <View style={styles.contestsContainer}>
            <FlatList
              data={contests}
              renderItem={renderContestCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.verticalContestList}
            />
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginTop: StatusBar?.currentHeight || 0,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#4a6da7',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 15,
    color: '#4a6da7',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  refreshButton: {
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  refreshButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  refreshText: {
    marginLeft: 8,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8d7da',
    margin: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  errorText: {
    color: '#dc3545',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    padding: 5,
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerRightPlaceholder: {
    width: 24,
  },
  contestsContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  verticalContestList: {
    paddingBottom: 20,
  },
  contestCard: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  contestCardGradient: {
    padding: 15,
  },
  contestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  contestName: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  fullBadge: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  fullText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  contestDetailColumn: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 5,
  },
  detailValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  prizeBreakupContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 10,
  },
  prizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  prizeRank: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  prizeAmount: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  morePrizesText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 5,
  },
});

export default Contests;