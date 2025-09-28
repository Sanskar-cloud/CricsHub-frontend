import { ActivityIndicator, FlatList, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';

const ContestDetails = ({ route, navigation }) => {
  const { contestId } = route.params;
  const { matchId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contestDetails, setContestDetails] = useState(null);
  const [teamDetails, setTeamDetails] = useState([]);
  const [activeTab, setActiveTab] = useState('Prize');

  const tabs = ['Prize', 'LeaderBoard', 'Teams'];

  const getContestDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }
      setLoading(true);

      const response = await axios.get(
        `https://score360-7.onrender.com/api/contests/${contestId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setContestDetails(response.data);
      console.log(response.data);

      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load contests details.');
      if (err.response?.status === 401) {
        navigation.navigate('Login');
      }
    }
  };

  const getTeamDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const userId = await AsyncStorage.getItem('userUUID');
      if (!token || !userId) {
        navigation.navigate('Login');
        return;
      }

      const response = await axios.get(
        `https://score360-7.onrender.com/api/v1/fantasy/teams/${userId}/${matchId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTeamDetails(response.data);
      console.log(response.data);

      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load contests details.');
      if (err.response?.status === 401) {
        navigation.navigate('Login');
      }
    }
  }

  const getDetails = async () => {
    setLoading(true);
    await getContestDetails();
    // await getLeaderBoardDetails();
    await getTeamDetails();
    setLoading(false);
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', getDetails);
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#f8f9fa', '#e9ecef']}
          style={styles.loadingContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loadingText}>Loading contest details...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const teamDetailsContainer = ({ item, index }) => {
    const teamName = `Team ${index + 1}`;

    const captain = item.players.find(p => p.id === item.captainId);
    const viceCaptain = item.players.find(p => p.id === item.viceCaptainId);

    const captainDisplay = captain?.player?.name || captain?.id || "N/A";
    const viceCaptainDisplay = viceCaptain?.player?.name || viceCaptain?.id || "N/A";

    return (
      <View style={{ padding: 10, marginBottom: 10, backgroundColor: "#eee", borderRadius: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>{teamName}</Text>
        <Text>Captain: {captainDisplay}</Text>
        <Text>Vice Captain: {viceCaptainDisplay}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4a6da7" barStyle="light-content" />
      <ScrollView>
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
          <Text style={styles.headerText}>Contest Details</Text>
          <View style={styles.headerRightPlaceholder} />
        </LinearGradient>

        <Animatable.View
          animation="fadeInUp"
          duration={800}
          style={styles.contestCard}
        >
          <LinearGradient
            colors={['#4a6da7', '#3a5a8a']}
            style={styles.contestCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.contestHeader}>
              <Text style={styles.contestName} numberOfLines={1} ellipsizeMode="tail">
                {contestDetails.name}
              </Text>
              {contestDetails.full && (
                <View style={styles.fullBadge}>
                  <Text style={styles.fullText}>FULL</Text>
                </View>
              )}
            </View>

            <View style={styles.contestDetails}>
              <View style={styles.contestDetailColumn}>
                <Text style={styles.detailLabel}>Entry Fee</Text>
                <Text style={styles.detailValue}>₹{contestDetails.entryFee}</Text>
              </View>

              <View style={styles.contestDetailColumn}>
                <Text style={styles.detailLabel}>Spots</Text>
                <Text style={styles.detailValue}>{contestDetails.totalSpots}</Text>
              </View>

              <View style={styles.contestDetailColumn}>
                <Text style={styles.detailLabel}>Prize Pool</Text>
                <Text style={styles.detailValue}>₹{contestDetails.prizePool}</Text>
              </View>
            </View>

            <View style={styles.createTeamContainer}>Add commentMore actions
              <TouchableOpacity style={styles.createTeamButton} onPress={() => navigation.navigate('CreateContestTeam', { matchId, contestId })}>
                <Text style={styles.createTeamText}>Create Team</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Tabs */}
          <View style={styles.tabs}>
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

          {/* Prize */}
          {activeTab === 'Prize' &&
            <View style={styles.prizeBreakupContainer}>
              {contestDetails.prizeBreakups.map((prize, idx) => (
                <LinearGradient
                  key={idx}
                  style={styles.prizeRow}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  colors={['#fff', '#cbcbcb']}
                >
                  <Text style={styles.prizeRank}>
                    Rank {prize.startRank}{prize.endRank > prize.startRank ? `-${prize.endRank}` : ''}
                  </Text>
                  <Text style={styles.prizeAmount}>₹{prize.prizeAmount}</Text>
                </LinearGradient>
              ))}
            </View>
          }

          {/* LeaderBoard */}

          {/* Teams */}
          {activeTab === 'Teams' &&
            <View>
              <FlatList
                data={teamDetails}
                renderItem={teamDetailsContainer}
                keyExtractor={(item, index) => item.id || index.toString()}
              />
            </View>
          }

        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default ContestDetails

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginTop: StatusBar?.currentHeight || 0,
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
  contestCardGradient: {
    padding: 15,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  contestCard: {
    width: '100%',
    marginBottom: 15,
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
  createTeamContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createTeamButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFF",
  },
  createTeamText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  tabs: {
    backgroundColor: 'whtie',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#6c757d',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#4a6da7',
    fontWeight: 'bold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '50%',
    backgroundColor: '#4a6da7',
    borderRadius: 3,
  },
  prizeBreakupContainer: {
    // backgroundColor: '#cbcbcb',
  },
  prizeRow: {
    padding: 15,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  prizeRank: {
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 14,
  },
  prizeAmount: {
    color: 'black',
    fontWeight: '600',
    fontSize: 16,
  },
})