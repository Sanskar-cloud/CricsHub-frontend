import * as MediaLibrary from 'expo-media-library';

async function ensureMediaPermission() {
  const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();

  if (status === 'granted') return true;
  if (status === 'denied' && !canAskAgain) {
    Alert.alert(
      "Permission Required",
      "Please enable photo access in settings to use this feature.",
      [{ text: "OK" }]
    );
    return false;
  }

  const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
  return newStatus === 'granted';
}

export default ensureMediaPermission;