import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './components/Authentication/Login';
import OTP from './components/Authentication/Otp';
import RegisterForm from './components/Authentication/RegistrationForm';
// import Registration from './components/Authentication/Registration';
import Tournaments from './components/Tournaments/Tournaments';
import Home from './components/Home/Home';
import Teams from './components/Teams/Teams';
import Profile from './components/Settings/Profile';
import Support from './components/Settings/Support';
import TossFlip from './components/Settings/TossFlip';
import PrivacyPolicy from './components/Settings/PrivacyPolicy';
import Performance from './components/Settings/Performance';
import Footer from './components/Footer';
import CreateTeam from './components/Teams/CreateTeam';
import CreateTournaments from './components/Tournaments/CreateTournaments';
import ManageTournaments from './components/Tournaments/Tournaments Overview/ManageTournaments';
import TeamDetailsScreen from './components/Teams/TeamDetailsScreen';
import InstantMatch from './components/Matches/MatchOps/InstantMatch';
import SelectPlayingII from './components/Matches/MatchOps/SelectPlayingII';
import TossScreen from './components/Matches/MatchOps/TossScreen';
import Toss from './components/Matches/MatchOps/Toss';
import Scoring from './components/Matches/MatchOps/Scoring';
import SelectRoles from './components/Matches/MatchOps/SelectRoles';
import AddPlayersToTeam from './components/Teams/AddPlayersToTeam';
import SelectRoles2ndInnings from './components/Matches/MatchOps/SelectRoles2ndInnings';
import AllMatches from './components/Matches/AllMatches/AllMatches';
import ScheduleMatch from './components/Matches/MatchOps/ScheduleMatch';
import MatchOperatives from './components/Matches/MatchOps/MatchOperatives';
import CommentaryScorecard from './components/Matches/MatchScorecard/CommentaryScorecard';
import FantasyCricketScreen from './components/Fantasy/FantasyHome';
import Contests from './components/Fantasy/Contests';
import ContestDetails from './components/Fantasy/ContestDetails';
import CreateContestTeam from './components/Fantasy/CreateContestTeam';
import MatchStartTransition from './components/Matches/MatchOps/MatchStartTransition';
import Info from './components/Tournaments/Tournaments Overview/TournamentInfo';
import { Matches } from './components/Tournaments/Tournaments Overview/TournamentMatches';
import Teams1 from './components/Tournaments/Tournaments Overview/TournamentTeams';
import PointsTable from './components/Tournaments/Tournaments Overview/TournamentPointtable';
import ScoreCard from './components/Matches/MatchScorecard/ScoreCard.tsx';
import InternetConnectivityCheck from './components/InternetConnectivity';
import ConnectLiveStream from './components/LiveStream/ConnectLiveStream';
import StreamMatch from './components/LiveStream/StreamMatch';
import AnimatedSplash from './assets/animations/SplashScreen.js';
import { AppColors } from './assets/constants/colors';
import StreamInfoModal from './components/LiveStream/StreamInfoModel';
import TournamentMatchOperatives from './components/Tournaments/TournamentMatchOperatives';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Stack = createStackNavigator();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <AnimatedSplash onFinish={() => setShowSplash(false)} />;
  }

  // const insets = useSafeAreaInsets();

  return (
    <NavigationContainer>
      <InternetConnectivityCheck>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="RegisterForm" component={RegisterForm} />
          {/* <Stack.Screen name="Registration" component={Registration} /> */}
          <Stack.Screen name="OTP" component={OTP} />
          <Stack.Screen name="Main" component={MainScreens} />
        </Stack.Navigator>
      </InternetConnectivityCheck>
    </NavigationContainer>
  );
};

const MainScreens = () => {
  const state = useNavigationState((state) => state);
  const currentRoute =
    state.routes[state.index]?.state?.routes[
      state.routes[state.index]?.state?.index || 0
    ]?.name || state.routes[state.index]?.name;

  const hideFooterScreens = [
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

  const shouldShowFooter = !hideFooterScreens.includes(currentRoute);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, marginBottom: insets.bottom }}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Home">
        <Stack.Screen name="Home" component={Home} />
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

      {shouldShowFooter && <Footer style={styles.footer} />}
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    zIndex: 1,
  },
});

export default App;
