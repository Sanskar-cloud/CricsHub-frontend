import { Alert, FlatList, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAppNavigation } from '../../NavigationService';
import apiService from '../../APIservices';

const stadiumBG = require('../../../assets/images/cricsLogo.png');

const SelectRoles2ndInnings = ({ route }) => {
  const { battingTeamII, bowlingTeamII, matchId } = route.params;
  const navigation = useAppNavigation();
  const [battingII, setBattingII] = useState(battingTeamII);
  const [bowlingII, setBowlingII] = useState(bowlingTeamII);

  const [strikerId, setStrikerId] = useState(null);
  const [strikerName, setStrikerName] = useState(null);
  const [nonStrikerId, setNonStrikerId] = useState(null);
  const [nonStrikerName, setNonStrikerName] = useState(null);
  const [bowler, setBowler] = useState(null);
  const [bowlerName, setBowlerName] = useState(null);
  const [step, setStep] = useState(1); // Step 1: Select Batsmen, Step 2: Select Bowler

  const handleSelectBatsman = ({ playerId, name }) => {
    if (strikerId === playerId) {
      setStrikerId(null);
      setStrikerName(null);
    } else if (nonStrikerId === playerId) {
      setNonStrikerId(null);
      setNonStrikerName(null);
    } else if (!strikerId) {
      setStrikerId(playerId);
      setStrikerName(name);
    } else if (!nonStrikerId) {
      setNonStrikerId(playerId);
      setNonStrikerName(name);
    }
  };

  const handleSelectBowler = ({ playerId, name }) => {
    if (bowler === playerId) {
      setBowler(null);
      setBowlerName(null);
    } else {
      setBowler(playerId);
      setBowlerName(name);
    }
  };

  const handleSubmit = async () => {
    if (!strikerId || !nonStrikerId || !bowler) {
      Alert.alert('Error', 'Please select a striker, non-striker, and bowler');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) throw new Error("Please login again");

      const response = await apiService({
        endpoint: `matches/${matchId}/players/update`,
        method: 'POST',
        body: {
          striker: strikerId,
          nonStriker: nonStrikerId,
          bowler,
        },
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });

      if (response.success) {
        Alert.alert('Success', 'Players updated successfully!');
        navigation.navigate('Scoring', {
          matchId,
          strikerId,
          nonStrikerId,
          bowler,
          strikerName,
          nonStrikerName,
          bowlerName,
        });
      } else {
        Alert.alert('Error', 'Failed to update players');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update players');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000000', '#0A303B', '#36B0D5']} style={styles.gradient}>
        <ImageBackground source={stadiumBG} resizeMode="cover" style={styles.background} imageStyle={styles.backgroundImage}>
          <Text style={styles.heading}>Select Roles</Text>
          <BlurView style={styles.selectRolesIIContainer} intensity={50}>

            {step === 1 ? (
              <>
                <Text style={styles.subHeading}>Select Striker & Non-Striker</Text>
                <FlatList
                  data={battingII}
                  keyExtractor={(item) => item.playerId}
                  renderItem={({ item }) => (
                    <Pressable
                      style={[styles.playerCard, strikerId === item.playerId || nonStrikerId === item.playerId ? styles.selected : {}]}
                      onPress={() => handleSelectBatsman({ playerId: item.playerId, name: item.name })}
                    >
                      <Text style={styles.playerText}>{item.name}</Text>
                      {strikerId === item.playerId && <Text style={styles.roleText}>Striker</Text>}
                      {nonStrikerId === item.playerId && <Text style={styles.roleText}>Non-Striker</Text>}
                    </Pressable>
                  )}
                />
                {strikerId && nonStrikerId && (
                  <Pressable style={styles.nextButton} onPress={() => setStep(2)}>
                    <Text style={styles.submitText}>Next</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <>
                <Text style={styles.subHeading}>Select Bowler</Text>
                <FlatList
                  data={bowlingII}
                  keyExtractor={(item) => item.playerId}
                  renderItem={({ item }) => (
                    <Pressable
                      style={[styles.playerCard, bowler === item.playerId ? styles.selected : {}]}
                      onPress={() => handleSelectBowler({ playerId: item.playerId, name: item.name })}
                    >
                      <Text style={styles.playerText}>{item.name}</Text>
                      {bowler === item.playerId && <Text style={styles.roleText}>Bowler</Text>}
                    </Pressable>
                  )}
                />
                {bowler && (
                  <Pressable style={styles.nextButton} onPress={handleSubmit}>
                    <Text style={styles.submitText}>Submit</Text>
                  </Pressable>
                )}
              </>
            )}
          </BlurView>
        </ImageBackground>
      </LinearGradient>
    </View>
  );
};

export default SelectRoles2ndInnings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%'
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  backgroundImage: {
    resizeMode: 'cover',
    opacity: 0.8,
  },
  gradient: {
    flex: 1,
    width: '100%'
  },
  selectRolesIIContainer: {
    width: '90%',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    overflow: 'hidden'
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: 'white'
  },
  subHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    color: 'white'
  },
  playerCard: {
    flex: 1,
    padding: 10,
    margin: 2,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    alignItems: 'center'
  },
  selected: {
    backgroundColor: '#36B0D5'
  },
  playerText: {
    fontSize: 14,
    fontWeight: '600'
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'red'
  },
  nextButton: {
    backgroundColor: '#0A303B',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center'
  },
  submitText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  },
});
