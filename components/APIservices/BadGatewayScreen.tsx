import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const BadGatewayScreen = () => {
  const navigation = useNavigation();

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      console.log("No screen to go back to, implement fallback navigation here.");
    }
  };

  const handleRetry = () => {
    console.log("Attempting to retry API calls...");
    alert("Retrying... (This is a placeholder, implement actual retry logic!)");
    if (navigation.canGoBack()) {
        navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Icon name="exclamation-triangle" size={80} color="#dc3545" style={styles.icon} />
      
      <Text style={styles.title}>Service Unavailable</Text>
      <Text style={styles.message}>
        We're experiencing some technical difficulties on our servers.
        Please bear with us while we fix this!
      </Text>
      <Text style={styles.message}>
        You can try again in a moment or return to a previous page.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleRetry}>
        <Text style={styles.buttonText}>Retry</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleGoBack}>
        <Text style={styles.secondaryButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007bff',
    marginTop: 15,
  },
  secondaryButtonText: {
    color: '#007bff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default BadGatewayScreen;