import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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
import CustomAlertDialog from '../Customs/CustomDialog.js';

const { height } = Dimensions.get('window');

const AppColors = {
  primary: '#4A90E2',
  secondary: '#357ABD',
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#FFC107',
  info: '#17A2B8',
  lightBackground: '#F9F9F9',
  cardBackground: '#FFFFFF',
  textDark: '#333333',
  textLight: '#777777',
  placeholderGray: '#CCC',
  borderLight: '#E8E8E8',
};

// Define gradient colors for the alert buttons
const AlertGradients = {
  primary: ['#4A90E2', '#357ABD'],
  success: ['#4CAF50', '#45a049'],
  error: ['#F44336', '#d32f2f'],
  warning: ['#FFC107', '#ff8f00'],
  info: ['#17A2B8', '#0288d1']
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
  const [showInfoNote, setShowInfoNote] = useState(true);

  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [manualPlayerData, setManualPlayerData] = useState({
    name: '',
    phone: '',
    role: 'Batsman'
  });
  const [addingManualPlayer, setAddingManualPlayer] = useState(false);

  // Custom Alert Dialog States
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });

  const navigation = useNavigation();
  const route = useRoute();
  const { teamName, logoUri } = route.params;

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const footerTranslateY = useState(new Animated.Value(0))[0];

  const roleOptions = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];

  // Custom Alert Helper Function
  const showCustomAlert = (message, type = 'info', buttons = []) => {
    setAlertConfig({
      title: '',
      message,
      type,
      buttons: buttons.length > 0 ? buttons : [{ 
        text: 'OK', 
        onPress: () => setShowAlert(false),
        gradientColors: AlertGradients.primary
      }]
    });
    setShowAlert(true);
  };

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

  const getToken = async () => await AsyncStorage.getItem('jwtToken');
  const getUserUUID = async () => await AsyncStorage.getItem('userUUID');

  const fetchPlayers = async (query) => {
    try {
      setLoading(true);
      setErrorMessage('');
      console.log('🔍 Searching players with query:', query);
      
      const [nameRes, phoneRes] = await Promise.all([
        apiService({ endpoint: `teams/players/search/name`, method: 'GET', params: { query } }),
        apiService({ endpoint: `teams/players/search/phone`, method: 'GET', params: { query } }),
      ]);
      
      const nameData = nameRes.success ? nameRes.data.data || [] : [];
      const phoneData = phoneRes.success ? phoneRes.data.data || [] : [];

      const allPlayersMap = new Map();
      [...nameData, ...phoneData].forEach(player => {
        if (!allPlayersMap.has(player.id)) {
          allPlayersMap.set(player.id, player);
        }
      });

      const uniquePlayers = Array.from(allPlayersMap.values());
      console.log('🎯 Unique players found:', uniquePlayers.length);
      setFilteredPlayers(uniquePlayers);

    } catch (e) {
      console.error('❌ Error fetching players:', e);
      setErrorMessage('Failed to fetch players. Network error.');
      setFilteredPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const addManualPlayer = async () => {
    if (!manualPlayerData.name.trim()) {
      showCustomAlert('Please enter player name', 'warning');
      return;
    }

    if (!manualPlayerData.phone.trim()) {
      showCustomAlert('Please enter player phone number', 'warning');
      return;
    }

    setAddingManualPlayer(true);
    try {
      const tempPlayer = {
        id: `manual_${Date.now()}`,
        name: manualPlayerData.name.trim(),
        phone: manualPlayerData.phone.trim(),
        role: manualPlayerData.role,
        profilePic: null,
        isManual: true 
      };

      addPlayerToTeam(tempPlayer);
      
      setManualPlayerData({ name: '', phone: '', role: 'Batsman' });
      setShowManualAddModal(false);
      
      // showCustomAlert('Player added successfully!', 'success');

    } catch (error) {
      showCustomAlert('Failed to add player. Please try again.', 'error');
    } finally {
      setAddingManualPlayer(false);
    }
  };

  const addPlayerToTeam = (player) => {
    if (playerId.includes(player.id)) {
      showCustomAlert(`${player.name} is already in the team.`, 'warning');
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
    const player = teamPlayers.find(p => p.id === id);
    setCaptainId(id);
    setErrorMessage('');
    // showCustomAlert(`${player?.name || 'Player'} is now the team captain.`, 'success');
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
  
    let backendErrorMessage = 'An unexpected error occurred during team creation.';
  
    try {
      const token = await getToken();
      const userId = await getUserUUID();
  
      const existingPlayerIds = teamPlayers.filter(p => !p.isManual).map(p => p.id);
      const manualPlayers = teamPlayers.filter(p => p.isManual);
      const isCaptainManual = teamPlayers.find(p => p.id === captainId)?.isManual;

      const formData = new FormData();
      formData.append('name', teamName);
      
      if (!isCaptainManual) {
        formData.append('captainId', captainId);
      }
  
      existingPlayerIds.forEach(playerId => {
        formData.append('playerIds', playerId);
      });
  
      manualPlayers.forEach((player, index) => {
        formData.append(`addPlayerRequestDto[${index}].name`, player.name);
        formData.append(`addPlayerRequestDto[${index}].phone`, player.phone);
        formData.append(`addPlayerRequestDto[${index}].role`, player.role);
        
        const isThisPlayerCaptain = player.id === captainId;
        formData.append(`addPlayerRequestDto[${index}].isCaptain`, isThisPlayerCaptain.toString());
      });
  
      if (logoUri) {
        const fileName = logoUri.split('/').pop();
        const fileType = fileName.split('.').pop();
        formData.append('logo', {
          uri: logoUri,
          name: fileName,
          type: `image/${fileType}`
        });
      }
      manualPlayers.forEach((player, index) => {
        console.log(`  - addPlayerRequestDto[${index}]:`, {
          name: player.name,
          phone: player.phone,
          role: player.role,
          isCaptain: player.id === captainId
        });
      });
  
      const response = await apiService({
        endpoint: `teams`,
        method: 'POST',
        body: formData,
        isMultipart: true
      });
  
      if (response.success) {
        console.log('✅ Team created successfully!');
        setTeamPlayers([]);
        setPlayerId([]);
        setCaptainId(null);
        
        showCustomAlert('Team created successfully!', 'success', [
          { 
            text: 'OK', 
            onPress: () => {
              setShowAlert(false);
              navigation.navigate('Teams');
            },
            gradientColors: AlertGradients.success
          }
        ]);
      } else {
        backendErrorMessage = response.error?.message || 'Failed to create team. No specific message provided.';
        showCustomAlert(backendErrorMessage, 'error');
        setErrorMessage(backendErrorMessage);
      }
    } catch (e) {
      showCustomAlert(backendErrorMessage, 'error');
      setErrorMessage(backendErrorMessage);
    } finally {
      setCreatingTeam(false);
    }
  };

  const renderPlayerItem = ({ item }) => (
    <Animatable.View animation="fadeIn" duration={300} style={styles.dropdownItem}>
      <View style={styles.dropdownLeft}>
        <Image
          source={item.profilePic ? { uri: item.profilePic } : DefaultLogo}
          style={styles.dropdownPlayerProfilePic}
        />
        <View style={styles.dropdownPlayerInfo}>
          <Text style={styles.dropdownPlayerName}>{item.name}</Text>
          <Text style={styles.dropdownPlayerRole}>{item.role || 'All-rounder'}</Text>
          {item.phone && <Text style={styles.dropdownPlayerPhone}>{item.phone}</Text>}
        </View>
      </View>
      <TouchableOpacity onPress={() => addPlayerToTeam(item)} style={styles.addButton}>
        <Ionicons name="add-circle" size={28} color={AppColors.primary} />
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderTeamPlayer = ({ item }) => (
    <Animatable.View animation="slideInRight" duration={300} style={[
      styles.teamPlayerCard,
      item.isManual && styles.manualPlayerCard
    ]}>
      <View style={styles.playerMainInfo}>
        <View style={[
          styles.playerProfileWrapper, 
          captainId === item.id && styles.captainHighlight,
          item.isManual && styles.manualPlayerProfile
        ]}>
          <Image
            source={item.profilePic ? { uri: item.profilePic } : DefaultLogo}
            style={styles.playerProfilePic}
          />
          {captainId === item.id && (
            <View style={styles.captainBadge}>
              <FontAwesome name="star" size={10} color={AppColors.warning} />
            </View>
          )}
          {item.isManual && (
            <View style={styles.manualPlayerIndicator}>
              <Text style={styles.manualPlayerIndicatorText}>M</Text>
            </View>
          )}
        </View>
        <View style={styles.playerInfo}>
          <View style={styles.playerNameRow}>
            <Text style={styles.playerName}>{item.name}</Text>
            {item.isManual && (
              <View style={styles.manualPlayerTag}>
                <Text style={styles.manualPlayerTagText}>Manual</Text>
              </View>
            )}
          </View>
          <Text style={styles.playerRole}>{item.role || 'All-rounder'}</Text>
          {item.phone && <Text style={styles.playerPhone}>{item.phone}</Text>}
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[
            styles.captainButton, 
            captainId === item.id && styles.activeCaptainButton
          ]}
          onPress={() => makeCaptain(item.id)}
          disabled={captainId === item.id}
        >
          <FontAwesome 
            name={captainId === item.id ? "star" : "star"} 
            size={16} 
            color={captainId === item.id ? AppColors.warning : AppColors.primary} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removePlayerFromTeam(item.id)} style={styles.deleteButton}>
          <MaterialIcons name="delete-outline" size={22} color={AppColors.danger} />
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={70} color={AppColors.placeholderGray} />
      <Text style={styles.emptyStateText}>No Players Added Yet</Text>
      <Text style={styles.emptyStateSubText}>
        Search for players or add them manually to build your team
      </Text>
    </View>
  );

  const renderManualAddModal = () => (
    <Modal
      visible={showManualAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowManualAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Ionicons name="person-add" size={24} color={AppColors.primary} />
              <Text style={styles.modalTitle}>Add Player Manually</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowManualAddModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={AppColors.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalNote}>
            <Ionicons name="information-circle" size={18} color={AppColors.info} />
            <Text style={styles.modalNoteText}>
              Note: You can assign captain to both existing and manually added players.
            </Text>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Player Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter player name"
                value={manualPlayerData.name}
                onChangeText={(text) => setManualPlayerData(prev => ({ ...prev, name: text }))}
                placeholderTextColor={AppColors.placeholderGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter phone number"
                value={manualPlayerData.phone}
                onChangeText={(text) => setManualPlayerData(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
                placeholderTextColor={AppColors.placeholderGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.roleSelector}>
                {roleOptions.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      manualPlayerData.role === role && styles.roleOptionSelected
                    ]}
                    onPress={() => setManualPlayerData(prev => ({ ...prev, role }))}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      manualPlayerData.role === role && styles.roleOptionTextSelected
                    ]}>
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowManualAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.addButtonModal,
                (!manualPlayerData.name.trim() || !manualPlayerData.phone.trim()) && styles.addButtonDisabled
              ]}
              onPress={addManualPlayer}
              disabled={!manualPlayerData.name.trim() || !manualPlayerData.phone.trim() || addingManualPlayer}
            >
              {addingManualPlayer ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="person-add" size={18} color="#fff" />
                  <Text style={styles.addButtonText}>Add Player</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
            <View style={styles.headerCenter}>
              <Text style={styles.headerText}>Add Players</Text>
              <Text style={styles.headerSubText}>Build your team</Text>
            </View>
            <View style={styles.teamNameContainer}>
              <Text style={styles.teamName}>{teamName}</Text>
            </View>
          </View>

          {/* Info Note */}
          {showInfoNote && (
            <Animatable.View animation="fadeInDown" style={styles.infoNote}>
              <View style={styles.infoNoteContent}>
                <Ionicons name="information-circle-outline" size={20} color={AppColors.info} />
                <Text style={styles.infoNoteText}>
                  You can add players by searching or manually. Captain can be assigned to any player.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowInfoNote(false)} style={styles.infoNoteClose}>
                <Ionicons name="close" size={16} color={AppColors.textLight} />
              </TouchableOpacity>
            </Animatable.View>
          )}

          {/* Search Area */}
          <View style={{ position: 'relative', zIndex: 10, marginBottom: 20 }}>
            <View style={styles.searchSection}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={AppColors.primary} />
                <TextInput
                  style={styles.input}
                  placeholder="Search players by name or phone..."
                  placeholderTextColor={AppColors.textLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                    <Ionicons name="close-circle" size={20} color={AppColors.placeholderGray} />
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.manualAddButton}
                onPress={() => setShowManualAddModal(true)}
              >
                <Ionicons name="person-add" size={18} color="#fff" />
                <Text style={styles.manualAddButtonText}>Add Manually</Text>
              </TouchableOpacity>
            </View>

            {/* Search Results */}
            {filteredPlayers.length > 0 && !loading && (
              <View style={styles.searchResultsList}>
                <Text style={styles.searchResultsTitle}>Search Results ({filteredPlayers.length})</Text>
                <FlatList
                  data={filteredPlayers}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderPlayerItem}
                  style={{ maxHeight: 200 }}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {/* Search Loader */}
            {loading && searchQuery.length > 0 && (
              <View style={styles.searchLoading}>
                <ActivityIndicator size="small" color={AppColors.primary} />
                <Text style={styles.searchLoadingText}>Searching players...</Text>
              </View>
            )}
          </View>

          {/* Team Players List */}
          <View style={styles.teamPlayersContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Team Players ({teamPlayers.length})</Text>
              {captainId && (
                <View style={styles.captainIndicator}>
                  <FontAwesome name="star" size={12} color={AppColors.warning} />
                  <Text style={styles.captainIndicatorText}>Captain Selected</Text>
                </View>
              )}
            </View>
            
            <FlatList
              data={teamPlayers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTeamPlayer}
              contentContainerStyle={teamPlayers.length === 0 ? styles.emptyListContainer : styles.listContainer}
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.playersList}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Footer */}
      <Animated.View
        style={[styles.footer, { transform: [{ translateY: footerTranslateY }] }]}
      >
        {errorMessage !== '' && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={16} color={AppColors.danger} />
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          </View>
        )}
        
        <TouchableOpacity 
          onPress={createTeam} 
          disabled={creatingTeam || teamPlayers.length === 0}
          style={styles.createTeamButton}
        >
          <LinearGradient
            colors={teamPlayers.length === 0 ? ['#ccc', '#aaa'] : [AppColors.primary, AppColors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createButton}
          >
            {creatingTeam ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.createButtonContent}>
                <Ionicons name="people" size={20} color="#fff" />
                <Text style={styles.createButtonText}>
                  Create Team {teamPlayers.length > 0 && `(${teamPlayers.length})`}
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Manual Add Modal */}
      {renderManualAddModal()}

      {/* Custom Alert Dialog */}
      <CustomAlertDialog
        visible={showAlert}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setShowAlert(false)}
      />
    </SafeAreaView>
  );
};

