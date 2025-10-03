import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

async function ensureMediaPermission() {
  const { status, canAskAgain } = await ImagePicker.getMediaLibraryPermissionsAsync();

  if (status === 'granted') return true;
  if (status === 'denied' && !canAskAgain) {
    Alert.alert(
      "Permission Required",
      "Please enable photo access in settings to use this feature.",
      [{ text: "OK" }]
    );
    return false;
  }

  const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return newStatus === 'granted';
}

export default ensureMediaPermission;