import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import uuid from 'react-native-uuid';
import { AppColors, AppGradients } from '../../assets/constants/colors';

const OBS_REQUEST_TIMEOUT = 5000;

const manualScenes = [
  'mainScene',
  'newBatsmanScene',
  'playingXIScene',
];

const ConnectLiveStream = ({ route, navigation }) => {
  const { matchId } = route.params;
  const [obsIp, setObsIp] = useState('192.168.1.X');
  const [obsPassword, setObsPassword] = useState('');
  const [isObsConnected, setIsObsConnected] = useState(false);
  const [obsConnectionLoading, setObsConnectionLoading] = useState(false);
  const [obsConfigLoading, setObsConfigLoading] = useState(false);
  const [availableScenes, setAvailableScenes] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentScene, setCurrentScene] = useState('mainScene'); // track active scene

  const SCENES = [
    {
      name: 'mainScene',
      inputSettings: {
        url: `https:app.cricshub.com/api/v1/overlay/${matchId}?type=standard`,
        width: 1900,
        height: 300,
        positionX: 0,
        positionY: 0,
      },
    },
    {
      name: 'newBatsmanScene',
      inputSettings: {
        url: `https:app.cricshub.com/api/v1/overlay/${matchId}?type=newBatsman`,
        width: 800,
        height: 400,
        positionX: 0,
        positionY: 0,
      },
    },
    {
      name: 'playingXIScene',
      inputSettings: {
        url: `https:app.cricshub.com/api/v1/overlay/${matchId}?type=playingXI`,
        width: 1600,
        height: 900,
      },
    },
  ];

  const wsRef = useRef(null);
  const pendingRequestsRef = useRef({});

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const generateAuthToken = useCallback(async (password, salt, challenge) => {
    const secret = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + salt,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      secret + challenge,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
  }, []);

  const sendOBSEvent = useCallback((eventData, timeout = OBS_REQUEST_TIMEOUT) => {
    return new Promise((resolve, reject) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return reject(new Error('Not connected to OBS'));
      const requestId = uuid.v4();
      const timer = setTimeout(() => {
        delete pendingRequestsRef.current[requestId];
        reject(new Error('OBS request timeout'));
      }, timeout);
      pendingRequestsRef.current[requestId] = {
        resolve: (data) => {
          clearTimeout(timer);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      };
      ws.send(JSON.stringify({
        op: 6,
        d: { requestType: eventData.requestType, requestId, requestData: eventData.params || {} },
      }));
    });
  }, []);

  const setSceneTransform = (sceneName, sceneItemId) => {
    if (sceneName === 'playingXIScene') {
      const left = 86, right = 234, top = 128, bottom = 52;
      const width = 1920 - left - right;
      const height = 1080 - top - bottom;
      return { positionX: left, positionY: top, width, height };
    }
    if (sceneName === 'newBatsmanScene') {
      const bottom = 65;
      const width = 800;
      const height = 400;
      return { positionX: 0, positionY: 1080 - height - bottom, width, height };
    }
    return { positionX: 0, positionY: 780 };
  };

  const connectToOBS = useCallback(() => {
    if (!obsIp) return Alert.alert('Enter OBS IP');
    setObsConnectionLoading(true);
    const socket = new WebSocket(`ws://${obsIp}:4455`);

    socket.onopen = () => { wsRef.current = socket; };
    socket.onerror = () => {
      Alert.alert('Connection Error', 'Ensure OBS is running and WebSocket is enabled.');
      setObsConnectionLoading(false);
    };
    socket.onclose = () => {
      wsRef.current = null;
      setIsObsConnected(false);
      setObsConnectionLoading(false);
    };
    socket.onmessage = async (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.op === 0) {
          const identifyPayload = { op: 1, d: { rpcVersion: 1 } };
          // Fix authentication assignment
          if (data.d.authentication?.challenge) {
            const auth = await generateAuthToken(
              obsPassword,
              data.d.authentication.salt,
              data.d.authentication.challenge
            );
            (identifyPayload.d as any).authentication = auth;
          }
          socket.send(JSON.stringify(identifyPayload));
        } else if (data.op === 2) {
          setIsObsConnected(true);
          setObsConnectionLoading(false);
          fetchAvailableScenes();
        } else if (data.op === 7) {
          const { requestId, requestStatus, responseData } = data.d;
          const pending = pendingRequestsRef.current[requestId];
          if (pending) {
            if (requestStatus.result) pending.resolve(responseData);
            else pending.reject(new Error(requestStatus.comment));
            delete pendingRequestsRef.current[requestId];
          }
        }
      } catch (err) {
        console.error('OBS message error:', err);
      }
    };
  }, [obsIp, obsPassword, generateAuthToken]);

  const fetchAvailableScenes = useCallback(async () => {
    try {
      const result = await sendOBSEvent({ requestType: 'GetSceneList' });
      if (result && typeof result === 'object' && 'scenes' in result && Array.isArray((result as any).scenes)) {
        setAvailableScenes((result as any).scenes.map((scene: any) => scene.sceneName));
      } else {
        setAvailableScenes([]);
      }
    } catch (error) {
      console.error('Fetching scenes failed:', error);
    }
  }, [sendOBSEvent]);

  const configureOBS = useCallback(async () => {
    if (!isObsConnected) return Alert.alert('Connect to OBS first.');
    setObsConfigLoading(true);
    try {
      for (const scene of SCENES) {
        try {
          await sendOBSEvent({
            requestType: 'CreateScene',
            params: { sceneName: scene.name },
          });
        } catch (e) {
          if (!e.message.includes('scene already exists')) throw e;
        }

        await sendOBSEvent({
          requestType: 'CreateInput',
          params: {
            sceneName: scene.name,
            inputName: `${scene.name}_browser`,
            inputKind: 'browser_source',
            inputSettings: scene.inputSettings,
          },
        });

        // Fix sceneItemId destructure
        const sceneItemIdResp = await sendOBSEvent({
          requestType: 'GetSceneItemId',
          params: {
            sceneName: scene.name,
            sourceName: `${scene.name}_browser`,
          },
        });
        const sceneItemId = sceneItemIdResp && typeof sceneItemIdResp === 'object' && 'sceneItemId' in sceneItemIdResp ? (sceneItemIdResp as any).sceneItemId : undefined;

        await sendOBSEvent({
          requestType: 'SetSceneItemTransform',
          params: {
            sceneName: scene.name,
            sceneItemId,
            sceneItemTransform: setSceneTransform(scene.name, sceneItemId),
          },
        });
      }

      await sendOBSEvent({
        requestType: 'CreateInput',
        params: {
          sceneName: 'mainScene',
          inputName: 'Webcam',
          inputKind: 'dshow_input',
          inputSettings: { device_name: 'OBS Virtual Camera' },
        },
      });

      await sendOBSEvent({ requestType: 'SetCurrentProgramScene', params: { sceneName: 'mainScene' } });
      fetchAvailableScenes();
      Alert.alert('Success', 'Scenes configured');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setObsConfigLoading(false);
    }
  }, [sendOBSEvent, isObsConnected, fetchAvailableScenes]);

  // Switch scene and track current
  const switchScene = async (sceneName) => {
    try {
      await sendOBSEvent({ requestType: 'SetCurrentProgramScene', params: { sceneName } });
      setCurrentScene(sceneName);
    } catch (error) {
      Alert.alert('Scene Error', error.message);
    }
  };

  const disconnectFromOBS = () => {
    if (wsRef.current) wsRef.current.close();
    wsRef.current = null;
    setIsObsConnected(false);
  };

  // Add this function inside your component
  const refreshScenes = useCallback(async () => {
    try {
      for (const scene of SCENES) {
        await sendOBSEvent({
          requestType: 'PressInputPropertiesButton',
          params: {
            inputName: `${scene.name}_browser`,
            propertyName: 'refreshnocache', // OBS Browser Source refresh button
          },
        });
        console.log(`Refreshed ${scene.name}_browser`);
      }
    } catch (err) {
      console.error("Auto-refresh failed:", err.message);
    }
  }, [sendOBSEvent]);

  // Auto-refresh effect
  useEffect(() => {
    if (!isObsConnected) return;

    const interval = setInterval(() => {
      refreshScenes();
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, [isObsConnected, refreshScenes]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.white} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBarWrapper}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={AppColors.blue} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>OBS Studio Connection</Text>
          </View>
        </View>

        <ScrollView style={styles.container}>
          <View style={styles.section}>
            <LinearGradient
              colors={AppGradients.primaryCard}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="cast-connected" color="white" size={28} />
                <Text style={styles.sectionTitle}>OBS Studio Configuration</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>IP Address:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="OBS IP (e.g., 192.168.1.X)"
                  placeholderTextColor="#aaa"
                  value={obsIp}
                  onChangeText={setObsIp}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.advancedToggle}
                onPress={() => setShowAdvanced(!showAdvanced)}
              >
                <Text style={styles.advancedToggleText}>Advanced Settings</Text>
                <MaterialIcons
                  name={showAdvanced ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>

              {showAdvanced && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password (if required):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="OBS WebSocket Password"
                    placeholderTextColor="#aaa"
                    value={obsPassword}
                    onChangeText={setObsPassword}
                    secureTextEntry
                  />
                </View>
              )}
            </LinearGradient>

            {!isObsConnected ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.connectButton, obsConnectionLoading && styles.buttonDisabled]}
                  onPress={connectToOBS}
                  disabled={obsConnectionLoading}
                >
                  {obsConnectionLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="connection" size={20} color="#fff" />
                      <Text style={styles.buttonText}> Connect to OBS</Text>
                    </>
                  )}
                </TouchableOpacity>
                <View style={styles.ipHintContainer}>
                  <MaterialIcons name="info-outline" size={16} color={AppColors.blue} />
                  <Text style={styles.ipHintText}>
                    To find your OBS system's IP, open Command Prompt (Windows) or Terminal (Mac/Linux) and type: ipconfig (Windows) or ifconfig (Mac/Linux). Look for the IPv4 Address.
                  </Text>
                </View>
                {/* END: IP Hint Note */}
              </>
            ) : (
              <>
                <View style={styles.connectionStatusContainer}>
                  <View style={styles.connectionStatus}>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                    <Text style={styles.connectionStatusText}>Connected to OBS</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.configureButton, obsConfigLoading && styles.buttonDisabled]}
                  onPress={configureOBS}
                  disabled={obsConfigLoading}
                >
                  {obsConfigLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="cog" size={20} color="#fff" />
                      <Text style={styles.buttonText}> Configure OBS</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.scenesSection}>
                  <Text style={styles.scenesTitle}>Scene Controls</Text>
                  <View style={styles.scenesGrid}>
                    {manualScenes.length > 0 ? (
                      manualScenes.map((scene) => (
                        <TouchableOpacity
                          key={scene}
                          style={styles.sceneButton}
                          onPress={() => switchScene(scene)}
                        >
                          <MaterialCommunityIcons name="monitor" size={18} color="#fff" />
                          <Text style={styles.buttonText}>
                            {scene === 'mainScene' && 'Show Scoring Overlay'}
                            {scene === 'newBatsmanScene' && 'Show New Batsman'}
                            {scene === 'playingXIScene' && 'Show Playing XI'}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={{ color: 'red' }}>No manual scenes available</Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity style={[styles.button, styles.disconnectButton]} onPress={disconnectFromOBS}>
                  <MaterialCommunityIcons name="connection" size={20} color="#fff" />
                  <Text style={styles.buttonText}> Disconnect</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default ConnectLiveStream;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.white },
  topBarWrapper: { backgroundColor: AppColors.white, shadowColor: AppColors.black, elevation: 3, zIndex: 10 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", paddingHorizontal: 15, paddingVertical: 10, minHeight: 56 },
  backButton: { paddingRight: 15, paddingVertical: 5 },
  topBarTitle: { fontSize: 18, fontWeight: "600", color: AppColors.blue },
  container: { flex: 1, backgroundColor: AppColors.white },
  section: { padding: 16 },
  card: { borderRadius: 15, padding: 20, marginBottom: 20, borderWidth: 3, borderColor: AppColors.cardBorder, shadowColor: AppColors.black, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.75, shadowRadius: 4, elevation: 5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { color: AppColors.white, fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  inputContainer: { marginBottom: 15 },
  inputLabel: { color: AppColors.white, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 10, padding: 15, color: '#333', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
  advancedToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginBottom: 10 },
  advancedToggleText: { color: AppColors.white, fontSize: 14, fontWeight: '500' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: AppColors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  buttonDisabled: { opacity: 0.7 },
  connectButton: { backgroundColor: '#2196F3' },
  configureButton: { backgroundColor: '#4CAF50' },
  disconnectButton: { backgroundColor: '#F44336' },
  connectionStatusContainer: { marginBottom: 20 },
  connectionStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(76, 175, 80, 0.2)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(76, 175, 80, 0.5)' },
  connectionStatusText: { color: '#249628', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  scenesSection: { marginVertical: 20 },
  scenesTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: AppColors.blue },
  scenesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sceneButton: { backgroundColor: '#2196F3', padding: 12, borderRadius: 10, marginRight: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '500', marginLeft: 6 },
  // NEW STYLE FOR IP HINT
  ipHintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(33, 150, 243, 0.1)', // Light blue background
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.blue,
  },
  ipHintText: {
    color: '#333',
    fontSize: 12,
    flexShrink: 1,
    marginLeft: 8,
    lineHeight: 18,
  },
});