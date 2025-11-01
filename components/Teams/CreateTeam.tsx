import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
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
// import ensureMediaPermission from '../Permissions';

const AppColors = {
  white: "#FFFFFF",
  black: "#000000",
  blue: "#3498DB",
  background: "#F8F9FA",
  cardBorder: "rgba(255, 255, 255, 0.2)",
  error: "#E74C3C",
  darkText: "#000000",
  lightBackground: "#F8F9FA",
  primaryGradientStart: '#4A90E2',
  primaryGradientEnd: '#6BB9F0',
};

const CreateTeam = () => {
  const [teamName, setTeamName] = useState('');
  // const [logoUri, setLogoUri] = useState(null);
  const navigation = useNavigation();

  // const pickImage = async () => {
  //   const hasPermission = await ensureMediaPermission();
  //   if (!hasPermission) return;

  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     aspect: [4, 4],
  //     quality: 1,
  //   });

  //   if (!result.canceled) {
  //     setLogoUri(result.assets[0].uri);
  //   }
  // };

  const handleContinue = () => {
    // if (!teamName.trim() || !logoUri) {
    if (!teamName.trim()) {
      Alert.alert('Error', 'Please fill in the team name and upload a logo.');
      return;
    }
    navigation.navigate('AddPlayersToTeam', {
      teamName,
      // logoUri,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      {Platform.OS === "android" && (
        <RNStatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      )}

      {/* Header */}
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
        // Adjust the offset if the keyboard still overlaps on Android
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.contentWrapper}>
          <LinearGradient
            colors={[AppColors.primaryGradientStart, AppColors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          >
            {/*<View style={styles.logoContainer}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
                <View style={styles.logoPlaceholder}>
                  {logoUri ? (
                    <Image source={{ uri: logoUri }} style={styles.logo} />
                  ) : (
                    <MaterialIcons name="add-a-photo" size={40} color={AppColors.primaryGradientStart} />
                  )}
                </View>
              </TouchableOpacity>
            </View>*/}

            <TextInput
              style={styles.input}
              placeholder="Team Name"
              placeholderTextColor="#999"
              value={teamName}
              onChangeText={setTeamName}
              maxLength={20}
              autoCapitalize="words"
            />

            <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </LinearGradient>
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
    backgroundColor: AppColors.lightBackground,
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
  // contentWrapper centers the content vertically
  contentWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  gradientCard: {
    width: '100%',
    maxWidth: 400, // Optional: Limit width on larger screens/tablets
    borderWidth: 2,
    borderColor: AppColors.primaryGradientStart,
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
    borderColor: AppColors.primaryGradientStart,
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
    borderRadius: 10, // Slightly more rounded corners
    marginBottom: 25, // Increased spacing for better look
    backgroundColor: AppColors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: AppColors.primaryGradientStart,
    paddingVertical: 15,
    borderRadius: 12, // Increased rounded corners
    alignItems: 'center',
    shadowColor: AppColors.primaryGradientStart,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  continueButtonText: {
    color: AppColors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default CreateTeam;