import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Client, IMessage } from '@stomp/stompjs';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import SockJS from 'sockjs-client';
import { AppColors } from '../../../assets/constants/colors';
import apiService from '../../APIservices';
const bg = require('../../../assets/images/cricsLogo.png');
const driveImage = require('../../../assets/images/DriveShot.png');
const cutImage = require('../../../assets/images/squareShot.png');
const pullImage = require('../../../assets/images/HookShot.png');
const hookImage = require('../../../assets/images/HookShot.png');
const sweepImage = require('../../../assets/images/Sweep.png');
const reverseSweepImage = require('../../../assets/images/Sweep.png');
const flickImage = require('../../../assets/images/FlickShot.png');
const defensiveImage = require('../../../assets/images/Defence.png');
const loftedImage = require('../../../assets/images/LoaftedShot.png');

const ScoringScreen = ({ route, navigation }) => {
  const [matchId, setMatchId] = useState(route.params.matchId);
  const [bowler, setBowler] = useState({ id: route.params.bowler, name: route.params.selectedBowlerName, overs: 0, runsConceded: 0, wickets: 0 });
  const [striker, setStriker] = useState({ id: route.params.strikerId, name: route.params.selectedStrikerName, runs: 0, ballsFaced: 0 });
  const [nonStriker, setNonStriker] = useState({ id: route.params.nonStrikerId, name: route.params.selectedNonStrikerName, runs: 0, ballsFaced: 0 });
  const isSubmitConnectedRef = useRef(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [wideExtra, setWideExtra] = useState('');
  const [noBallExtra, setNoBallExtra] = useState('');
  const [byeExtra, setByeExtra] = useState('');
  const [wicketType, setWicketType] = useState('');
  const [modals, setModals] = useState({
    bye: false,
    wide: false,
    wicket: false,
    nextBatsman: false,
    nextBowler: false,
    noBall: false,
    startNextInnings: false,
    catch: false,
    runout: false,
    fielderSelect: false,
  });
  const newBowlerSelectionRef = useRef(false);
  const [battingTeamName, setBattingTeamName] = useState(route.params.battingTeamName);
  const [score, setScore] = useState(route.params.score || 0);
  const [extras, setExtras] = useState(0);
  const [bowlingTeamName, setBowlingTeamName] = useState(route.params.bowlingTeamName);
  const [wicket, setWicket] = useState(route.params.wicket || 0);
  const [completedOvers, setCompletedOvers] = useState(route.params.completedOvers || 0);
  const [overDetails, setOverDetails] = useState("");
  const [availableBatsmen, setAvailableBatsmen] = useState([]);
  const [selectedBatsman, setSelectedBatsman] = useState({ playerId: null, name: null });
  const legalDeliveriesRef = useRef(0);
  const [legalDeliveries, setLegalDeliveries] = useState(0);
  const [selectedBowler, setSelectedBowler] = useState({
    playerId: '',
    name: ''
  });
  const [bowlingPlayingXI, setBowlingPlayingXI] = useState([]);
  const [battingPlayingXI, setBattingPlayingXI] = useState([]);
  const [availableBowler, setAvailableBowler] = useState([]);
  const [selectedCatcher, setSelectedCatcher] = useState();
  const [runOutGetterId, setRunOutGetterId] = useState(null);
  const [runOutFielderId, setRunOutFielderId] = useState(null);
  const [runOutRuns, setRunOutRuns] = useState('0');
  const [directionModalVisible, setDirectionModalVisible] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [selectedShot, setSelectedShot] = useState(null);
  const [shotModalVisible, setShotModalVisible] = useState(false);
  const [secondInningsStartInfoModal, setSecondInningsStartInfoModal] = useState(false);
  const [selectedRunForShot, setSelectedRunForShot] = useState(null);
  const liveSocketRef = useRef(null);
  const canReconnectRef = useRef(true);
  const [enableScoreButton, setEnableScoreButton] = useState(true);
  const [canSelectBatsman, setCanSelectBatsman] = useState(false);
  const cricketShots = [
    'Drive',
    'Cut',
    'Pull',
    'Hook',
    'Sweep',
    'Reverse Sweep',
    'Flick',
    'Defensive',
    'Lofted',
  ];
  const shotImages = {
    'Drive': driveImage,
    'Cut': cutImage,
    'Pull': pullImage,
    'Hook': hookImage,
    'Sweep': sweepImage,
    'Reverse Sweep': reverseSweepImage,
    'Flick': flickImage,
    'Defensive': defensiveImage,
    'Lofted': loftedImage,
  };
  const directions = [
    { name: 'Mid Wicket', angle: 0 },
    { name: 'Cover', angle: 180 },
    { name: 'Long on', angle: 45 },
    { name: 'Mid off', angle: 135 },
    { name: 'Square leg', angle: 315 },
    { name: 'Point', angle: 225 },
    { name: 'Straight', angle: 90 },
    { name: 'Fine Leg', angle: 270 },
  ];


  const radius = 120;
  const center = 150;

  const handleRunSelection = (run) => {
    setEnableScoreButton(false);
    setSelectedRunForShot(run);
    setShotModalVisible(true);
  };


  const handleShotSelection = (shot) => {
    setSelectedShot(shot);
    setShotModalVisible(false);
    setDirectionModalVisible(true);

  };
  const handleDirectionSelection = (direction) => {
    setSelectedDirection(direction);
    setDirectionModalVisible(false);
    handleSubmit({
      runs: parseInt(selectedRunForShot),
      wide: false,
      noBall: false,
      bye: false,
      legBye: false,
      wicket: false,
      shotType: selectedShot,
      direction: direction,
    });
  };

  const getInitials = (name) => {
    if (!name) return "";

    const parts = name.trim().split(" ").filter(Boolean);

    if (parts.length === 1) {
      // single word name -> return as is
      return parts[0];
    }

    // multiple words -> take first letter of each
    return parts.map((p) => p[0].toUpperCase()).join("");
  };

  const matchStateUpdateHandler = (data) => {
    setOverDetails((prev) => prev + " " + data?.ballString);
    setBowler({
      id: data.currentBowler?.id,
      name: getInitials(data.currentBowler?.name),
      overs: data.currentBowler?.overs,
      runsConceded: data.currentBowler?.runsConceded,
      wickets: data.currentBowler?.wickets
    });
    setStriker({
      id: data.striker?.id,
      name: getInitials(data.striker?.name),
      runs: data.striker?.runs,
      ballsFaced: data.striker?.ballsFaced
    });
    setNonStriker({
      id: data.nonStriker?.id,
      name: getInitials(data.nonStriker?.name),
      runs: data.nonStriker?.runs,
      ballsFaced: data.nonStriker?.ballsFaced
    });
    if (data.striker?.id === null || data.nonStriker?.id === null || data.striker === null || data.nonStriker === null)
      setCanSelectBatsman(true);
    setCompletedOvers(data?.overNumber);
    setScore(data?.totalRuns);
    setWicket(data?.wicketsLost);

    if (data.overComplete === true) {
      setOverDetails("");
      legalDeliveriesRef.current = 0;
      setLegalDeliveries(0);
      if (data.overNumber !== data.totalOvers) {
        const filteredBowlers = bowlingPlayingXI.filter(p => p.playerId !== bowler.id);
        setAvailableBowler(filteredBowlers);
        newBowlerSelectionRef.current = true;
        setModals((prev) => ({ ...prev, nextBowler: true }));
      }
    }
    if (data.overComplete === false) {
      const ballStr = data?.ballString?.toUpperCase();
      const isWide = ballStr?.includes("WD");
      const isNoBall = ballStr?.includes("NB");
      const isLegalDelivery = !isWide && !isNoBall;

      if (isLegalDelivery) {
        const updatedLegalDeliveries = (legalDeliveriesRef.current + 1) % 6;
        legalDeliveriesRef.current = updatedLegalDeliveries;
        setLegalDeliveries(updatedLegalDeliveries);
      }
    }

  }

  const stompSubmitClientRef = useRef<Client | null>(null);
  const stompLiveClientRef = useRef<Client | null>(null);

  const useStompConnection = () => {
    const [submitConnected, setSubmitConnected] = useState(false);
    const [liveConnected, setLiveConnected] = useState(false);
    const reconnectAttempts = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 3;

    const updateConnectionState = (type: 'submit' | 'live', isConnected: boolean) => {
      if (type === 'submit') {
        setSubmitConnected(isConnected);
      } else {
        setLiveConnected(isConnected);
      }

      if (!isConnected) {
        console.warn(`[${type}] Connection state updated to disconnected`);
      }
    };

    const setupClient = (
      clientRef: React.MutableRefObject<Client | null>,
      type: 'submit' | 'live',
      matchId: string | null = null
    ) => {
      if (clientRef.current && clientRef.current.active) {
        console.log(`[${type}] Connection already exists, skipping re-initialization.`);
        return;
      }

      console.log(`[${type}] Initializing STOMP client...`);
      clientRef.current = new Client();
      clientRef.current.configure({
        webSocketFactory: () => {
          console.log(`[${type}] Creating SockJS connection...`);
          return new SockJS('https://app.cricshub.com/ws');
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        // debug: (str) => console.log(`[${type}] DEBUG: ${str}`),
      });

      clientRef.current.onConnect = (frame) => {
        updateConnectionState(type, true);
        reconnectAttempts.current = 0;

        if (type === 'live' && matchId) {
          clientRef.current?.subscribe(`/topic/match/${matchId}`, (message: IMessage) => {
            try {
              const parsed = JSON.parse(message.body);

              if (!parsed.eventName || !parsed.payload) {
                console.error('Invalid message format', parsed);
                return;
              }

              const { eventName, payload } = parsed;
              setEnableScoreButton(true);

              switch (eventName) {
                case 'ball-update':
                  console.log('Ball update:', payload);
                  matchStateUpdateHandler(payload);
                  break;

                case 'match-complete':
                  console.log('Match complete:', payload);
                  liveSocketRef.current?.close();
                  stompLiveClientRef.current?.deactivate();
                  stompSubmitClientRef.current?.deactivate();
                  canReconnectRef.current = false;
                  navigation.navigate('MatchScoreCard', { matchId: payload.matchId });
                  break;

                case 'innings-complete':
                  console.log('Innings complete:', payload);
                  matchStateUpdateHandler(payload);
                  liveSocketRef.current?.close();
                  stompLiveClientRef.current?.deactivate();
                  stompSubmitClientRef.current?.deactivate();
                  canReconnectRef.current = false;
                  setSecondInningsStartInfoModal(true);
                  newBowlerSelectionRef.current = false;
                  setModals((prev) => ({ ...prev, nextBowler: false }));
                  setTimeout(() => {
                    setSecondInningsStartInfoModal(false);
                    setModals({
                      bye: false,
                      wide: false,
                      wicket: false,
                      nextBatsman: false,
                      nextBowler: false,
                      noBall: false,
                      startNextInnings: true,
                      catch: false,
                      runout: false,
                      fielderSelect: false,
                    });
                  }, 12000);
                  break;

                case 'second-innings-started':
                  console.log('Second innings started:', payload);
                  matchStateUpdateHandler(payload);
                  break;

                default:
                  console.warn('Unknown event type:', eventName, payload);
              }
            } catch (error) {
              console.error('Error processing live message:', error, message.body);
            }
          });
        }
      };

      clientRef.current.onStompError = (frame) => {
        console.error(`[${type}] STOMP error:`, frame.headers?.message || frame);
        updateConnectionState(type, false);
      };

      clientRef.current.onWebSocketClose = (event) => {
        console.warn(`[${type}] WebSocket closed:`, event);
        updateConnectionState(type, false);
        console.log(canReconnectRef.current);

        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS && canReconnectRef.current === true) {
          reconnectAttempts.current++;
          console.log(`[${type}] Attempting reconnect (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
          setTimeout(() => clientRef.current?.activate(), 5000);
        }
      };

      clientRef.current.onDisconnect = () => {
        console.log(`[${type}] STOMP disconnected`);
        updateConnectionState(type, false);
      };

      clientRef.current.activate();
    };

    return { submitConnected, liveConnected, setupClient };
  };

  useEffect(() => {
    console.log('[WS] Setting up sockets for match:', matchId);
    setupClient(stompLiveClientRef, 'live', matchId);
    setupClient(stompSubmitClientRef, 'submit');

    return () => {
      console.log('[WS] Cleaning up connections...');
      stompLiveClientRef.current?.deactivate();
      stompSubmitClientRef.current?.deactivate();
    };
  }, [matchId]);

  const getMatchState = async () => {
    setEnableScoreButton(false);
    newBowlerSelectionRef.current = false;
    setModals({
      bye: false,
      catch: false,
      fielderSelect: false,
      nextBatsman: false,
      nextBowler: false,
      noBall: false,
      runout: false,
      startNextInnings: false,
      wicket: false,
      wide: false,
    })
    try {
      const { success, data, error } = await apiService({
        endpoint: `matches/matchstate/${matchId}`,
        method: 'GET',
      });

      if (!success) {
        console.log("Error fetching match state:", error);
        return;
      }

      console.log(data);

      setMatchId(data.matchId);

      setBowler({
        id: data?.currentBowler?.playerId,
        name: getInitials(data?.currentBowler?.name),
        overs: data?.bowlingTeam?.playingXI?.find(p => p.playerId === data?.currentBowler?.playerId)?.overs || 0,
        runsConceded: data?.bowlingTeam?.playingXI?.find(p => p.playerId === data?.currentBowler?.playerId)?.runsConceded || 0,
        wickets: data?.bowlingTeam?.playingXI?.find(p => p.playerId === data?.currentBowler?.playerId)?.wicketsTaken || 0
      });

      setStriker({
        id: data?.currentStriker?.playerId,
        name: getInitials(data?.currentStriker?.name),
        runs: data?.battingTeam?.playingXI?.find(p => p.playerId === data?.currentStriker?.playerId)?.runs || 0,
        ballsFaced: data?.battingTeam?.playingXI?.find(p => p.playerId === data?.currentStriker?.playerId)?.ballsFaced || 0
      });

      setNonStriker({
        id: data?.currentNonStriker?.playerId,
        name: getInitials(data?.currentNonStriker?.name),
        runs: data?.battingTeam?.playingXI?.find(p => p.playerId === data?.currentNonStriker?.playerId)?.runs || 0,
        ballsFaced: data?.battingTeam?.playingXI?.find(p => p.playerId === data?.currentNonStriker?.playerId)?.ballsFaced || 0
      });

      if (data.currentStriker?.id === null || data.currentNonStriker?.id === null || data.currentStriker === null || data.currentNonStriker === null)
        setCanSelectBatsman(true);

      setCompletedOvers(data?.completedOvers || 0);
      setScore(data?.battingTeam?.score || 0);
      setWicket(data?.battingTeam?.wickets || 0);
      setBattingTeamName(data.battingTeam.name);

      const formattedOverDetails =
        data?.currentOver?.map((ball) => {
          let event = ball.runs?.toString() || "0";
          if (ball.wicket) event += 'W';
          if (ball.noBall) event += 'NB';
          if (ball.wide) event += 'Wd';
          if (ball.bye) event += 'B';
          if (ball.legBye) event += 'LB';
          return event.trim();
        }) || [];

      setOverDetails(formattedOverDetails.join(" "));

      const deliveryCount =
        data.currentOver?.reduce((count, ball) => {
          return count + (ball.noBall || ball.wide ? 0 : 1);
        }, 0) || 0;

      legalDeliveriesRef.current = deliveryCount;
      setLegalDeliveries(deliveryCount);

      if (
        data.completedOvers !== 0 &&
        deliveryCount === 0 &&
        data.completedOvers !== data.totalOvers
      ) {
        setOverDetails("");
        newBowlerSelectionRef.current = true;
        setModals((prev) => ({ ...prev, nextBowler: true }));
      };

      if (data.completedOvers === data.totalOvers && data.firstInnings === true) {
        newBowlerSelectionRef.current = false;
        setModals({ ...modals, startNextInnings: true, nextBowler: false });
      }
    } catch (error) {
      console.log("Error fetching match state:", error);
    } finally {
      setEnableScoreButton(true);
    }
  };

  const getTeamPlayingXI = async () => {
    try {
      const bowling = await apiService({
        endpoint: `matches/${matchId}/playingXI/bowling`,
        method: 'GET',
      });
      setBowlingPlayingXI(bowling.data);
      const batting = await apiService({
        endpoint: `matches/${matchId}/playingXI/batting`,
        method: 'GET',
      });
      setBattingPlayingXI(batting.data);
      console.log("Bowling");
      console.log(bowling.data);
      console.log("Batting");
      console.log(batting.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMatchState();
    getTeamPlayingXI();
  }, []);

  const scoringOptions = ['0', '1', '2', '3', '4', '6'];

  const extrasOptions = [
    { key: 'Wd', value: 'Wide' },
    { key: 'B', value: 'Bye' },
    { key: 'LB', value: 'Leg Bye' },
    { key: 'NB', value: 'No Ball' },
    { key: 'W', value: 'Wicket' },
    { key: 'Undo', value: 'Undo' }
  ];

  const undoHandler = async () => {
    try {
      const { success, data, error } = await apiService({
        endpoint: `matches/${matchId}/undo-last-ball`,
        method: 'POST',
        body: {},
      });

      if (!success) {
        console.log("Undo failed:", error);
        return;
      }

      console.log("Undo successful:", data);
    } catch (err) {
      console.log("Unexpected error during undo:", err);
    }
    getMatchState();
  };

  const handleExtrasWicketSelection = (value) => {
    setEnableScoreButton(false);
    if (value === 'Wide') {
      setModals({ ...modals, wide: true });
    } else if (value === 'Bye') {
      setModals({ ...modals, bye: true });
    } else if (value === 'Leg Bye') {
      handleSubmit({ runs: parseInt(byeExtra || '0'), legBye: true });
    } else if (value === 'No Ball') {
      setModals({ ...modals, noBall: true });
    } else if (value === 'Wicket') {
      setModals({ ...modals, wicket: true });
    } else if (value === 'Undo') {
      undoHandler();
    }
  };

  const handleNextBatsmanSelection = async (selectedPlayer) => {
    if (!selectedPlayer) {
      Alert.alert('Error', 'Please select a batsman first');
      return;
    }
    setCanSelectBatsman(false);

    if (striker.id === selectedPlayer.playerId) {
      setStriker({ id: null, name: null, runs: 0, ballsFaced: 0 });
    } else {
      setNonStriker({ id: null, name: null, runs: 0, ballsFaced: 0 });
    }
    setModals({ ...modals, nextBatsman: false });

    const { success, error } = await apiService({
      endpoint: `matches/${matchId}/next-batsman/${selectedPlayer.playerId}`,
      method: 'POST',
      body: {},
    });

    await getMatchState();

    if (!success) {
      console.error("Error updating next batsman:", error);
      Alert.alert("Error", "Failed to update next batsman.");
    }
  };

  const selectNextBowler = async (playerId, playerName) => {
    const { success, error } = await apiService({
      endpoint: `matches/${matchId}/next-bowler/${playerId}`,
      method: 'POST',
      body: {},
    });

    if (!success) {
      console.error("Error selecting next bowler:", error);
      Alert.alert("Error", "Failed to update next bowler.");
      return;
    }

    // Reset the new bowler's stats
    setBowler({ id: playerId, name: playerName, overs: 0, runsConceded: 0, wickets: 0 })
    setOverDetails("");
    setLegalDeliveries(0);
    newBowlerSelectionRef.current = false;
    setModals((prev) => ({ ...prev, nextBowler: false }));
  };

  const catchHandler = () => {
    console.log('Selected Catcher:', selectedCatcher);

    handleSubmit({
      runs: 0,
      wicket: true,
      wicketType: 'Caught',
      catcherId: selectedCatcher, // just pass the string ID
    });

    setAvailableBatsmen(battingPlayingXI);
    setWicketType('');
    setSelectedCatcher(null);

    setModals((prev) => ({ ...prev, catch: false }));

    setTimeout(() => {
      if (wicket < 9 || modals.startNextInnings === false) {
        setModals((prev) => ({ ...prev, nextBatsman: true }));
      }
    }, 10000);
  };

  const wicketHandler = (value) => {
    console.log("Wicket giraa");

    setWicketType(value);
    handleSubmit({
      runs: 0,
      wicket: true,
      wicketType: value,
    });
    setAvailableBatsmen(battingPlayingXI);
    setWicketType('');

    setModals((prev) => ({ ...prev, wicket: false }));
    setTimeout(() => {
      if (wicket < 9) {
        setModals((prev) => ({ ...prev, nextBatsman: true }));
      }
    }, 10000);
  };

  const waitForSubmitConnection = async (checkConnectedState, timeout = 5000) => {
    const interval = 100;
    let waited = 0;

    return new Promise((resolve, reject) => {
      const check = () => {
        if (checkConnectedState()) {
          resolve(true);
        } else if (waited >= timeout) {
          reject(new Error('STOMP submit connection timeout'));
        } else {
          waited += interval;
          setTimeout(check, interval);
        }
      };
      check();
    });
  };

  const submitScore = async (data, isConnectedFn) => {
    const payload = {
      matchId,
      tournamentId: null,
      strikerId: striker.id,
      bowlerId: bowler.id,
      wicketType: data.wicketType || '',
      shotType: data.shotType || '',
      direction: data.direction || '',
      runs: data.runs || 0,
      battingFirst: true,
      wide: data.wide || false,
      noBall: data.noBall || false,
      bye: data.bye || false,
      legBye: data.legBye || false,
      wicket: data.wicket || false,
      freeHit: false,
      catcherId: selectedCatcher || null,
      runOutMakerId: data.runOutMakerId || null,
      runOutGetterId: data.runOutGetterId || null,
    };

    try {
      await waitForSubmitConnection(isConnectedFn);

      if (!stompSubmitClientRef.current || !stompSubmitClientRef.current.connected) {
        throw new Error('STOMP submit client not connected');
      }

      const userId = await AsyncStorage.getItem('userUUID');
      stompSubmitClientRef.current.publish({
        destination: `/app/match/${matchId}/ball`,
        body: JSON.stringify(payload),
        headers: { 'content-type': 'application/json', 'userId': userId || '' },
      });

      console.log('[Submit] Score published successfully');

      return true;
    } catch (error) {
      console.error('[Submit] Publish error:', error);
      Alert.alert('Submission Error', 'Failed to submit score. Please wait for connection.');
      return false;
    }
  };

  const handleStartSecondInnings = async () => {
    const { success, error } = await apiService({
      endpoint: `matches/matches/${matchId}/start-second-innings`,
      method: 'POST',
      body: {},
    });

    if (success) {
      newBowlerSelectionRef.current = false;
      setModals({ ...modals, startNextInnings: false, nextBowler: false });
      getTeamPlayingXI();
      navigation.navigate('SelectRoles', { matchId, isFirstInnings: false });
    } else {
      console.error('Start second innings error:', error);
      Alert.alert('Error', 'Failed to start second innings');
    }
  };

  const { submitConnected, setupClient } = useStompConnection();

  const handleSubmit = async (data) => {
    await submitScore(data, () => submitConnected); // 🔥 pass state as a function
  };

  const handleWicketTypeSelection = async () => {
    if (!wicketType) {
      Alert.alert('Error', 'Please select a wicket type.');
      return;
    }
    setModals({ ...modals, wicket: false, nextBatsman: true });
    const response = await apiService({
      endpoint: `matches/${matchId}/batting-available`,
      method: 'GET',
    });
    setAvailableBatsmen(response.data.data);
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000000', '#0A303B', '#36B0D5']} style={styles.gradient}>
        <ImageBackground source={bg} resizeMode="cover" style={styles.background} imageStyle={styles.backgroundImage}>
          <View style={styles.scoreCard}>
            <View style={styles.scoreContainer}>
              <Text style={styles.teamName}>{battingTeamName}</Text>
              <Text style={styles.scoreText}>
                {score}/{wicket} ({completedOvers}.{legalDeliveries})
              </Text>
            </View>
          </View>
        </ImageBackground>
      </LinearGradient>

      {/* Player Info Section */}
      <View style={styles.playerInfoContainer}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerText}>{striker?.name}* - <Text style={styles.playerStats}>{striker?.runs}({striker?.ballsFaced})</Text></Text>
          <Text style={styles.playerText}>{nonStriker?.name} - <Text style={styles.playerStats}>{nonStriker?.runs}({nonStriker?.ballsFaced})</Text></Text>
        </View>
        <View style={styles.bowlerInfo}>
          <Text style={styles.playerText}>Over: {overDetails}</Text>
          <Text style={styles.playerText}>{bowler.name} - {bowler.wickets}/{bowler.runsConceded}</Text>
        </View>
      </View>
      <View style={styles.scoringOptions}>
        <FlatList
          data={scoringOptions}
          numColumns={3}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              disabled={!enableScoreButton}
              style={[styles.runButton, !enableScoreButton && styles.disabledButton]}
              onPress={() => handleRunSelection(item)}
            >
              <Text style={styles.runText}>{item}</Text>
            </Pressable>
          )}
        />
        <FlatList
          data={extrasOptions}
          numColumns={3}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.runButton, !enableScoreButton && styles.disabledButton]}
              onPress={() => handleExtrasWicketSelection(item.value)}
              disabled={!enableScoreButton}
            >
              <Text style={styles.runText}>{item.key}</Text>
            </Pressable>
          )}
        />
      </View>

      <Modal visible={shotModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable onPress={() => setShotModalVisible(false)}>
              <MaterialIcons name='cancel' color='black' size={20} style={{ textAlign: 'right' }} />
            </Pressable>
            <Text style={styles.modalTitle}>Select Shot Type</Text>
            <FlatList
              data={cricketShots}
              numColumns={3}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.shotOption}
                  onPress={() => handleShotSelection(item)}
                >
                  <Image
                    source={shotImages[item]}
                    style={styles.shotImage}
                    resizeMode="contain"
                  />

                  <Text style={styles.shotText}>{item}</Text>
                </Pressable>
              )}
            />
            <Pressable
              style={styles.cancelButton}
              onPress={() => setShotModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={directionModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable
              onPress={() => setDirectionModalVisible(false)}
            >
              <MaterialIcons
                name='cancel'
                color='black'
                size={20}
                style={{ textAlign: 'right' }}
              />
            </Pressable>
            <Text style={styles.modalTitle}>Select Shot Direction</Text>
            <View style={styles.wagonWheelContainer}>
              <View style={styles.circleBackground} />
              {directions?.map((direction, index) => {
                const angleInRadians = (direction.angle * Math.PI) / 180;
                const x = center + radius * Math.cos(angleInRadians) - 40;
                const y = center + radius * Math.sin(angleInRadians) - 20;

                return (
                  <Pressable
                    key={index}
                    style={[
                      styles.directionButton,
                      { top: y, left: x },
                    ]}
                    onPress={() => handleDirectionSelection(direction.name)}
                  >
                    <Text style={styles.directionText}>{direction.name}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setDirectionModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={modals.wide} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable
              onPress={() => setModals({ ...modals, wide: false })}
            >
              <MaterialIcons
                name='cancel'
                color='black'
                size={20}
                style={{ textAlign: 'right' }}
              />
            </Pressable>
            <Text>Wide Runs:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={wideExtra}
              onChangeText={setWideExtra}
            />
            <Pressable
              style={styles.submitButton}
              onPress={() => {
                setModals({ ...modals, wide: false });
                handleSubmit({ runs: parseInt(wideExtra || '0'), wide: true });
                setWideExtra('0');
              }}
            >
              <Text style={styles.submitText}>Submit</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* No-ball Modal */}
      <Modal visible={modals.noBall} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable
              onPress={() => setModals({ ...modals, noBall: false })}
            >
              <MaterialIcons
                name='cancel'
                color='black'
                size={20}
                style={{ textAlign: 'right' }}
              />
            </Pressable>
            <Text>No ball runs:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={noBallExtra}
              onChangeText={setNoBallExtra}
            />
            <Pressable
              style={styles.submitButton}
              onPress={() => {
                setModals({ ...modals, noBall: false });
                handleSubmit({ runs: parseInt(noBallExtra || '0'), noBall: true });
                setNoBallExtra('0');
              }}
            >
              <Text style={styles.submitText}>Submit</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={modals.bye} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable
              onPress={() => setModals({ ...modals, bye: false })}
            >
              <MaterialIcons
                name='cancel'
                color='black'
                size={20}
                style={{ textAlign: 'right' }}
              />
            </Pressable>
            <Text>Bye/Leg Bye Runs:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={byeExtra}
              onChangeText={setByeExtra}
            />
            <Pressable
              style={styles.submitButton}
              onPress={() => {
                setModals({ ...modals, bye: false });
                handleSubmit({ runs: parseInt(byeExtra || '0'), bye: true });
              }}
            >
              <Text style={styles.submitText}>Submit</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={modals.wicket} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable
              onPress={() => setModals({ ...modals, wicket: false })}
            >
              <MaterialIcons
                name='cancel'
                color='black'
                size={20}
                style={{ textAlign: 'right' }}
              />
            </Pressable>
            <Text>Select Wicket Type:</Text>

            <Picker
              selectedValue={wicketType}
              onValueChange={(itemValue) => {
                if (itemValue === 'Catch') {
                  setWicketType('Catch');
                  setModals((prev) => ({ ...prev, wicket: false, catch: true }));
                } else if (itemValue === 'Run Out') {
                  setWicketType('Run Out');
                  setModals((prev) => ({ ...prev, wicket: false, runout: true }));
                } else {
                  wicketHandler(itemValue);
                }
              }}

              style={styles.picker}
            >
              <Picker.Item label="Select Wicket Type" value="" />
              <Picker.Item label="Bowled" value="Bowled" />
              <Picker.Item label="Catch" value="Catch" />
              <Picker.Item label="Run Out" value="Run Out" />
              <Picker.Item label="Stump" value="Stump" />
              <Picker.Item label="LBW" value="LBW" />
            </Picker>

            <Pressable
              style={styles.submitButton}
              onPress={() => handleWicketTypeSelection()}
            >
              <Text style={styles.submitText}>Submit</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={modals.nextBatsman && canSelectBatsman} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable
              onPress={() => setModals({ ...modals, nextBatsman: false })}
            >
              <MaterialIcons
                name='cancel'
                color='black'
                size={20}
                style={{ textAlign: 'right' }}
              />
            </Pressable>
            <Text style={styles.modalTitle}>Select Next Batsman</Text>

            <Picker
              selectedValue={selectedBatsman?.playerId}
              onValueChange={(itemValue) => {
                const selectedPlayer = availableBatsmen.find(player => player.playerId === itemValue);
                setSelectedBatsman(selectedPlayer);
                handleNextBatsmanSelection(selectedPlayer);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select Batsman" value="" />
              {availableBatsmen?.map((batsman) => (
                <Picker.Item key={batsman.playerId} label={batsman?.name} value={batsman?.playerId} />
              ))}
            </Picker>

            <Pressable
              style={styles.submitButton}
              onPress={async () => {
                if (!selectedBatsman) {
                  Alert.alert('Error', 'Please select a batsman.');
                  return;
                }

                // setStrikerId(selectedBatsman.playerId);
                // setStrikerName(selectedBatsman?.name);
                setModals({ ...modals, nextBatsman: false });
              }}
            >
              <Text style={styles.submitText}>Confirm Batsman</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={newBowlerSelectionRef.current} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable
              // onPress={() => setModals({ ...modals, nextBowler: false })}
              onPress={() => newBowlerSelectionRef.current = false}
            >
              <MaterialIcons
                name='cancel'
                color='black'
                size={20}
                style={{ textAlign: 'right' }}
              />
            </Pressable>
            <Text style={styles.modalTitle}>Select Next Bowler</Text>

            <Picker
              selectedValue={selectedBowler?.playerId}
              onValueChange={(itemValue) => {
                const selectedPlayer = bowlingPlayingXI.find(player => player.playerId === itemValue);
                setSelectedBowler(selectedPlayer);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select Bowler" value="" />
              {bowlingPlayingXI?.map((bowler) => (
                <Picker.Item key={bowler.playerId} label={bowler?.name} value={bowler?.playerId} />
              ))}
            </Picker>

            <Pressable
              style={styles.submitButton}
              onPress={() => {
                if (!selectedBowler?.playerId) {
                  Alert.alert('Error', 'Please select a bowler.');
                  return;
                }
                selectNextBowler(selectedBowler.playerId, selectedBowler.name);
              }}
            >
              <Text style={styles.submitText}>Confirm Bowler</Text>
            </Pressable>

          </View>
        </View>
      </Modal>
      {/* Catcher Modal */}
      <Modal visible={modals.catch} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable
              onPress={() => setModals({ ...modals, catch: false })}
            >
              <MaterialIcons
                name='cancel'
                color='black'
                size={20}
                style={{ textAlign: 'right' }}
              />
            </Pressable>
            <Text style={styles.modalTitle}>Select Catcher</Text>

            <Picker
              selectedValue={selectedCatcher}
              onValueChange={(itemValue) => {
                console.log(itemValue);
                setSelectedCatcher(itemValue);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select Catcher" value="" />
              {bowlingPlayingXI?.map((fielder) => (
                <Picker.Item key={fielder.playerId} label={fielder?.name} value={fielder.playerId} />
              ))}
            </Picker>

            <Pressable
              style={styles.submitButton}
              onPress={() => {
                if (!selectedCatcher) {
                  Alert.alert('Error', 'Please select the catcher.');
                  return;
                }
                catchHandler();
              }}
            >
              <Text style={styles.submitText}>Confirm Catcher</Text>
            </Pressable>

          </View>
        </View>
      </Modal>

      {/* Run Out - Step 1: Who got out */}
      <Modal visible={modals.runout} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable
              onPress={() => setModals({ ...modals, runout: false })}
            >
              <MaterialIcons
                name='cancel'
                color='black'
                size={20}
                style={{ textAlign: 'right' }}
              />
            </Pressable>
            <Text style={styles.modalTitle}>Who got run out?</Text>
            <Pressable
              style={styles.submitButton}
              onPress={() => {
                setRunOutGetterId(striker.id);
                setModals((prev) => ({ ...prev, runout: false, fielderSelect: true }));
              }}
            >
              <Text>{striker.name} (Striker)</Text>
            </Pressable>

            <Pressable
              style={styles.submitButton}
              onPress={() => {
                setRunOutGetterId(nonStriker.id);
                setModals((prev) => ({ ...prev, runout: false, fielderSelect: true }));
              }}
            >
              <Text>{nonStriker.name} (Non-Striker)</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Run Out - Step 2: Fielder Involved */}
      <Modal visible={modals.fielderSelect} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable
              onPress={() => setModals({ ...modals, fielderSelect: false })}
            >
              <MaterialIcons
                name='cancel'
                color='black'
                size={20}
                style={{ textAlign: 'right' }}
              />
            </Pressable>

            <Text style={styles.modalTitle}>Select Fielder</Text>
            <Picker
              selectedValue={runOutFielderId}
              onValueChange={(itemValue) => setRunOutFielderId(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Fielder" value="" />
              {bowlingPlayingXI?.map((fielder) => (
                <Picker.Item
                  key={fielder.playerId}
                  label={fielder.name}
                  value={fielder.playerId}
                />
              ))}
            </Picker>

            {/* 🔥 Add TextInput for runs */}
            <Text style={{ marginTop: 10 }}>Runs Scored:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={runOutRuns}
              onChangeText={setRunOutRuns}
              placeholder="Enter runs"
            />

            <Pressable
              style={styles.submitButton}
              onPress={() => {
                if (!runOutFielderId) {
                  Alert.alert('Error', 'Please select a fielder.');
                  return;
                }

                const runs = parseInt(runOutRuns || '0');

                // Call score handler with runs included
                handleSubmit({
                  runs: runs,
                  wicket: true,
                  wicketType: 'Run Out',
                  runOutGetterId: runOutGetterId,
                  runOutMakerId: runOutFielderId,
                });

                setAvailableBatsmen(battingPlayingXI);
                setRunOutRuns('0');
                setModals((prev) => ({ ...prev, fielderSelect: false }));

                setTimeout(() => {
                  if (wicket < 9) {
                    setModals((prev) => ({ ...prev, nextBatsman: true }));
                  }
                }, 10000);
              }}
            >
              <Text style={styles.submitText}>Confirm Run Out</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* No-ball Modal */}
      <Modal visible={modals.startNextInnings} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable
              onPress={() => setModals({ ...modals, startNextInnings: false })}
            >
              <MaterialIcons
                name='cancel'
                color='black'
                size={20}
                style={{ textAlign: 'right' }}
              />
            </Pressable>
            <Text style={styles.modalTitle}>Start second innings?</Text>
            <Pressable
              style={styles.submitButton}
              onPress={() => handleStartSecondInnings()}
            >
              <Text style={styles.submitText}>Yes</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={secondInningsStartInfoModal} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable
              onPress={() => setSecondInningsStartInfoModal(false)}
            >
              <MaterialIcons
                name='cancel'
                color='black'
                size={20}
                style={{ textAlign: 'right' }}
              />
            </Pressable>
            <Text style={styles.infoTextHeading}>1st Innings completed</Text>
            <Text style={styles.infoText}>You can either start the second innings right away.</Text>
            <Text style={styles.infoText}>Or, later the scorer can visit the live matches under the matches tab.</Text>
            <Text style={styles.infoText}>Please wait while we process the match data.</Text>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default ScoringScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  gradient: {
    flex: 1,
  },
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImage: {
    resizeMode: 'cover',
    opacity: 0.8,
  },
  scoreCard: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    width: '100%',
    padding: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  playerInfoContainer: {
    backgroundColor: '#002233',
    padding: 15,
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bowlerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playerText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  playerStats: {
    fontSize: 14,
    color: '#FFD700',
  },
  scoringOptions: {
    backgroundColor: '#002233',
    padding: 10,
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  runButton: {
    flex: 1,
    margin: 5,
    backgroundColor: '#36B0D5',
    borderRadius: 8,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: AppColors.gray,
  },
  runText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },

  input: {
    backgroundColor: '#e7e7e7',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  submitButton: {
    backgroundColor: '#36B0D5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  picker: {
    width: '100%',
    backgroundColor: '#e9e9e9',
    borderRadius: 8,
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  shotOption: {
    flex: 1,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  shotImage: {
    width: 60,
    height: 60,
    marginBottom: 5,
    backgroundColor: 'transparent',
  },
  shotText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FF4757',
    fontWeight: 'bold',
  },
  wagonWheelContainer: {
    width: 300,
    height: 300,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBackground: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#4CAF50',
    position: 'absolute',
  },
  directionButton: {
    position: 'absolute',
    width: 80,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  directionText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoTextHeading: {
    fontSize: 18,
    color: 'black',
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: 'bold'
  },
  infoText: {
    fontSize: 16,
    color: AppColors.infoGrey,
  }
});