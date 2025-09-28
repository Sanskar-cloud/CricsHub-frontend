import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Client } from '@stomp/stompjs';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import SockJS from 'sockjs-client';
import apiService from '../../APIservices';
const waitingAnimation = require('../../../assets/animations/Waiting P.json');

const { width, height } = Dimensions.get('window');
const background = require('../../../assets/images/cricsLogo.png');
const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);
const AppColors = {
  white: "#FFFFFF",
  black: "#000000",
  blue: "#3498DB",
  background: "#F8F9FA",
  cardBorder: "rgba(255, 255, 255, 0.2)",
  error: "#E74C3C",
  darkBlue: "#1F2A44",
  lightText: "#AAB0C6",
  green: "#2ecc71",
  yellow: "#f39c12",
  red: "#e74c3c"
};

const AppGradients = {
  primaryCard: ["#34B8FF", "#0575E6"],
  secondaryCard: ["#6C5CE7", "#3498DB"],
  header: ["#1F2A44", "#162036"],
  tabActive: ["#3498DB", "#2c3e50"],
  shimmer: ['#F0F0F0', '#E0E0E0', '#F0F0F0'],
};

// Shimmer card component for the loading state
const ShimmerCard = () => (
  <View style={styles.shimmerContainer}>
    {/* Header Placeholder */}
    <View style={styles.shimmerHeaderPlaceholder}>
      <ShimmerPlaceholder style={styles.shimmerHeaderTitle} />
    </View>

    {/* Scorecard Placeholder */}
    <View style={styles.shimmerScorecardPlaceholder}>
      <View style={styles.shimmerTeamScore}>
        <ShimmerPlaceholder style={styles.shimmerTeamName} />
        <ShimmerPlaceholder style={styles.shimmerTeamRuns} />
      </View>
      <View style={styles.shimmerVs} />
      <View style={styles.shimmerTeamScore}>
        <ShimmerPlaceholder style={styles.shimmerTeamName} />
        <ShimmerPlaceholder style={styles.shimmerTeamRuns} />
      </View>
      <View style={styles.shimmerPlayerInfo}>
        <ShimmerPlaceholder style={styles.shimmerPlayerName} />
        <ShimmerPlaceholder style={styles.shimmerPlayerRuns} />
      </View>
    </View>

    {/* Tabs Placeholder */}
    <View style={styles.shimmerTabsPlaceholder}>
      <ShimmerPlaceholder style={styles.shimmerTabButton} />
      <ShimmerPlaceholder style={styles.shimmerTabButton} />
    </View>

    {/* Table Placeholder (3 rows) */}
    <View style={styles.shimmerTableContainer}>
      <View style={styles.shimmerTableHeader}>
        <ShimmerPlaceholder style={styles.shimmerTableText} />
        <ShimmerPlaceholder style={styles.shimmerTableTextSmall} />
      </View>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.shimmerTableRow}>
          <ShimmerPlaceholder style={styles.shimmerTablePlayer} />
          <ShimmerPlaceholder style={styles.shimmerTableStat} />
          <ShimmerPlaceholder style={styles.shimmerTableStat} />
          <ShimmerPlaceholder style={styles.shimmerTableStat} />
          <ShimmerPlaceholder style={styles.shimmerTableStat} />
        </View>
      ))}
    </View>
  </View>
);

