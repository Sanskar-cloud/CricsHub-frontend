import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Image,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CreateContestTeam = ({ route, navigation }) => {
  const { matchId, contestId } = route.params;

  const [loading, setLoading] = useState(true);
  const [playersDetails, setPlayersDetails] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [captainId, setCaptainId] = useState(null);
  const [viceCaptainId, setViceCaptainId] = useState(null);

  const getPlayers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return navigation.navigate('Login');

      const res = await axios.get(
        `https://score360-7.onrender.com/api/v1/fantasy/players/${matchId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setPlayersDetails(res.data.filter((p) => p.isPlaying));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load players.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', getPlayers);
    return unsubscribe;
  }, [navigation]);

  const togglePlayer = (playerId) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers((prev) => prev.filter((id) => id !== playerId));
      if (captainId === playerId) setCaptainId(null);
      if (viceCaptainId === playerId) setViceCaptainId(null);
    } else {
      setSelectedPlayers((prev) => {
        if (prev.length === 11) {
          Alert.alert('Limit Reached', 'You can only select 11 players.');
          return prev;
        }
        return [...prev, playerId];
      });
    }
  };

  const selectCaptain = (playerId) => {
    if (!selectedPlayers.includes(playerId)) {
      return Alert.alert('Not Selected', 'Add player to squad before setting as Captain');
    }
    setCaptainId(playerId);
    if (viceCaptainId === playerId) setViceCaptainId(null);
  };

  const selectViceCaptain = (playerId) => {
    if (!selectedPlayers.includes(playerId)) {
      return Alert.alert('Not Selected', 'Add player to squad before setting as Vice‑Captain');
    }
    setViceCaptainId(playerId);
    if (captainId === playerId) setCaptainId(null);
  };

  const handleSubmit = async () => {
    if (selectedPlayers.length !== 11) {
      return Alert.alert('Incomplete Team', 'Please select exactly 11 players.');
    }
    if (!captainId || !viceCaptainId) {
      return Alert.alert('Select a Captain and a Vice‑Captain.');
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return navigation.navigate('Login');
      const payload = {
        matchId,
        playerIds: selectedPlayers,
        captainId,
        viceCaptainId,
      };
      const response = await axios.put(
        'https://score360-7.onrender.com/api/v1/fantasy/teams/create',
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      navigation.navigate('ContestDetails', { matchId, contestId });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit team.');
    }
  };

  const renderSection = (role, title) => {
    const list = playersDetails.filter((p) => p.playerRole === role);
    if (!list.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {list.map((p) => {
          const selected = selectedPlayers.includes(p.id);
          const isCaptain = captainId === p.id;
          const isViceCaptain = viceCaptainId === p.id;

          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.card, selected && styles.selectedCard]}
              onPress={() => togglePlayer(p.id)}
              activeOpacity={0.8}
            >
              <View style={styles.playerInfoContainer}>
                <Image source={require('../../assets/defaultLogo.png')} style={styles.userImage} />

                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{p.playerName}</Text>
                  <View style={styles.playerFantasyContainer}>
                    <Text style={styles.playerInfo}>Credits: {p.credits}</Text>
                    <Text style={styles.playerInfo}>Selection: {p.selectionPercent}%</Text>
                  </View>
                </View>

                {selected && (
                  <View style={styles.leaderButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.leaderButton, isCaptain && styles.leaderSelected]}
                      onPress={() => selectCaptain(p.id)}
                    >
                      <Text style={styles.leaderButtonText}>C</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.leaderButton, isViceCaptain && styles.leaderSelected]}
                      onPress={() => selectViceCaptain(p.id)}
                    >
                      <Text style={styles.leaderButtonText}>VC</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Loading players…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4a6da7" barStyle="light-content" />

      <LinearGradient colors={["#4a6da7", "#3a5a8a"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Create Fantasy Team</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView>
        {renderSection('WK', 'Wicket Keeper')}
        {renderSection('BAT', 'Batsman')}
        {renderSection('AR', 'All Rounder')}
        {renderSection('BWL', 'Bowler')}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomBarText}>{selectedPlayers.length}/11 Selected</Text>
        <TouchableOpacity
          style={[styles.submitBtn, selectedPlayers.length !== 11 && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={selectedPlayers.length !== 11}
        >
          <Text style={styles.submitText}>Create Team</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CreateContestTeam;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginTop: StatusBar.currentHeight || 0
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 10,
    elevation: 5,
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  card: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  selectedCard: {
    borderColor: '#007bff',
    backgroundColor: '#e7f1ff',
  },
  playerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529'
  },
  playerFantasyContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2
  },
  playerInfo: {
    color: '#3b3b3b',
    fontSize: 12
  },
  leaderButtonsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8
  },
  leaderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#6c757d',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
  },
  leaderButtonText: {
    fontWeight: 'bold',
    color: '#495057'
  },
  leaderSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#dee2e6',
  },
  bottomBarText: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  submitBtn: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555'
  },
});