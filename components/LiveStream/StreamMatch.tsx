import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../APIservices';
import { AppColors, AppGradients } from '../../assets/constants/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import StreamInfoModal from './StreamInfoModel'
const StreamMatch = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);
  const [showModal, setShowModal] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    getLiveMatches();
  }, []);

  const getLiveMatches = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const id = await AsyncStorage.getItem('userUUID');
      setUserId(id);

      if (!token || !id) {
        navigation.navigate('Login');
        return;
      }
      setLoading(true);

      const response = await apiService({
        endpoint: 'matches/status',
        method: 'GET',
        params: { status: 'Live' },
      });

      console.log(response.data.data);

      if (response.success && response.data?.data) {
        const uid = await AsyncStorage.getItem('userUUID');
        setMatches(response.data.data.filter(m => m.matchOps?.includes(id)));
      } else {
        setError('Failed to fetch live matches');
        setMatches([]);
      }
    } catch (error) {
      setError('Something went wrong');
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    getLiveMatches();
  };

  const streamMatchClickHandler = (matchId) => {
    navigation.navigate('ConnectLiveStream', { matchId });
  }

  const renderMatchItem = ({ item }) => {
    const matchDate = item?.matchDate ? `${item?.matchDate[2]}-${item?.matchDate[1]}-${item?.matchDate[0]}` : 'N/A';

    // Status info for live matches
    const statusInfo = { text: 'LIVE', color: AppColors.liveGreen, icon: 'live-tv' };

    return (
      <View style={styles.matchCard}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
          <Icon name={statusInfo.icon} size={16} color={AppColors.white} />
          <Text style={styles.statusText}>{statusInfo.text}</Text>
        </View>

        {/* Tournament Header */}
        <LinearGradient
          colors={['#e3f2fd', '#ffffff']}
          style={styles.matchCardHeader}
        >
          <Text style={styles.tournamentName} numberOfLines={1}>
            {item?.tournamentResponse?.name || 'Individual Match'}
          </Text>
        </LinearGradient>

        {/* Match Content */}
        <View style={styles.matchCardContent}>
          {/* Teams */}
          <View style={styles.teamRow}>
            <View style={styles.teamContainer}>
              <Image
                source={item?.team1?.logoPath ? { uri: item.team1.logoPath } : require('../../assets/defaultLogo.png')}
                style={styles.teamLogo}
              />
              <Text style={styles.teamName} numberOfLines={1}>{item?.team1?.name}</Text>
              <View style={styles.scoreBadge}>
                <Text style={styles.teamScore}>{item?.team1Score || '0'}</Text>
              </View>
            </View>

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.teamContainer}>
              <Image
                source={item?.team2?.logoPath ? { uri: item.team2.logoPath } : require('../../assets/defaultLogo.png')}
                style={styles.teamLogo}
              />
              <Text style={styles.teamName} numberOfLines={1}>{item?.team2?.name}</Text>
              <View style={styles.scoreBadge}>
                <Text style={styles.teamScore}>{item?.team2Score || '0'}</Text>
              </View>
            </View>
          </View>

          {/* Match Details */}
          <View style={styles.matchDetailsRow}>
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

        {/* Go Live Footer Button */}
        <Pressable
          onPress={() => streamMatchClickHandler(item.id)}
          style={styles.goLiveButtonWrapper}
        >
          <LinearGradient
            colors={AppGradients.primaryButton}
            style={styles.goLiveButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.goLiveButtonText}>Go Live</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={AppColors.primaryBlue} />
          <Text style={styles.loaderText}>Loading Matches</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={getLiveMatches}>
            <Text style={styles.refreshButtonText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (matches?.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="sports-cricket" size={60} color={AppColors.infoGrey} />
          <Text style={styles.emptyText}>No live matches right now</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchItem}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={AppColors.lightBackground} barStyle="dark-content" />

      {/* Consistent Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={AppColors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Matches</Text>
          <View style={styles.headerRight} />
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.safeContentContainer}>
        {renderContent()}
      </SafeAreaView>
      <StreamInfoModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onContinue={() => setShowModal(false)}
      />
    </View>
  );
};

export default StreamMatch;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.lightBackground,
  },
  headerSafeArea: {
    backgroundColor: AppColors.white,
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
  safeContentContainer: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    fontSize: 18,
    marginTop: 12,
    color: AppColors.mediumText,
  },
  errorText: {
    color: AppColors.errorRed,
    textAlign: 'center',
    margin: 20,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: AppColors.infoGrey,
    marginTop: 12,
    textAlign: 'center',
  },
  listContainer: {
    padding: 15,
  },
  // Match Card Styles (Consistent with AllMatches)
  matchCard: {
    backgroundColor: AppColors.white,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
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
    color: AppColors.secondaryBlue,
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
  scoreBadge: {
    backgroundColor: AppColors.lightBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
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
  goLiveButtonWrapper: {
    margin: 15,
    borderRadius: 10,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    overflow: 'hidden',
  },
  goLiveButtonGradient: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goLiveButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  refreshButtonText: {
    color: AppColors.primaryBlue,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
});