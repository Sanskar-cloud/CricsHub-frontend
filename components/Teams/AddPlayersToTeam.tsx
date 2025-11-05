import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import apiService from '../APIservices';

const { height } = Dimensions.get('window');

const AppColors = {
  primary: '#4A90E2',
  secondary: '#357ABD',
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#FFC107',
  lightBackground: '#F9F9F9',
  cardBackground: '#FFFFFF',
  textDark: '#333333',
  textLight: '#777777',
  placeholderGray: '#CCC',
};

const DefaultLogo = require("../../assets/defaultLogo.png");

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
  const footerTranslateY = useState(new Animated.Value(0))[0];

  // --- Animation & Keyboard Listeners ---
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

    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardOpen(true);
      Animated.timing(footerTranslateY, {
        toValue: -e.endCoordinates.height + (Platform.OS === 'ios' ? 0 : 20),
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardOpen(false);
      Animated.timing(footerTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // --- Search Debounce Logic ---
  useEffect(() => {
    const debounceSearch = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        fetchPlayers(searchQuery);
      } else {
        setFilteredPlayers([]);
      }
    }, 400);
    return () => clearTimeout(debounceSearch);
  }, [searchQuery]);

  // --- API/Storage Helpers ---
  const getToken = async () => await AsyncStorage.getItem('jwtToken');
  const getUserUUID = async () => await AsyncStorage.getItem('userUUID');

  const fetchPlayers = async (query) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const [nameRes, phoneRes] = await Promise.all([
        apiService({ endpoint: `teams/players/search/name`, method: 'GET', params: { query } }),
        apiService({ endpoint: `teams/players/search/phone`, method: 'GET', params: { query } }),
      ]);
      const nameData = nameRes.success ? nameRes.data.data || [] : [];
      const phoneData = phoneRes.success ? phoneRes.data.data || [] : [];

      // Combine and filter duplicates by ID
      const allPlayersMap = new Map();
      [...nameData, ...phoneData].forEach(player => {
        if (!allPlayersMap.has(player.id)) {
          allPlayersMap.set(player.id, player);
        }
      });

      setFilteredPlayers(Array.from(allPlayersMap.values()));

    } catch (e) {
      setErrorMessage('Failed to fetch players. Network error.');
      setFilteredPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Team Management Functions ---
  const addPlayerToTeam = (player) => {
    if (playerId.includes(player.id)) {
      Alert.alert("Player Already Added", `${player.name} is already in the team.`, [{ text: "OK", style: 'cancel' }]);
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
    setErrorMessage('');
    Alert.alert("Captain Assigned", `${teamPlayers.find(p => p.id === id)?.name || 'Player'} is now the team captain.`, [{ text: "OK", style: 'cancel' }]);
  };

  const createTeam = async () => {
    if (teamPlayers.length === 0) {
      setErrorMessage('Please add at least one player to create the team.');
      return;
    }
    if (!captainId) {
      setErrorMessage('Please assign a captain before creating the team.');
      return;
    }

    setCreatingTeam(true);
    setErrorMessage('');

    // --- Error Message Variable ---
    let backendErrorMessage = 'An unexpected error occurred during team creation.';

    try {
      const token = await getToken();
      const userId = await getUserUUID();

      const formData = new FormData();
      formData.append('name', teamName);
      formData.append('captainId', captainId);
      formData.append('playerIds', playerId.join(','));

      // Handle Logo upload
      if (logoUri) {
        const fileName = logoUri.split('/').pop();
        const fileType = fileName.split('.').pop();
        formData.append('logo', { uri: logoUri, name: fileName, type: `image/${fileType}` });
      }

      const response = await apiService({
        endpoint: `teams`,
        method: 'POST',
        body: formData,
        isMultipart: true
      });

      if (response.success) {
        setTeamPlayers([]);
        setPlayerId([]);
        setCaptainId(null);
        Alert.alert('Success', 'Team created successfully!', [{ text: 'OK', onPress: () => navigation.navigate('Teams') }]);
      } else {
        backendErrorMessage = response.error?.message || 'Failed to create team. No specific message provided.';
        console.log(response);

        Alert.alert('Error', backendErrorMessage);
        setErrorMessage(backendErrorMessage);
      }
    } catch (e) {
      Alert.alert('Error', backendErrorMessage);
      setErrorMessage(backendErrorMessage);

    } finally {
      setCreatingTeam(false);
    }
  };

  // --- UI Render Functions ---
  const renderPlayerItem = ({ item }) => (
    <Animatable.View animation="fadeIn" duration={300} style={styles.dropdownItem}>
      <View style={styles.dropdownLeft}>
        <Image
          // Fallback to local DefaultLogo
          source={item.profilePic ? { uri: item.profilePic } : DefaultLogo}
          style={styles.dropdownPlayerProfilePic}
        />
        <View style={styles.dropdownPlayerInfo}>
          <Text style={styles.dropdownPlayerName}>{item.name}</Text>
          <Text style={styles.dropdownPlayerRole}>{item.role || 'All-rounder'}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => addPlayerToTeam(item)} style={styles.addButton}>
        <Ionicons name="add-circle" size={28} color={AppColors.primary} />
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderTeamPlayer = ({ item }) => (
    <Animatable.View animation="slideInRight" duration={300} style={styles.teamPlayerCard}>
      <View style={styles.playerMainInfo}>
        <View style={[styles.playerProfileWrapper, captainId === item.id && styles.captainHighlight]}>
          <Image
            // Fallback to local DefaultLogo
            source={item.profilePic ? { uri: item.profilePic } : DefaultLogo}
            style={styles.playerProfilePic}
          />
          {captainId === item.id && (
            <View style={styles.captainBadge}>
              <FontAwesome name="star" size={12} color={AppColors.warning} />
            </View>
          )}
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.name}</Text>
          <Text style={styles.playerRole}>{item.role || 'All-rounder'}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.captainButton, captainId === item.id && styles.activeCaptainButton]}
          onPress={() => makeCaptain(item.id)}
          disabled={captainId === item.id}
        >
          <FontAwesome name="star" size={16} color={captainId === item.id ? AppColors.warning : AppColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removePlayerFromTeam(item.id)} style={styles.deleteButton}>
          <MaterialIcons name="delete" size={24} color={AppColors.danger} />
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={60} color={AppColors.placeholderGray} />
      <Text style={styles.emptyStateText}>Start by searching and adding players above.</Text>
      <Text style={styles.emptyStateSubText}>Your selected players will appear here.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.cardBackground} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -height * 0.5}
      >
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={AppColors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerText}>Add Players</Text>
            <View style={styles.teamNameContainer}>
              <Text style={styles.teamName}>{teamName}</Text>
            </View>
          </View>

          {/* Search Area */}
          <View style={{ position: 'relative', zIndex: 10, marginBottom: 15 }}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={AppColors.primary} />
              <TextInput
                style={styles.input}
                placeholder="Search by name or phone..."
                placeholderTextColor={AppColors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results List (Non-Floating) */}
            {filteredPlayers.length > 0 && !loading && (
              <View style={styles.searchResultsList}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                  style={{ maxHeight: 250 }}
                >
                  {filteredPlayers.map((player) => (
                    <View key={player.id}>{renderPlayerItem({ item: player })}</View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Search Loader */}
            {loading && searchQuery.length > 0 && (
              <View style={styles.searchLoading}>
                <ActivityIndicator size="small" color={AppColors.primary} />
              </View>
            )}
          </View>

          {/* Team Players List */}
          <View style={styles.teamPlayersContainer}>
            <Text style={styles.sectionTitle}>Team Players ({teamPlayers.length})</Text>
            <FlatList
              data={teamPlayers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTeamPlayer}
              contentContainerStyle={teamPlayers.length === 0 ? styles.emptyListContainer : styles.listContainer}
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              style={styles.playersList}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Footer (Sticky & Keyboard-Aware) */}
      <Animated.View
        style={[styles.footer, { transform: [{ translateY: footerTranslateY }] }]}
      >
        {errorMessage !== '' && <Text style={styles.errorMessage}>{errorMessage}</Text>}
        <TouchableOpacity onPress={createTeam} disabled={creatingTeam || teamPlayers.length === 0}>
          <LinearGradient
            colors={teamPlayers.length === 0 ? ['#ccc', '#aaa'] : [AppColors.primary, AppColors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createButton}
          >
            {creatingTeam ? <ActivityIndicator color="#fff" /> : <Text style={styles.createButtonText}>Create Team ({teamPlayers.length})</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.cardBackground,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.cardBackground
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.lightBackground,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '800',
    color: AppColors.textDark,
  },
  teamNameContainer: {
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#eaf4ff'
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primary,
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.lightBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textDark,
    marginLeft: 10,
  },
  searchLoading: {
    position: 'absolute',
    right: 50,
    top: 18,
    zIndex: 11,
  },
  // Search Results List Style
  searchResultsList: {
    marginTop: 5,
    backgroundColor: AppColors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    zIndex: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.lightBackground,
    backgroundColor: AppColors.cardBackground,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownPlayerProfilePic: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 15,
    backgroundColor: AppColors.lightBackground,
  },
  dropdownPlayerName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textDark,
  },
  dropdownPlayerRole: {
    fontSize: 13,
    color: AppColors.textLight,
  },
  addButton: {
    padding: 5,
  },
  // Team List
  teamPlayersContainer: {
    flex: 1,
    paddingTop: 5,
  },
  playersList: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.textDark,
    marginBottom: 10,
    marginTop: 5,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
    paddingLeft: 10,
  },
  teamPlayerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppColors.cardBackground,
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3
  },
  playerMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  playerProfileWrapper: {
    position: 'relative',
    borderRadius: 30,
  },
  captainHighlight: {
    borderWidth: 3,
    borderColor: AppColors.warning,
    borderRadius: 30,
    padding: 1,
  },
  captainBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: AppColors.cardBackground,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: AppColors.warning,
    elevation: 4,
  },
  playerProfilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.lightBackground,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 15
  },
  playerName: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.textDark
  },
  playerRole: {
    fontSize: 14,
    color: AppColors.textLight
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  captainButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.cardBackground,
  },
  activeCaptainButton: {
    backgroundColor: AppColors.warning + '30',
    borderColor: AppColors.warning,
  },
  deleteButton: {
    padding: 5,
  },
  // Empty State
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: AppColors.textLight,
    marginTop: 10,
    fontWeight: '600',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
  // Footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: AppColors.cardBackground,
    zIndex: 20,
  },
  createButton: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  errorMessage: {
    color: AppColors.danger,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
});

export default AddPlayersToTeam;