// ... Keep all your existing styles the same ...
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
    marginBottom: 16,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.textDark,
    marginBottom: 2,
  },
  headerSubText: {
    fontSize: 14,
    color: AppColors.textLight,
    fontWeight: '500',
  },
  teamNameContainer: {
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eaf4ff'
  },
  teamName: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primary,
  },
  // ... Rest of your styles remain exactly the same ...
  // Info Note
  infoNote: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoNoteContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoNoteText: {
    fontSize: 13,
    color: AppColors.info,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  infoNoteClose: {
    padding: 2,
    marginLeft: 8,
  },
  // Search Section
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.lightBackground,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: AppColors.borderLight,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  manualAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.success,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    height: 52,
    gap: 6,
    shadowColor: AppColors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  manualAddButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textDark,
    marginLeft: 12,
  },
  clearSearchButton: {
    padding: 4,
  },
  searchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: AppColors.lightBackground,
    borderRadius: 12,
    marginTop: 8,
  },
  searchLoadingText: {
    fontSize: 14,
    color: AppColors.textLight,
    marginLeft: 8,
  },
  // Search Results
  searchResultsList: {
    marginTop: 8,
    backgroundColor: AppColors.cardBackground,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: AppColors.borderLight,
    overflow: 'hidden',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textLight,
    padding: 12,
    backgroundColor: AppColors.lightBackground,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
    backgroundColor: AppColors.cardBackground,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownPlayerProfilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: AppColors.lightBackground,
    borderWidth: 1.5,
    borderColor: AppColors.borderLight,
  },
  dropdownPlayerInfo: {
    flex: 1,
  },
  dropdownPlayerName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textDark,
    marginBottom: 2,
  },
  dropdownPlayerRole: {
    fontSize: 13,
    color: AppColors.primary,
    fontWeight: '600',
  },
  dropdownPlayerPhone: {
    fontSize: 12,
    color: AppColors.textLight,
    marginTop: 2,
  },
  addButton: {
    padding: 6,
  },
  // Team Players Section
  teamPlayersContainer: {
    flex: 1,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.textDark,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
    paddingLeft: 12,
  },
  captainIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  captainIndicatorText: {
    fontSize: 12,
    color: AppColors.warning,
    fontWeight: '600',
  },
  playersList: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 10,
  },
  // Player Cards
  teamPlayerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppColors.cardBackground,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: AppColors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  manualPlayerCard: {
    backgroundColor: '#F8F9FF',
    borderColor: '#E8EAF6',
  },
  playerMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  playerProfileWrapper: {
    position: 'relative',
    borderRadius: 20,
  },
  captainHighlight: {
    borderWidth: 2,
    borderColor: AppColors.warning,
    borderRadius: 20,
  },
  manualPlayerProfile: {
    borderWidth: 2,
    borderColor: AppColors.info,
  },
  captainBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: AppColors.cardBackground,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: AppColors.warning,
    elevation: 4,
    shadowColor: AppColors.warning,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  manualPlayerIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: AppColors.info,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: AppColors.cardBackground,
  },
  manualPlayerIndicatorText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  playerProfilePic: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: AppColors.lightBackground,
    borderWidth: 1.5,
    borderColor: AppColors.borderLight,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 14
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textDark,
    marginRight: 8,
  },
  manualPlayerTag: {
    backgroundColor: AppColors.info,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  manualPlayerTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  playerRole: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  playerPhone: {
    fontSize: 12,
    color: AppColors.textLight,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  captainButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.cardBackground,
  },
  activeCaptainButton: {
    backgroundColor: AppColors.warning + '20',
    borderColor: AppColors.warning,
  },
  disabledCaptainButton: {
    borderColor: AppColors.placeholderGray,
    backgroundColor: AppColors.lightBackground,
  },
  deleteButton: {
    padding: 6,
  },
  // Empty State
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: AppColors.textDark,
    marginTop: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: AppColors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
    backgroundColor: AppColors.cardBackground,
    zIndex: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDEDED',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorMessage: {
    color: AppColors.danger,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  createTeamButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textDark,
  },
  closeButton: {
    padding: 4,
  },
  modalNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F4FD',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 10,
    gap: 8,
  },
  modalNoteText: {
    fontSize: 13,
    color: AppColors.info,
    flex: 1,
    lineHeight: 18,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
    gap: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: AppColors.borderLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: AppColors.lightBackground,
    color: AppColors.textDark,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: AppColors.borderLight,
    backgroundColor: AppColors.lightBackground,
  },
  roleOptionSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  roleOptionText: {
    fontSize: 14,
    color: AppColors.textDark,
    fontWeight: '500',
  },
  roleOptionTextSelected: {
    color: '#fff',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.borderLight,
    alignItems: 'center',
    backgroundColor: AppColors.lightBackground,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  addButtonModal: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonDisabled: {
    backgroundColor: AppColors.placeholderGray,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AddPlayersToTeam;