const CommentaryScorecard = ({ route, navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matchId, setMatchId] = useState(route.params.matchId);
  const [bowler, setBowler] = useState({ id: null, name: null, overs: 0, runsConceded: 0, wickets: 0, economyRate: 0.0 });
  const [striker, setStriker] = useState({ id: null, name: null, runs: 0, ballsFaced: 0, strikeRate: 0.0 });
  const [nonStriker, setNonStriker] = useState({ id: null, name: null, runs: 0, ballsFaced: 0, strikeRate: 0.0 });
  const [battingScore, setbattingScore] = useState(null);
  const [bowlingTeamName, setBowlingTeamName] = useState(null);
  const [battingTeamName, setBattingTeamName] = useState(null);
  const [bowlingTeamScore, setBowlingTeamScore] = useState(null);
  const [bowlingTeamWickets, setBowlingTeamWickets] = useState(null);
  const [totalOvers, setTotalOvers] = useState(null);
  const [battingWicket, setbattingWicket] = useState(null);
  const [showWaitingAnimation, setShowWaitingAnimation] = useState(true);
  const [completedOvers, setCompletedOvers] = useState(0);
  const [overDetails, setOverDetails] = useState("");
  const legalDeliveriesRef = useRef(0);
  const [legalDeliveries, setLegalDeliveries] = useState(0);
  const [battingFirst, setBattingFirst] = useState(null);
  const [battingSecond, setBattingSecond] = useState(null);
  const [bowlingFirst, setBowlingFirst] = useState(null);
  const [bowlingSecond, setBowlingSecond] = useState(null);
  const [battingFirstOvers, setBattingFirstOvers] = useState(null);
  const [battingSecondOvers, setBattingSecondOvers] = useState(null);
  const [battingFirstTeamName, setBattingFirstTeamName] = useState(null);
  const [battingSecondTeamName, setBattingSecondTeamName] = useState(null);
  const [activeTab, setActiveTab] = useState('scorecard');
  const [innings, setInnings] = useState("1st");
  const [subTab, setSubTab] = useState("Batting");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const stompLiveClientRef = useRef(null);
  const stompSubmitClientRef = useRef(null);
  const [scorecardCache, setScorecardCache] = useState({});
  const [showScoreCard, setShowScoreCard] = useState(false);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const dedupeByPlayer = (arr = []) => {
    const map = new Map();
    for (const item of arr) {
      const key = item?.playerId || item?.id || item?.name;
      map.set(key, item);
    }
    return Array.from(map.values());
  };

  const mergeBattingData = (battingOrder = [], playingXI = []) => {
    if (!Array.isArray(battingOrder) || !Array.isArray(playingXI)) return [];

    const orderedPlayers = battingOrder.map((bat) => {
      const stats = playingXI.find((p) => p.playerId === bat.playerId);
      return {
        ...bat,
        ...stats,
        wicketDetails: stats?.wicketDetails || null,
      };
    });

    const yetToBat = playingXI
      .filter((p) => !battingOrder.find((bat) => bat.playerId === p.playerId))
      .map((p) => ({
        ...p,
        wicketDetails: null,
      }));

    return [...orderedPlayers, ...yetToBat];
  };

  const safeNumber = (n, d = 0) => (Number.isFinite(n) ? n : d);

  const ballsToOvers = (balls) => {
    const b = safeNumber(balls, 0);
    const ov = Math.floor(b / 6);
    const r = b % 6;
    return `${ov}.${r}`;
  };

  const economy = (runsConceded, ballsBowled) => {
    const r = safeNumber(runsConceded, 0);
    const b = safeNumber(ballsBowled, 0);
    if (b === 0) return '0.00';
    const ov = b / 6;
    return (r / ov).toFixed(1);
  };

  const strikeRateCalc = (runs, balls) => {
    const r = safeNumber(runs, 0);
    const b = safeNumber(balls, 0);
    if (b === 0) return '0.00';
    return ((r * 100) / b).toFixed(0);
  };

  const dismissalText = (wicketDetails) => {
    if (!wicketDetails) return 'not out';
    const { dismissalType, bowlerId, catcherId, runOutMakerId } = wicketDetails || {};
    if (!dismissalType) return 'not out';
    switch ((dismissalType || '').toLowerCase()) {
      case 'bowled':
        return `b ${bowlerId.name}`;
      case 'caught':
        return `c ${catcherId.name} b ${bowlerId.name}`;
      case 'lbw':
        return `LBW b ${bowlerId.name}`;
      case 'stumped':
        return `st b ${bowlerId.name}`;
      case 'run out':
      case 'runout':
        return `Run Out ${runOutMakerId.name}`;
      case 'hit wicket':
        return 'hit wicket';
      default:
        return dismissalType;
    }
  };

  const getMatchState = async () => {
    try {
      setLoading(true);
      setShowWaitingAnimation(true);
      const { success, data, error } = await apiService({
        endpoint: `matches/matchstate/${matchId}`,
        method: 'GET',
      });

      if (!success) {
        console.log("Error fetching match state:", error);
        return;
      }

      setShowScoreCard(false);

      setMatchId(data?.matchId);

      setBattingFirstTeamName(data?.battingTeam?.name);
      setBattingSecondTeamName(data?.bowlingTeam?.name);

      setBowler({
        id: data?.currentBowler?.playerId,
        name: data?.currentBowler?.name,
        overs: data?.bowlingTeam?.playingXI?.find(
          (p) => p.playerId === data?.currentBowler?.playerId
        )?.overs || 0,
        runsConceded: data?.bowlingTeam?.playingXI?.find(
          (p) => p.playerId === data?.currentBowler?.playerId
        )?.runsConceded || 0,
        wickets: data?.bowlingTeam?.playingXI?.find(
          (p) => p.playerId === data?.currentBowler?.playerId
        )?.wicketsTaken || 0,
        economyRate: data?.bowlingTeam?.playingXI?.find(
          (p) => p.playerId === data?.currentBowler?.playerId
        )?.economyRate || 0.0,
      });

      setStriker({
        id: data?.currentStriker?.playerId,
        name: data?.currentStriker?.name,
        runs: data?.battingTeam?.playingXI?.find(
          (p) => p.playerId === data?.currentStriker?.playerId
        )?.runs || 0,
        ballsFaced: data?.battingTeam?.playingXI?.find(
          (p) => p.playerId === data?.currentStriker?.playerId
        )?.ballsFaced || 0,
        strikeRate: data?.battingTeam?.playingXI?.find(
          (p) => p.playerId === data?.currentStriker?.playerId
        )?.strikeRate || 0.0,
      });

      setNonStriker({
        id: data?.currentNonStriker?.playerId,
        name: data?.currentNonStriker?.name,
        runs: data?.battingTeam?.playingXI?.find(
          (p) => p.playerId === data?.currentNonStriker?.playerId
        )?.runs || 0,
        ballsFaced: data?.battingTeam?.playingXI?.find(
          (p) => p.playerId === data?.currentNonStriker?.playerId
        )?.ballsFaced || 0,
        strikeRate: data?.battingTeam?.playingXI?.find(
          (p) => p.playerId === data?.currentNonStriker?.playerId
        )?.strikeRate || 0.0,
      });

      setCompletedOvers(data?.completedOvers || 0);
      setbattingScore(data?.battingTeam?.score || 0);
      setbattingWicket(data?.battingTeam?.wickets || 0);
      setBattingTeamName(data?.battingTeam?.name || "");
      setTotalOvers(data.totalOvers);

      setBowlingTeamName(data?.bowlingTeam?.name || "");
      setBowlingTeamScore(data?.bowlingTeam?.score || 0);
      setBowlingTeamWickets(data?.bowlingTeam?.wickets || 0);

      const formattedOverDetails =
        data?.currentOver?.map((ball) => {
          let event = ball.runs?.toString() || "0";
          if (ball.wicket) event += " W";
          if (ball.noBall) event += " NB";
          if (ball.wide) event += " Wd";
          if (ball.bye) event += " B";
          if (ball.legBye) event += " LB";
          return event.trim();
        }) || [];

      setOverDetails(formattedOverDetails.join(" "));

      const deliveryCount =
        data?.currentOver?.reduce((count, ball) => {
          return count + (ball.noBall || ball.wide ? 0 : 1);
        }, 0) || 0;

      legalDeliveriesRef.current = deliveryCount;
      setLegalDeliveries(deliveryCount);

      if (
        data?.completedOvers !== 0 &&
        deliveryCount === 0 &&
        data?.completedOvers !== data?.totalOvers
      ) {
        setOverDetails("");
      }

      setScorecardCache({
        [data?.team1?.name]: { batting: data?.team1BattingOrder, bowling: data?.team1BowlingOrder },
        [data?.team2?.name]: { batting: data?.team2BattingOrder, bowling: data?.team2BowlingOrder },
      });

      setBattingFirst(data?.team1BattingOrder);
      setBattingSecond(data?.team2BattingOrder);
      setBowlingFirst(data?.team1BowlingOrder);
      setBowlingSecond(data?.team2BowlingOrder);

      setBattingFirstOvers(data?.battingTeam?.overs);
      setBattingSecondOvers(data?.bowlingTeam?.overs);

    } catch (error) {
      console.log("Error fetching match state:", error);
    } finally {
      setLoading(false);
    }
  };

  const matchScoreCardUpdateHandler = (data) => {
    setShowScoreCard(true);
    setShowWaitingAnimation(false);
    setBattingFirst(data?.team1BattingOrder);
    setBattingSecond(data?.team2BattingOrder);
    setBowlingFirst(data?.team1BowlingOrder);
    setBowlingSecond(data?.team2BowlingOrder);

    setBattingFirstTeamName(data?.battingTeam?.name);
    setBattingSecondTeamName(data?.bowlingTeam?.name);

    setBowler({
      id: data?.currentBowler?.playerId,
      name: data?.currentBowler?.name,
      overs: data?.bowlingTeam?.playingXI?.find(
        (p) => p.playerId === data?.currentBowler?.playerId
      )?.overs || 0,
      runsConceded: data?.bowlingTeam?.playingXI?.find(
        (p) => p.playerId === data?.currentBowler?.playerId
      )?.runsConceded || 0,
      wickets: data?.bowlingTeam?.playingXI?.find(
        (p) => p.playerId === data?.currentBowler?.playerId
      )?.wicketsTaken || 0,
      economyRate: data?.bowlingTeam?.playingXI?.find(
        (p) => p.playerId === data?.currentBowler?.playerId
      )?.economyRate || 0.0,
    });

    setStriker({
      id: data?.currentStriker?.playerId,
      name: data?.currentStriker?.name,
      runs: data?.battingTeam?.playingXI?.find(
        (p) => p.playerId === data?.currentStriker?.playerId
      )?.runs || 0,
      ballsFaced: data?.battingTeam?.playingXI?.find(
        (p) => p.playerId === data?.currentStriker?.playerId
      )?.ballsFaced || 0,
      strikeRate: data?.battingTeam?.playingXI?.find(
        (p) => p.playerId === data?.currentStriker?.playerId
      )?.strikeRate || 0.0,
    });

    setNonStriker({
      id: data?.currentNonStriker?.playerId,
      name: data?.currentNonStriker?.name,
      runs: data?.battingTeam?.playingXI?.find(
        (p) => p.playerId === data?.currentNonStriker?.playerId
      )?.runs || 0,
      ballsFaced: data?.battingTeam?.playingXI?.find(
        (p) => p.playerId === data?.currentNonStriker?.playerId
      )?.ballsFaced || 0,
      strikeRate: data?.battingTeam?.playingXI?.find(
        (p) => p.playerId === data?.currentNonStriker?.playerId
      )?.strikeRate || 0.0,
    });

    const formattedOverDetails =
      data?.currentOver?.map((ball) => {
        let event = ball.runs?.toString() || "0";
        if (ball.wicket) event += "W";
        if (ball.noBall) event += "NB";
        if (ball.wide) event += "Wd";
        if (ball.bye) event += "B";
        if (ball.legBye) event += "LB";
        return event.trim();
      }) || [];

    setOverDetails(formattedOverDetails.join(" "));

    setCompletedOvers(data?.completedOvers || 0);
    setbattingScore(data?.battingTeam?.score || 0);
    setbattingWicket(data?.battingTeam?.wickets || 0);
    setBattingTeamName(data?.battingTeam?.name || "");
    setTotalOvers(data.totalOvers);

    setBowlingTeamName(data?.bowlingTeam?.name || "");
    setBowlingTeamScore(data?.bowlingTeam?.score || 0);
    setBowlingTeamWickets(data?.bowlingTeam?.wickets || 0);

    setBattingFirstOvers(data?.battingTeam?.overs);
    setBattingSecondOvers(data?.bowlingTeam?.overs);

    setScorecardCache(prevCache => ({
      ...prevCache,
      [data?.team1?.name]: { batting: data?.team1BattingOrder, bowling: data?.team1BowlingOrder },
      [data?.team2?.name]: { batting: data?.team2BattingOrder, bowling: data?.team2BowlingOrder },
    }));
  };

  const useStompConnection = () => {
    const [liveConnected, setLiveConnected] = useState(false);

    const updateConnectionState = (type, isConnected) => {
      if (type === 'live') setLiveConnected(isConnected);
    };

    const setupClient = (
      clientRef,
      type,
      matchId = null
    ) => {
      if (clientRef.current && clientRef.current.active) {
        return;
      }

      clientRef.current = new Client();
      clientRef.current.configure({
        webSocketFactory: () => new SockJS(`https://app.cricshub.com/ws`),
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
      });

      clientRef.current.onConnect = () => {
        updateConnectionState('live', true);

        if (type === 'live' && matchId) {
          clientRef.current?.subscribe(`/topic/match/${matchId}`, (message) => {
            try {
              const parsed = JSON.parse(message.body);
              if (!parsed.eventName || !parsed.payload) return;
              const { eventName, payload } = parsed;

              // switch (eventName) {
              //   case 'ball-update':
              //     matchScoreUpdateHandler(payload);
              //     matchScoreCardUpdateHandler(payload);
              //     break;
              //   case 'match-complete':
              //     navigation.navigate('MatchScoreCard', { matchId: payload.matchId });
              //     break;
              //   case 'innings-complete':
              //     matchScoreUpdateHandler(payload);
              //     break;
              //   case 'second-innings-started':
              //     matchScoreUpdateHandler(payload);
              //     break;
              //   default:
              //     console.warn('Unknown event type:', eventName, payload);
              // }

              console.log('Unknown event type:', eventName, payload);

              if (eventName === 'live-score-board') {
                matchScoreCardUpdateHandler(payload);
              }
              if (eventName === 'match-complete') {
                navigation.navigate('MatchScoreCard', { matchId: payload.matchId });
              }
            } catch (error) {
              console.error('Error processing live message:', error, message.body);
            }
          });
        }
      };

      clientRef.current.onStompError = () => {
        updateConnectionState('live', false);
      };

      clientRef.current.onDisconnect = () => {
        updateConnectionState('live', false);
      };

      clientRef.current.activate();
    };

    return { liveConnected, setupClient };
  };

  const { setupClient } = useStompConnection();

  useEffect(() => {
    getMatchState();
    setupClient(stompLiveClientRef, 'live', matchId);

    return () => {
      stompLiveClientRef.current?.deactivate();
      stompSubmitClientRef.current?.deactivate();
    };
  }, [matchId]);

  const renderCommentary = ({ item }) => {
    const cleanedCommentary = item?.commentary?.replace(/[*\\"/]/g, '');
    const isWicket = /out|wicket|bowled|caught|lbw|stumped|run out/i.test(cleanedCommentary);
    const isBoundary = /six|four|boundary/i.test(cleanedCommentary);

    return (
      <View style={[
        styles.commentaryItem,
        isWicket && styles.wicketItem,
        isBoundary && styles.boundaryItem
      ]}>
        <View style={styles.commentaryHeader}>
          <Text style={styles.overText}>{item.overNumber}.{item.ballNumber}</Text>
          {isWicket && <MaterialCommunityIcons name="cricket" size={18} color={AppColors.red} />}
          {isBoundary && <MaterialCommunityIcons name="run-fast" size={18} color={AppColors.yellow} />}
        </View>
        <Text style={styles.commentaryText}>{cleanedCommentary}</Text>
      </View>
    );
  };

  const getAllCommentary = () => {
    return [];
  };

  const renderScorecard = () => {
    const currentOversFormatted = `${completedOvers}.${legalDeliveries}`;
    const strikerSR = striker?.ballsFaced > 0 ? (striker.runs * 100 / striker.ballsFaced).toFixed(0) : '0.00';
    const nonStrikerSR = nonStriker?.ballsFaced > 0 ? (nonStriker.runs * 100 / nonStriker.ballsFaced).toFixed(0) : '0.00';
    const bowlerEconomy = bowler?.economyRate !== null ? (bowler.economyRate).toFixed(1) : '0.00';

    return (
      <LinearGradient
        colors={[AppGradients.primaryCard[0], AppGradients.primaryCard[1]]}
        style={styles.scorecardContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.teamScoreContainer}>
          <View style={styles.teamScore}>
            <Text style={styles.teamName}>{battingTeamName}</Text>
            <Text style={styles.teamRuns}>
              {battingScore}/{battingWicket}
            </Text>
            <Text style={styles.oversText}>({battingFirstOvers} ov)</Text>
          </View>

          <View style={styles.versusContainer}>
            <Text style={styles.versusText}>vs</Text>
          </View>

          <View style={styles.teamScore}>
            <Text style={styles.teamName}>{bowlingTeamName}</Text>
            <Text style={styles.teamRuns}>
              {bowlingTeamScore}/{bowlingTeamWickets}
            </Text>
            <Text style={styles.oversText}>({battingSecondOvers} ov)</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.playerContainer}>
          <View style={styles.playerRow}>
            <View style={styles.playerInfo}>
              <View style={[styles.playerIcon, styles.strikerIcon]} />
              <Text style={styles.playerName}>{striker?.name}*</Text>
            </View>
            <Text style={styles.playerStats}>
              {striker?.runs} ({striker?.ballsFaced})
            </Text>
            <Text style={styles.playerExtra}>
              SR: {strikerSR}
            </Text>
          </View>

          <View style={styles.playerRow}>
            <View style={styles.playerInfo}>
              <View style={[styles.playerIcon, styles.nonStrikerIcon]} />
              <Text style={styles.playerName}>{nonStriker?.name}</Text>
            </View>
            <Text style={styles.playerStats}>
              {nonStriker?.runs} ({nonStriker?.ballsFaced})
            </Text>
            <Text style={styles.playerExtra}>
              SR: {nonStrikerSR}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.playerRow}>
            <View style={styles.playerInfo}>
              <View style={[styles.playerIcon, styles.bowlerIcon]} />
              <Text style={styles.playerName}>{bowler?.name}</Text>
            </View>
            <Text style={styles.playerStats}>
              {bowler?.wickets}/{bowler?.runsConceded}
            </Text>
            <Text style={styles.playerExtra}>
              Eco: {bowlerEconomy}
            </Text>
          </View>
        </View>

        <View style={styles.matchInfoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Current Over</Text>
            <Text style={styles.infoValue}>{overDetails || "-"}</Text>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const BattingRow = ({ item }) => {
    const name = item?.name || "-";
    const runs = safeNumber(item?.runs, 0);
    const balls = safeNumber(item?.ballsFaced, 0);
    const fours = safeNumber(item?.fours, 0);
    const sixes = safeNumber(item?.sixes, 0);
    const sr = strikeRateCalc(runs, balls);
    const outText = dismissalText(item?.wicketDetails);

    return (
      <View style={styles.tableRow}>
        <View style={[styles.cellName, styles.cell]}>
          <Text style={styles.playerCellName} numberOfLines={1}>{name}</Text>
          <Text style={styles.dismissalText} numberOfLines={1}>{outText}</Text>
        </View>
        <Text style={[styles.cell, styles.cellNum]}>{runs}</Text>
        <Text style={[styles.cell, styles.cellNum]}>{balls}</Text>
        <Text style={[styles.cell, styles.cellNum]}>{fours}</Text>
        <Text style={[styles.cell, styles.cellNum]}>{sixes}</Text>
        <Text style={[styles.cell, styles.cellNum]}>{sr}</Text>
      </View>
    );
  };

  const BowlingRow = ({ item }) => {
    const name = item?.name || "-";
    const balls = safeNumber(item?.ballsBowled, 0);
    const oversDisp = ballsToOvers(balls);
    const maidens = safeNumber(item?.maidens, 0);
    const runs = safeNumber(item?.runsConceded, 0);
    const wkts = safeNumber(item?.wicketsTaken, 0);
    const eco = economy(runs, balls);

    return (
      <View style={styles.tableRow}>
        <View style={[styles.cellName, styles.cell]}>
          <Text style={styles.playerCellName} numberOfLines={1}>{name}</Text>
        </View>
        <Text style={[styles.cell, styles.cellNum]}>{oversDisp}</Text>
        <Text style={[styles.cell, styles.cellNum]}>{maidens}</Text>
        <Text style={[styles.cell, styles.cellNum]}>{runs}</Text>
        <Text style={[styles.cell, styles.cellNum]}>{wkts}</Text>
        <Text style={[styles.cell, styles.cellNum]}>{eco}</Text>
      </View>
    );
  };

  const BattingTable = ({ data }) => {
    return (
      <View style={styles.tableContainer}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.cell, styles.cellName, styles.headerText]}>Batsman</Text>
          <Text style={[styles.cell, styles.cellNum, styles.headerText]}>R</Text>
          <Text style={[styles.cell, styles.cellNum, styles.headerText]}>B</Text>
          <Text style={[styles.cell, styles.cellNum, styles.headerText]}>4s</Text>
          <Text style={[styles.cell, styles.cellNum, styles.headerText]}>6s</Text>
          <Text style={[styles.cell, styles.cellNum, styles.headerText]}>SR</Text>
        </View>
        <FlatList
          data={data}
          keyExtractor={(item, idx) => (item?.playerId || item?.id || item?.name || "") + "_" + idx}
          renderItem={({ item }) => <BattingRow item={item} />}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.emptyRow}>No batting data</Text>}
        />
      </View>
    );
  };

  const BowlingTable = ({ data }) => {
    return (
      <View style={styles.tableContainer}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.cell, styles.cellName, styles.headerText]}>Bowler</Text>
          <Text style={[styles.cell, styles.cellNum, styles.headerText]}>O</Text>
          <Text style={[styles.cell, styles.cellNum, styles.headerText]}>M</Text>
          <Text style={[styles.cell, styles.cellNum, styles.headerText]}>R</Text>
          <Text style={[styles.cell, styles.cellNum, styles.headerText]}>W</Text>
          <Text style={[styles.cell, styles.cellNum, styles.headerText]}>Eco</Text>
        </View>
        <FlatList
          data={data}
          keyExtractor={(item, idx) => (item?.playerId || item?.id || item?.name || "") + "_" + idx}
          renderItem={({ item }) => <BowlingRow item={item} />}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.emptyRow}>No bowling data</Text>}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.darkBlue} />
      {loading ? (
        <View style={styles.shimmerFullScreen}>
          <ShimmerCard />
        </View>
      ) : (
        <>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={AppColors.darkBlue} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Match Details</Text>
              <View style={styles.headerRight} />
            </View>
          </SafeAreaView>

          <ImageBackground source={background} style={styles.background} imageStyle={styles.backgroundImage}>
            <View style={styles.stickyScorecard}>
              {renderScorecard()}
            </View>
            <ScrollView
              style={styles.scrollableContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  tintColor={AppColors.blue}
                  onRefresh={getMatchState}
                />
              }
            >
              {showWaitingAnimation && !showScoreCard ? (
                <View style={styles.waitingAnimationContainer}>
                  <LottieView
                    source={waitingAnimation}
                    autoPlay
                    loop
                    style={styles.waitingAnimation}
                  />
                  <Text style={styles.waitingText}>Waiting for match data...</Text>
                </View>
              ) : activeTab === 'commentary' ? (
                <FlatList
                  data={getAllCommentary()}
                  renderItem={renderCommentary}
                  keyExtractor={(_, index) => index.toString()}
                  scrollEnabled={false}
                  contentContainerStyle={styles.commentaryList}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No commentary available yet</Text>
                    </View>
                  }
                />
              ) : (
                <View style={styles.detailedScorecard}>
                  {showScoreCard && (
                    <>
                      <Text style={styles.inningsDetail}>1st Innings</Text>
                      <BattingTable data={battingFirst} />
                      <BowlingTable data={bowlingFirst} />
                      <Text style={styles.inningsDetail}>2nd Innings</Text>
                      <BattingTable data={battingSecond} />
                      <BowlingTable data={bowlingSecond} />
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </ImageBackground>
        </>
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background
  },
  safeArea: {
    backgroundColor: AppColors.darkBlue,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  stickyScorecard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 10 : 10,
  },
  scrollableContent: {
    marginTop: 300,
    paddingHorizontal: 12,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: AppColors.white,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.darkBlue,
  },
  headerRight: {
    width: 40,
  },
  // Shimmer-specific styles
  shimmerFullScreen: {
    flex: 1,
    paddingHorizontal: 12,
  },
  shimmerContainer: {
    marginTop: 20,
  },
  shimmerBox: {
    borderRadius: 15,
    marginBottom: 15,
  },
  shimmerHeaderPlaceholder: {
    height: 60,
    paddingHorizontal: 15,
    justifyContent: 'center',
    marginBottom: 15,
    borderRadius: 15,
    backgroundColor: AppColors.white,
  },
  shimmerHeaderTitle: {
    width: '50%',
    height: 20,
  },
  shimmerScorecardPlaceholder: {
    padding: 15,
    backgroundColor: AppColors.white,
    borderRadius: 15,
    marginBottom: 15,
  },
  shimmerTeamScore: {
    width: '45%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmerTeamName: {
    width: '80%',
    height: 16,
    marginBottom: 8,
  },
  shimmerTeamRuns: {
    width: '60%',
    height: 24,
  },
  shimmerVs: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AppColors.lightText,
  },
  shimmerPlayerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  shimmerPlayerName: {
    width: '40%',
    height: 14,
  },
  shimmerPlayerRuns: {
    width: '20%',
    height: 14,
  },
  shimmerTabsPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    backgroundColor: AppColors.white,
    borderRadius: 10,
    marginBottom: 15,
  },
  shimmerTabButton: {
    width: '48%',
    height: 40,
    borderRadius: 8,
  },
  shimmerTableContainer: {
    backgroundColor: AppColors.white,
    borderRadius: 15,
    marginBottom: 20,
  },
  shimmerTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppColors.blue,
    padding: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  shimmerTableText: {
    width: '30%',
    height: 14,
    borderRadius: 4,
  },
  shimmerTableTextSmall: {
    width: '15%',
    height: 14,
    borderRadius: 4,
  },
  shimmerTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  shimmerTablePlayer: {
    width: '40%',
    height: 14,
    borderRadius: 4,
  },
  shimmerTableStat: {
    width: '12%',
    height: 14,
    borderRadius: 4,
  },
  background: {
    flex: 1
  },
  backgroundImage: {
    opacity: 0.08,
    resizeMode: 'contain'
  },
  contentContainer: {
    paddingHorizontal: 12
  },
  topSpacer: {
    height: 10
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 5,
    marginTop: 15,
    marginBottom: 10,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  stickyTabsContainer: {
    zIndex: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  activeTab: {
    backgroundColor: AppColors.blue,
  },
  tabText: {
    color: AppColors.black,
    fontWeight: '600'
  },
  activeTabText: {
    color: AppColors.white
  },
  scorecardContainer: {
    borderRadius: 15,
    padding: 15,
    marginTop: 8,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  teamScore: {
    flex: 1,
    alignItems: 'center'
  },
  teamName: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '700'
  },
  teamRuns: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4
  },
  oversText: {
    color: AppColors.white,
    fontSize: 12,
    opacity: 0.8,
  },
  versusContainer: {
    width: 50,
    alignItems: 'center'
  },
  versusText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '700'
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 10
  },
  playerContainer: {
    marginTop: 6
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  playerIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  strikerIcon: {
    backgroundColor: AppColors.green
  },
  nonStrikerIcon: {
    backgroundColor: AppColors.lightText
  },
  bowlerIcon: {
    backgroundColor: AppColors.yellow
  },
  playerName: {
    color: AppColors.white,
    fontWeight: '600'
  },
  playerStats: {
    color: AppColors.white,
    fontWeight: '600'
  },
  waitingAnimationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  waitingAnimation: {
    width: 200,
    height: 200,
  },
  waitingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.darkBlue,
    fontWeight: '600',
  },
  playerExtra: {
    color: AppColors.white,
    fontSize: 12,
    opacity: 0.8
  },
  matchInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  infoItem: {
    flex: 1
  },
  infoLabel: {
    color: AppColors.white,
    fontSize: 12,
    opacity: 0.8
  },
  infoValue: {
    color: AppColors.white,
    fontWeight: '700',
    marginTop: 2
  },
  commentaryItem: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 8,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  wicketItem: {
    borderLeftWidth: 3,
    borderLeftColor: AppColors.red
  },
  boundaryItem: {
    borderLeftWidth: 3,
    borderLeftColor: AppColors.yellow
  },
  commentaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  overText: {
    color: AppColors.blue,
    marginRight: 6,
    fontWeight: '600'
  },
  commentaryText: {
    color: AppColors.black
  },
  commentaryList: {
    paddingVertical: 12
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    color: AppColors.lightText
  },
  scoreTabsRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  scoreTabBtn: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 2,
    backgroundColor: AppColors.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreTabActive: {
    backgroundColor: AppColors.blue
  },
  scoreTabText: {
    color: AppColors.black,
    fontWeight: '600',
    fontSize: 12
  },
  scoreTabTextActive: {
    color: AppColors.white
  },
  detailedScorecard: {
    backgroundColor: AppColors.white,
    borderRadius: 15,
    marginVertical: 20,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tableContainer: {
    marginVertical: 8,
    paddingHorizontal: 15
  },
  tableHeader: {
    backgroundColor: AppColors.blue,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#EEE'
  },
  headerText: {
    color: AppColors.white,
    fontWeight: '700'
  },
  cell: {
    paddingHorizontal: 8
  },
  cellName: {
    flex: 1.6
  },
  cellNum: {
    flex: 0.6,
    textAlign: 'right',
    color: AppColors.black,
    fontWeight: '600'
  },
  playerCellName: {
    color: AppColors.black,
    fontWeight: '700'
  },
  dismissalText: {
    color: AppColors.lightText,
    fontSize: 12,
    marginTop: 2
  },
  emptyRow: {
    color: AppColors.lightText,
    padding: 10,
    textAlign: 'center'
  },
  inningsTabsRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    borderRadius: 10,
    padding: 4,
    marginTop: 12,
    marginBottom: 12,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inningsTabBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 2,
    backgroundColor: AppColors.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  inningsTabActive: {
    backgroundColor: AppColors.blue,
  },
  inningsTabText: {
    color: AppColors.black,
    fontWeight: '600',
    fontSize: 13,
  },
  inningsTabTextActive: {
    color: AppColors.white,
  },
  inningsDetail: {
    fontWeight: '600',
    fontSize: 16,
    color: AppColors.blue,
    textAlign: 'center',
    marginTop: 6,
  }
});

export default CommentaryScorecard;