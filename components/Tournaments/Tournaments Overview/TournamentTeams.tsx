import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
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

// A common color palette for the app
const colors = {
  background: '#F0F2F5',
  surface: '#FFFFFF',
  text: '#1A237E',
  textSecondary: '#6A7382',
  accent: '#007AFF', // A vibrant blue
  accentLight: '#E8F5FF',
  danger: '#FF3B30',
  border: '#E0E0E0',
  placeholder: '#9E9E9E',
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

  const slideAnim = useRef(new Animated.Value(height)).current; // Adjusted initial value

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
      setLoading({ key: `Delete-${teamId}`, value: true }); // Unique key for deletion
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
      setLoading({ key: '', value: false }); // Reset loading
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
      toValue: height,
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
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Icon name="delete" size={24} color={colors.danger} />
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
          <ActivityIndicator size="small" color={colors.accent} style={styles.addingIndicator} />
        ) : (
          <Icon name="add-circle-outline" size={24} color={colors.accent} />
        )}
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="account-group"
        size={60}
        color={colors.accentLight}
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
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={50}
              color={colors.danger}
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
          <>
            {teams.length > 0 ? (
              <FlatList
                data={teams}
                renderItem={renderTeamItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[colors.accent]}
                    tintColor={colors.accent}
                  />
                }
                ListFooterComponent={
                  isCreator && (
                    <View style={styles.addButtonContainer}>
                      <TouchableOpacity
                        style={styles.floatingAddButton}
                        onPress={openModal}
                        activeOpacity={0.85}
                        disabled={loading.value && loading.key === 'All'}
                      >
                        <LinearGradient
                          colors={['#007AFF', '#0047AB']}
                          style={styles.gradientButton}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Icon name="add" size={28} color="#FFF" />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )
                }
              />
            ) : (
              renderEmptyState()
            )}
          </>
        )}

        <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ position: 'absolute', top: 0, width: '100%' }}
          >
            <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Teams</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Icon name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <AntDesign
                  name="search1"
                  size={20}
                  color={colors.placeholder}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search team by name..."
                  placeholderTextColor={colors.placeholder}
                  value={enteredTeamName}
                  onChangeText={handleInputChange}
                  autoFocus={true}
                  returnKeyType="search"
                />
              </View>
              <View style={styles.dropdownContainer}>
                {loading.value && loading.key === 'Search' ? (
                  <View style={styles.modalLoader}>
                    <ActivityIndicator size="large" color={colors.accent} />
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
                    <Text style={styles.noResultsText}>No teams found for "{enteredTeamName}"</Text>
                  </View>
                ) : (
                  <View style={styles.noResults}>
                    <Text style={styles.noResultsText}>
                      Search for teams to add.
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
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 10,
  },
  container: {
    flex: 1,
    position: 'relative',
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
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.2,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateAddButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  emptyStateAddButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 80,
    paddingHorizontal: 16,
  },
  teamCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  teamCaptain: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  deleteButton: {
    padding: 10,
    marginLeft: 10,
  },
  addButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
  },
  floatingAddButton: {
    // position: 'absolute',
    // bottom: 30,
    // right: 20,
    // width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    minHeight: 60,
    minWidth: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
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
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  modalLoader: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    maxHeight: height * 0.4,
  },
  dropdownContent: {
    paddingVertical: 8,
  },
  teamOptionItem: {
    marginBottom: 8,
  },
  teamOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamOptionImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
  teamOptionText: {
    flex: 1,
    marginLeft: 16,
  },
  teamOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  teamOptionCaptain: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addingIndicator: {
    marginLeft: 8,
  },
  noResults: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default Teams;