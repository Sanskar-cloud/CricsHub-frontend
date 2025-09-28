import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
  Linking, // Import Linking for redirecting to settings
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

const AppColors = {
  white: "#FFFFFF",
  black: "#000000",
  blue: "#3498DB",
  background: "#F8F9FA",
  cardBorder: "rgba(255, 255, 255, 0.2)",
  error: "#E74C3C",
  darkText: "#000000",
  lightBackground: "#F8F9FA",
};

const CreateTeam = () => {
  const [teamName, setTeamName] = useState('');
  const [logoUri, setLogoUri] = useState(null);
  const navigation = useNavigation();

  const pickImage = async () => {
    // 1. Request Media Library permission status
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      // 2. Permission Denied: Show a custom dialogue
      Alert.alert(
        'Gallery Access Required',
        'We need access to your photo library to upload a team logo. Please enable this permission in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              // Redirect user to app settings (works reliably on iOS/Android)
              Linking.openSettings();
            },
            style: 'default',
          },
        ]
      );
      return;
    }

    // 3. Permission Granted: Open gallery
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleContinue = () => {
    if (!teamName.trim() || !logoUri) {
      Alert.alert('Error', 'Please fill in the team name and upload a logo.');
      return;
    }
    navigation.navigate('AddPlayersToTeam', {
      teamName,
      logoUri,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ✅ Fixes Android SafeArea with padding */}
      {Platform.OS === "android" && (
        <RNStatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      )}

      {/* Header - Matching TeamPage style */}
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

      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <LinearGradient
            colors={['#4A90E2', '#6BB9F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          >
            <View style={styles.logoContainer}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
                <View style={styles.logoPlaceholder}>
                  {logoUri ? (
                    <Image source={{ uri: logoUri }} style={styles.logo} />
                  ) : (
                    <MaterialIcons name="add-a-photo" size={40} color="#4A90E2" />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Team Name"
              placeholderTextColor="#999"
              value={teamName}
              onChangeText={setTeamName}
            />

            <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
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
    backgroundColor: AppColors.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
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
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  gradientCard: {
    width: '90%',
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  input: {
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 12,
    color: '#333',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  continueButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateTeam;