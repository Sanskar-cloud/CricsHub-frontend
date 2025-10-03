import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiService from '../../APIservices';

const { width, height } = Dimensions.get('window');

// Enhanced Color Palette
const AppColors = {
  background: '#F0F2F5',
  surface: '#FFFFFF',
  text: '#1F2937', 
  textSecondary: '#6B7280',
  primary: '#10B981', // Emerald Green for positive actions
  primaryDark: '#047857',
  accent: '#3B82F6', // Blue accent for visibility/secondary action
  accentLight: '#BFDBFE', 
  danger: '#EF4444',
  border: '#E5E7EB',
  placeholder: '#9CA3AF',
  shadowColor: 'rgba(0, 0, 0, 0.1)',
};

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

const Teams = ({ id, isCreator }) => {
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState("");
  const [teamId, setTeamId] = useState("");
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [loading, setLoading] = useState({ key: '', value: false });
  const [enteredTeamName, setEnteredTeamName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current; 
  const modalHeight = height * 0.7; 

  const fetchTeams = async (id) => {
    try {
      setLoading({ key: 'All', value: true });
      setError("");
      const response = await apiService({
        endpoint: `tournaments/${id}`,
        method: 'GET',
      });
      if (response.success) {
        setTeams(response.data.data.teamNames || []);
      } else {
        setError(response.error?.message || 'Failed to fetch teams');
      }
    } catch (err) {
      setError('Failed to fetch teams. Please try again.');
    } finally {
      setLoading({ key: 'All', value: false });
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeams(id);
  }, [id]);

  const searchTeamsByName = async (name) => {
    try {
      setLoading({ key: 'Search', value: true });
      const response = await apiService({
        endpoint: 'teams/search/name',
        method: 'GET',
        params: { name },
      });
      if (response.success) {
        setDropdownOptions(response?.data?.data || []);
      } else {
        setError(response.error?.message || 'Failed to search teams');
      }
    } catch (err) {
      setError('Failed to search teams');
    } finally {
      setLoading({ key: 'Search', value: false });
    }
  };

  const debouncedSearch = useCallback(
    debounce((name) => searchTeamsByName(name), 500),
    []
  );

  const handleInputChange = (value) => {
    setEnteredTeamName(value);
    if (value.length > 2) {
      debouncedSearch(value);
    } else {
      setDropdownOptions([]);
    }
  };

  const addNewTeam = async (teamid) => {
    Keyboard.dismiss();
    try {
      setIsAddingTeam(true);
      setLoading({ key: 'Add', value: true });
      const response = await apiService({
        endpoint: `tournaments/${id}/add-teams`,
        method: 'POST',
        body: [teamid.trim()],
      });
      if (response.success) {
        setEnteredTeamName('');
        setTeamId('');
        setDropdownOptions([]);
        await fetchTeams(id);
        closeModal();
      } else {
        setError(response.error?.message || 'Failed to add team');
      }
    } catch (err) {
      setError('Failed to add team');
    } finally {
      setLoading({ key: 'Add', value: false });
      setIsAddingTeam(false);
    }
  };

  const deleteTeamHandler = async (teamId) => {
    try {
      setLoading({ key: `Delete-${teamId}`, value: true }); 
      const response = await apiService({
        endpoint: `tournaments/${id}/remove-teams`,
        method: 'POST',
        body: [teamId.trim()],
      });
      if (!response.success) {
        setError(response.error?.message || "Couldn't delete team");
      }
    } catch (err) {
      setError("Couldn't delete team");
    } finally {
      await fetchTeams(id);
      setLoading({ key: '', value: false }); 
    }
  };

  useEffect(() => {
    fetchTeams(id);
  }, [id]);

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: modalHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setDropdownOptions([]);
      setEnteredTeamName('');
    });
  };

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible, slideAnim]);

  const renderTeamItem = ({ item }) => (
    <View style={styles.teamCard}>
      <View style={styles.teamInfo}>
        <Image
          source={{ uri: item.logoPath || 'https://via.placeholder.com/50' }}
          style={styles.teamImage}
        />
        <View style={styles.teamTextContainer}>
          <Text style={styles.teamName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.teamCaptain} numberOfLines={1}>
            {item.captain?.name || 'No captain assigned'}
          </Text>
        </View>
      </View>
      {isCreator && (
        <Pressable
          onPress={() => deleteTeamHandler(item.id)}
          style={styles.deleteButton}
          disabled={loading.key === `Delete-${item.id}` && loading.value}
        >
          {loading.key === `Delete-${item.id}` && loading.value ? (
            <ActivityIndicator size="small" color={AppColors.danger} />
          ) : (
            <Icon name="remove-circle-outline" size={26} color={AppColors.danger} />
          )}
        </Pressable>
      )}
    </View>
  );

  const renderSearchItem = ({ item }) => (
    <Pressable
      style={styles.teamOptionItem}
      onPress={() => {
        setEnteredTeamName(item.name);
        setTeamId(item.id);
        addNewTeam(item.id);
      }}
      disabled={isAddingTeam}
    >
      <View style={styles.teamOptionContent}>
        <Image
          source={{ uri: item.logoPath || 'https://via.placeholder.com/50' }}
          style={styles.teamOptionImage}
        />
        <View style={styles.teamOptionText}>
          <Text style={styles.teamOptionName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.teamOptionCaptain} numberOfLines={1}>
            {item.captain?.name || 'No captain'}
          </Text>
        </View>
        {isAddingTeam && teamId === item.id ? (
          <ActivityIndicator size="small" color={AppColors.primary} style={styles.addingIndicator} />
        ) : (
          <Icon name="add-circle-outline" size={24} color={AppColors.primary} />
        )}
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="account-group"
        size={60}
        color={AppColors.accentLight}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Teams Yet</Text>
      <Text style={styles.emptyText}>
        {isCreator
          ? "Get started by adding teams to your tournament."
          : "The tournament organizer hasn't added any teams yet."}
      </Text>
      {isCreator && (
        <TouchableOpacity
          style={styles.emptyStateAddButton}
          onPress={openModal}
        >
          <Text style={styles.emptyStateAddButtonText}>Add Teams</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {loading.value && loading.key === 'All' ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
          </View>
        ) : error && teams.length === 0 ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={50}
              color={AppColors.danger}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchTeams(id)}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            // 💥 FIX: Disabling internal scrolling to resolve nesting error
            scrollEnabled={false} 
            data={teams}
            renderItem={renderTeamItem}
            keyExtractor={(item) => item.id}
            // Removing paddingBottom here since the parent ScrollView handles overall padding
            contentContainerStyle={styles.listContentNoScroll} 
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[AppColors.primary]}
                tintColor={AppColors.primary}
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}
        
        {/* Floating Add Button */}
        {isCreator && (teams.length > 0 || !loading.value) && (
            <View style={styles.fixedButtonContainer}>
                <TouchableOpacity
                    style={styles.floatingAddButton}
                    onPress={openModal}
                    activeOpacity={0.85}
                    disabled={loading.value && loading.key === 'All'}
                >
                    <LinearGradient
                        colors={[AppColors.primary, AppColors.primaryDark]}
                        style={styles.gradientButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Icon name="add" size={28} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        )}

        {/* Modal for Adding Teams */}
        <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            {/* Modal Content - Animate from top */}
            <Animated.View style={[
              styles.modalContent, 
              { transform: [{ translateY: slideAnim }] }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Teams</Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Icon name="close" size={24} color={AppColors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <AntDesign
                  name="search1"
                  size={20}
                  color={AppColors.primary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search team by name..."
                  placeholderTextColor={AppColors.placeholder}
                  value={enteredTeamName}
                  onChangeText={handleInputChange}
                  autoFocus={true}
                  returnKeyType="search"
                />
                {loading.value && loading.key === 'Search' && (
                  <ActivityIndicator size="small" color={AppColors.primary} />
                )}
              </View>
              <View style={styles.dropdownContainer}>
                {loading.value && loading.key === 'Search' ? (
                  <View style={styles.modalLoader}>
                    <ActivityIndicator size="large" color={AppColors.primary} />
                    <Text style={{ color: AppColors.textSecondary, marginTop: 10 }}>Searching...</Text>
                  </View>
                ) : dropdownOptions.length > 0 ? (
                  <FlatList
                    data={dropdownOptions}
                    renderItem={renderSearchItem}
                    keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                    contentContainerStyle={styles.dropdownContent}
                    keyboardShouldPersistTaps="handled"
                  />
                ) : enteredTeamName.length > 2 ? (
                  <View style={styles.noResults}>
                    <Text style={styles.noResultsTitle}>No Teams Found 😥</Text>
                    <Text style={styles.noResultsText}>
                      Try refining your search query.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.noResults}>
                    <Icon name="search" size={40} color={AppColors.placeholder} />
                    <Text style={styles.noResultsText}>
                      Start typing a team name to search and add.
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    marginTop: 10,
    flex: 1,
    backgroundColor: AppColors.background,
    borderRadius: 10,
    paddingVertical: 10,
  },
  container: {
    flex: 1,
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: AppColors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: AppColors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: AppColors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    margin: 16,
    shadowColor: AppColors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: height * 0.4
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateAddButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    shadowColor: AppColors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  emptyStateAddButtonText: {
    color: AppColors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // FIX: Content container style when scrolling is disabled. Needs enough padding
  listContentNoScroll: {
    paddingVertical: 12,
    paddingBottom: 80, // Ensure enough bottom padding for the floating button
    paddingHorizontal: 16,
    flexGrow: 1, // Crucial for the parent ScrollView to capture the full height
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 80, 
    paddingHorizontal: 16,
  },
  teamCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: AppColors.accent,
    shadowColor: AppColors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  teamImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.border,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
  },
  teamCaptain: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },

  // --- Modal & Search Styles ---
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10,
  },
  floatingAddButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: AppColors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'absolute', 
    width: '100%',
    height: '100%',
  },
  modalContent: {
    backgroundColor: AppColors.surface,
    width: '100%',
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: height * 0.5,
    maxHeight: height * 0.8,
    shadowColor: AppColors.text,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.text,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.surface, 
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.primary, 
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
    marginLeft: 12,
    padding: 0, 
  },
  searchIcon: {
    marginRight: 0,
    color: AppColors.primary,
  },
  modalLoader: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    maxHeight: height * 0.4,
    paddingBottom: 10,
  },
  dropdownContent: {
    paddingVertical: 8,
  },
  teamOptionItem: {
    marginBottom: 10,
  },
  teamOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: AppColors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  teamOptionImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: AppColors.border,
  },
  teamOptionText: {
    flex: 1,
    marginLeft: 15,
  },
  teamOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
  },
  teamOptionCaptain: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  addingIndicator: {
    marginLeft: 10,
  },
  noResults: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 8,
  },
  noResultsText: {
    color: AppColors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});

export default Teams;