import { NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import AnimatedSplash from './assets/animations/SplashScreen.js';
import Login from './components/Authentication/Login';
import OTP from './components/Authentication/Otp';
import RegisterForm from './components/Authentication/RegistrationForm';
import ContestDetails from './components/Fantasy/ContestDetails';
import Contests from './components/Fantasy/Contests';
import CreateContestTeam from './components/Fantasy/CreateContestTeam';
import FantasyCricketScreen from './components/Fantasy/FantasyHome';
import Footer from './components/Footer';
import Home from './components/Home/Home';
import Sidebar from './components/Home/Sidebar'; // Assuming Sidebar is next to Home
import InternetConnectivityCheck from './components/InternetConnectivity';
import ConnectLiveStream from './components/LiveStream/ConnectLiveStream';
import StreamInfoModal from './components/LiveStream/StreamInfoModel';
import StreamMatch from './components/LiveStream/StreamMatch';
import AllMatches from './components/Matches/AllMatches/AllMatches';
import InstantMatch from './components/Matches/MatchOps/InstantMatch';
import MatchOperatives from './components/Matches/MatchOps/MatchOperatives';
import MatchStartTransition from './components/Matches/MatchOps/MatchStartTransition';
import ScheduleMatch from './components/Matches/MatchOps/ScheduleMatch';
import Scoring from './components/Matches/MatchOps/Scoring';
import SelectPlayingII from './components/Matches/MatchOps/SelectPlayingII';
import SelectRoles from './components/Matches/MatchOps/SelectRoles';
import SelectRoles2ndInnings from './components/Matches/MatchOps/SelectRoles2ndInnings';
import Toss from './components/Matches/MatchOps/Toss';
import TossScreen from './components/Matches/MatchOps/TossScreen';
import CommentaryScorecard from './components/Matches/MatchScorecard/CommentaryScorecard';
import ScoreCard from './components/Matches/MatchScorecard/ScoreCard.tsx';
import Performance from './components/Settings/Performance';
import PrivacyPolicy from './components/Settings/PrivacyPolicy';
import Profile from './components/Settings/Profile';
import Support from './components/Settings/Support';
import TossFlip from './components/Settings/TossFlip';
import AddPlayersToTeam from './components/Teams/AddPlayersToTeam';
import CreateTeam from './components/Teams/CreateTeam';
import TeamDetailsScreen from './components/Teams/TeamDetailsScreen';
import Teams from './components/Teams/Teams';
import CreateTournaments from './components/Tournaments/CreateTournaments';
import TournamentMatchOperatives from './components/Tournaments/TournamentMatchOperatives';
import Tournaments from './components/Tournaments/Tournaments';
import ManageTournaments from './components/Tournaments/Tournaments Overview/ManageTournaments';
import Info from './components/Tournaments/Tournaments Overview/TournamentInfo';
import { Matches } from './components/Tournaments/Tournaments Overview/TournamentMatches';
import PointsTable from './components/Tournaments/Tournaments Overview/TournamentPointtable';
import Teams1 from './components/Tournaments/Tournaments Overview/TournamentTeams';

const { width } = Dimensions.get("window");
const Stack = createStackNavigator();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <AnimatedSplash onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <InternetConnectivityCheck>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="RegisterForm" component={RegisterForm} />
          <Stack.Screen name="OTP" component={OTP} />
          <Stack.Screen name="Main" component={MainScreens} />
        </Stack.Navigator>
      </InternetConnectivityCheck>
    </NavigationContainer>
  );
};

