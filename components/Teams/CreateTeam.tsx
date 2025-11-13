import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const AppColors = {
  white: "#FFFFFF",
  black: "#000000",
  blue: "#3498DB",
  background: "#F8F9FF",
  cardBorder: "rgba(255, 255, 255, 0.2)",
  error: "#E74C3C",
  darkText: "#2D3748",
  lightText: "#718096",
  lightBackground: "#F7FAFC",
};

const AppGradients = {
  primaryCard: ['#3498DB', '#2980B9'],
  primaryButton: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'],
};

const CreateTeam = () => {
  const [teamName, setTeamName] = useState('');
  const [logoUri, setLogoUri] = useState(null);
  const navigation = useNavigation();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photos to pick an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLogoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleContinue = () => {
    if (!teamName.trim()) {
      Alert.alert('Team Name Required', 'Please enter your team name to continue.');
      return;
    }
    
    navigation.navigate('AddPlayersToTeam', {
      teamName: teamName.trim(),
      logoUri,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {Platform.OS === "android" && (
        <RNStatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      )}

      {/* Original Header - Unchanged */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={26} color={AppColors.darkText} />
        </TouchableOpacity>
        <Text style={styles.heading}>Create Team</Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} // Increased offset for iOS
      >
        <View style={styles.mainContent}>
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={AppGradients.primaryCard}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                  <MaterialIcons name="groups" size={24} color={AppColors.white} />
                </View>
              </View>
              
              {/* Card Body */}
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>Create Your Team</Text>
                <Text style={styles.cardDescription}>Build your cricket squad</Text>

                {/* Logo Upload Section */}
                <View style={styles.logoSection}>
                  <TouchableOpacity 
                    onPress={pickImage} 
                    style={styles.logoContainer}
                    activeOpacity={0.8}
                  >
                    <View style={styles.logoPlaceholder}>
                      {logoUri ? (
                        <Image source={{ uri: logoUri }} style={styles.logoImage} />
                      ) : (
                        <View style={styles.logoPlaceholderContent}>
                          <MaterialIcons name="add-a-photo" size={28} color={AppColors.white} />
                          <Text style={styles.logoPlaceholderText}>Add Logo</Text>
                        </View>
                      )}
                    </View>
                    {logoUri && (
                      <View style={styles.logoOverlay}>
                        <MaterialIcons name="edit" size={16} color={AppColors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Team Name Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="edit" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter team name"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      value={teamName}
                      onChangeText={setTeamName}
                      maxLength={25}
                      autoCapitalize="words"
                      autoFocus
                    />
                  </View>
                  <Text style={styles.charCount}>
                    {teamName.length}/25
                  </Text>
                </View>
              </View>

              {/* Continue Button - Matching Home Page Card Button Style */}
              <TouchableOpacity 
                onPress={handleContinue} 
                style={[
                  styles.cardButton,
                  !teamName.trim() && styles.cardButtonDisabled
                ]}
                disabled={!teamName.trim()}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={AppGradients.primaryButton}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.cardButtonText}>
                    Continue
                  </Text>
                  <MaterialIcons name="arrow-forward" size={16} color={AppColors.white} />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    zIndex: 10, // Ensure header stays on top
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.darkText,
  },
  headerButton: {
    padding: 6,
    width: 40,
  },

  // Main Content
  mainContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'flex-start', // Changed from 'center' to 'flex-start'
    alignItems: 'center',
    paddingTop: 20, // Add some top padding to prevent overlap
  },

  // Card Container - Matching Home Page Card Style
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    minHeight: 450, // Use minHeight instead of aspectRatio for better keyboard behavior
    maxHeight: 500,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 20, // Added margin to ensure space from header
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },

  // Card Header
  cardHeader: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Card Body
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  logoPlaceholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  logoImage: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  logoOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Input Section
  inputContainer: {
    width: '100%',
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    height: 50,
    width: '100%',
    maxWidth: 280,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 8,
  },

  // Card Button - Matching Home Page Button Style
  cardButton: {
    marginTop: 20,
  },
  cardButtonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardButtonText: {
    color: AppColors.white,
    fontWeight: '600',
    fontSize: 14,
    marginRight: 8,
  },
});

export default CreateTeam;