import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  SafeAreaView,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../APIservices';

const AddPlayersToTeam = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playerId, setPlayerId] = useState([]);
  const [captainId, setCaptainId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const { teamName, logoUri } = route.params;

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // 🔎 Search debounce
  useEffect(() => {
    const debounceSearch = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        fetchPlayers(searchQuery);
      } else {
        setFilteredPlayers([]);
      }
    }, 500);
    return () => clearTimeout(debounceSearch);
  }, [searchQuery]);

  const getToken = async () => await AsyncStorage.getItem('jwtToken');
  const getUserUUID = async () => await AsyncStorage.getItem('userUUID');

  const fetchPlayers = async (query) => {
    try {
      setLoading(true);
      const [nameRes, phoneRes] = await Promise.all([
        apiService({ endpoint: `teams/players/search/name`, method: 'GET', params: { query } }),
        apiService({ endpoint: `teams/players/search/phone`, method: 'GET', params: { query } }),
      ]);
      const nameData = nameRes.success ? nameRes.data.data || [] : [];
      const phoneData = phoneRes.success ? phoneRes.data.data || [] : [];
      setFilteredPlayers([...nameData, ...phoneData]);
    } catch {
      setFilteredPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const addPlayerToTeam = (player) => {
    if (playerId.includes(player.id)) {
      Alert.alert("Player Already Added", `${player.name} is already in the team.`);
      return;
    }
    setPlayerId((prev) => [...prev, player.id]);
    setTeamPlayers((prev) => [...prev, player]);
    setSearchQuery('');
    setFilteredPlayers([]);
    Keyboard.dismiss();
  };

  const removePlayerFromTeam = (id) => {
    setPlayerId((prev) => prev.filter((p) => p !== id));
    setTeamPlayers((prev) => prev.filter((p) => p.id !== id));
    if (captainId === id) setCaptainId(null);
  };

  const makeCaptain = (id) => {
    setCaptainId(id);
    Alert.alert("Captain Assigned", "This player is now the team captain.");
  };

  const createTeam = async () => {
    if (teamPlayers.length === 0) {
      Alert.alert('Error', 'Please add at least one player.');
      return;
    }
    if (!captainId) {
      setErrorMessage('Please assign a captain.');
      return;
    }

    setCreatingTeam(true);
    try {
      const token = await getToken();
      const userId = await getUserUUID();

      const formData = new FormData();
      formData.append('name', teamName);
      formData.append('captainId', captainId);
      formData.append('playerIds', playerId.join(','));
      if (logoUri) {
        const fileName = logoUri.split('/').pop();
        const fileType = fileName.split('.').pop();
        formData.append('logo', { uri: logoUri, name: fileName, type: `image/${fileType}` });
      }

      const response = await apiService({ endpoint: `teams/${userId}`, method: 'POST', body: formData, isMultipart: true });

      if (response.success) {
        setTeamPlayers([]);
        setPlayerId([]);
        setCaptainId(null);
        Alert.alert('Success', 'Team created successfully!');
        navigation.navigate('Teams');
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to create team.');
      }
    } finally {
      setCreatingTeam(false);
    }
  };

  // 🔹 UI
  const renderPlayerItem = ({ item }) => (
    <Animatable.View animation="fadeIn" duration={300} style={styles.dropdownItem}>
      <View style={styles.dropdownLeft}>
        <Image
          source={item.profilePic ? { uri: item.profilePic } : require("../../assets/defaultLogo.png")}
          style={styles.dropdownPlayerProfilePic}
        />
        <View style={styles.dropdownPlayerInfo}>
          <Text style={styles.dropdownPlayerName}>{item.name}</Text>
          <Text style={styles.dropdownPlayerRole}>{item.role || 'All-rounder'}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => addPlayerToTeam(item)}>
        <Ionicons name="add-circle" size={28} color="#4A90E2" />
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderTeamPlayer = ({ item }) => (
    <Animatable.View animation="slideInRight" duration={300} style={styles.teamPlayerCard}>
      <View style={styles.playerMainInfo}>
        <View style={[styles.playerProfileWrapper, captainId === item.id && styles.captainHighlight]}>
          <Image
            source={item.profilePic ? { uri: item.profilePic } : require("../../assets/defaultLogo.png")}
            style={styles.playerProfilePic}
          />
          {captainId === item.id && (
            <View style={styles.captainBadge}>
              <FontAwesome name="star" size={14} color="#FFD700" />
            </View>
          )}
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.name}</Text>
          <Text style={styles.playerRole}>{item.role || 'All-rounder'}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.captainButton, captainId === item.id && styles.activeCaptainButton]} onPress={() => makeCaptain(item.id)}>
          <FontAwesome name="star" size={16} color={captainId === item.id ? "#FFD700" : "#4A90E2"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removePlayerFromTeam(item.id)}>
          <MaterialIcons name="delete" size={22} color="#F44336" />
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#4A90E2" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Add Players</Text>
            <View style={styles.teamNameContainer}>
              <Text style={styles.teamName}>{teamName}</Text>
            </View>
          </View>

          {/* Search */}
          <View style={{ position: 'relative', marginBottom: 10 }}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#4A90E2" />
              <TextInput
                style={styles.input}
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Floating Search Results */}
            {filteredPlayers.length > 0 && (
              <View style={styles.dropdownContainer}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                >
                  {filteredPlayers.map((player) => (
                    <View key={player.id}>{renderPlayerItem({ item: player })}</View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Loader */}
          {loading && <ActivityIndicator size="large" color="#4A90E2" style={{ marginVertical: 10 }} />}

          {/* Team Players */}
          <View style={styles.teamPlayersContainer}>
            <Text style={styles.sectionTitle}>Team Players ({teamPlayers.length})</Text>
            <FlatList
              data={teamPlayers}
              keyExtractor={(item) => item.id}
              renderItem={renderTeamPlayer}
              contentContainerStyle={teamPlayers.length === 0 ? styles.emptyListContainer : styles.listContainer}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              style={styles.playersList}
            />
          </View>

          {/* Footer */}
          {!keyboardOpen && (
            <View style={styles.footer}>
              {errorMessage !== '' && <Text style={styles.errorMessage}>{errorMessage}</Text>}
              <TouchableOpacity onPress={createTeam} disabled={creatingTeam || teamPlayers.length === 0}>
                <LinearGradient
                  colors={teamPlayers.length === 0 ? ['#ccc', '#aaa'] : ['#4A90E2', '#357ABD']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createButton}
                >
                  {creatingTeam ? <ActivityIndicator color="#fff" /> : <Text style={styles.createButtonText}>Create Team</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  contentContainer: {
    flex: 1,
    padding: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333'
  },
  teamNameContainer: {
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8
  },
  dropdownContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  dropdownPlayerProfilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12
  },
  dropdownPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  dropdownPlayerRole: {
    fontSize: 14,
    color: '#777'
  },
  teamPlayersContainer: {
    flex: 1,
    marginBottom: 80,
  },
  playersList: {
    flex: 1,
  },
  listContainer: {
    paddingVertical: 10,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  teamPlayerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  playerMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  playerProfileWrapper: {
    position: 'relative'
  },
  captainHighlight: {
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 25,
    padding: 2
  },
  captainBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
    elevation: 2
  },
  playerProfilePic: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  playerRole: {
    fontSize: 14,
    color: '#555'
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  captainButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  activeCaptainButton: {
    backgroundColor: '#eaf4ff'
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  createButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  errorMessage: {
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 10
  },
});

export default AddPlayersToTeam;