const MainScreens = ({ navigation: rootNavigation }) => {
  // --- SIDEBAR STATE AND LOGIC ---
  const sidebarAnim = useRef(new Animated.Value(-width)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [userName, setUserName] = useState(""); // State for user name

  const toggleSidebar = () => {
    if (isSidebarVisible) {
      closeSidebar();
    } else {
      setIsSidebarVisible(true);
      Animated.parallel([
        Animated.timing(sidebarAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setIsSidebarVisible(false));
  };
  // --------------------------------

  const navigationState = useNavigationState((state) => state);
  const currentRoute =
    navigationState.routes[navigationState.index]?.state?.routes[
      navigationState.routes[navigationState.index]?.state?.index || 0
    ]?.name || navigationState.routes[navigationState.index]?.name;

  const hideFooterOrSidebarScreens = [
    "SelectPlayingII",
    "TossScreen",
    "Profile",
    "Toss",
    "Scoring",
    "SelectRoles",
    "SelectRoles2ndInnings",
    "MatchStartTransition",
    "MatchScoreCard",
    "ScheduleMatch",
    "InstantMatch",
    "CommentaryScorecard",
    "CreateTournaments",
    "ManageTournaments",
    "TeamDetailsScreen",
    "AddPlayersToTeam",
    "ConnectLiveStream",
    "ContestDetails",
    "CreateContestTeam",
    "Login",
    "Register",
    "PrivacyPolicy",
    "TossFlip",
    "Support",
    "StreamMatch",
    "MatchOperatives",
    "TournamentMatchOperatives",
    "RegisterForm",
    "Otp",
  ];

  const shouldShowFooter = !hideFooterOrSidebarScreens.includes(currentRoute);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, marginBottom: insets.bottom }}>
      {/* 1. Stack Navigator Renders Screen Content */}
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Home">
        
        {/* Pass sidebar controls and user state only to the Home screen */}
        <Stack.Screen name="Home">
            {(props) => (
                <Home 
                    {...props} 
                    toggleSidebar={toggleSidebar} 
                    userName={userName} 
                    setUserName={setUserName} 
                />
            )}
        </Stack.Screen>
        
        {/* All other screen registrations remain */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="MyMatches" component={AllMatches} />
        <Stack.Screen name="Tournaments" component={Tournaments} />
        <Stack.Screen name="Teams" component={Teams} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Performance" component={Performance} />
        <Stack.Screen name="CreateTeam" component={CreateTeam} />
        <Stack.Screen name="CreateTournaments" component={CreateTournaments} />
        <Stack.Screen name="TournamentMatchOperatives" component={TournamentMatchOperatives} />
        <Stack.Screen name="ManageTournaments" component={ManageTournaments} />
        <Stack.Screen name="TeamDetailsScreen" component={TeamDetailsScreen} />
        <Stack.Screen name="InstantMatch" component={InstantMatch} />
        <Stack.Screen name="SelectPlayingII" component={SelectPlayingII} />
        <Stack.Screen name="TossScreen" component={TossScreen} />
        <Stack.Screen name="Toss" component={Toss} />
        <Stack.Screen name="Scoring" component={Scoring} />
        <Stack.Screen name="SelectRoles" component={SelectRoles} />
        <Stack.Screen name="AddPlayersToTeam" component={AddPlayersToTeam} />
        <Stack.Screen name="SelectRoles2ndInnings" component={SelectRoles2ndInnings} />
        <Stack.Screen name="MatchScoreCard" component={ScoreCard} />
        <Stack.Screen name="ScheduleMatch" component={ScheduleMatch} />
        <Stack.Screen name="MatchOperatives" component={MatchOperatives} />
        <Stack.Screen name="CommentaryScorecard" component={CommentaryScorecard} />
        <Stack.Screen name="FantasyCricketScreen" component={FantasyCricketScreen} />
        <Stack.Screen name="Contests" component={Contests} />
        <Stack.Screen name="ContestDetails" component={ContestDetails} />
        <Stack.Screen name="CreateContestTeam" component={CreateContestTeam} />
        <Stack.Screen name="MatchStartTransition" component={MatchStartTransition} />
        <Stack.Screen name="ConnectLiveStream" component={ConnectLiveStream} />
        <Stack.Screen name="StreamMatch" component={StreamMatch} />
        <Stack.Screen name="Info" component={Info} />
        <Stack.Screen name="Matches" component={Matches} />
        <Stack.Screen name="Teams1" component={Teams1} />
        <Stack.Screen name="PointsTable" component={PointsTable} />
        <Stack.Screen name="Support" component={Support} />
        <Stack.Screen name="TossFlip" component={TossFlip} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
        <Stack.Screen name="StreamInfoModel" component={StreamInfoModal} />
      </Stack.Navigator>

      {/* 2. Sidebar Overlay (Rendered above Stack) */}
      {isSidebarVisible && (
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <Animated.View
            style={[styles.overlay, { opacity: overlayAnim }]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* 3. Sidebar Component (Rendered above Stack/Overlay) */}
      <Sidebar
          sidebarAnim={sidebarAnim}
          userName={userName}
          navigation={rootNavigation} // Pass the root navigator for sidebar navigation
          closeSidebar={closeSidebar}
          isSidebarVisible={isSidebarVisible}
      />
      
      {/* 4. Footer (Conditional rendering based on currentRoute) */}
      {shouldShowFooter && <Footer style={styles.footer} />}
      
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  footer: {
    width: '100%',
    zIndex: 1,
  },
});

export default App;
