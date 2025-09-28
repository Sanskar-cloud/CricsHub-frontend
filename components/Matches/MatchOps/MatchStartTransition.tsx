import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated, Easing, Modal, Pressable } from 'react-native';
import { useAppNavigation } from '../../NavigationService';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, AppGradients } from '../../../assets/constants/colors.js';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';

const MatchStartTransition = ({ route }) => {
  const navigation = useAppNavigation();

  const mainMessageFadeAnim = useRef(new Animated.Value(0)).current;
  const goMessageScaleAnim = useRef(new Animated.Value(0)).current;
  const loaderTranslateY = useRef(new Animated.Value(50)).current;
  const subMessageTranslateY = useRef(new Animated.Value(50)).current;
  const subMessageOpacityAnim = useRef(new Animated.Value(0)).current;

  const [currentPhase, setCurrentPhase] = useState('initial');
  const [modalVisible, setModalVisible] = useState(true);

  const {
    matchId,
    strikerId,
    nonStrikerId,
    bowler,
    selectedStrikerName,
    selectedNonStrikerName,
    selectedBowlerName,
    isFirstInnings,
    score,
    wicket,
    completedOvers,
    matchDetails
  } = route.params;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(loaderTranslateY, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(subMessageTranslateY, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(mainMessageFadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(subMessageOpacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(mainMessageFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        console.log('Transitioning to "Let\'s Go!" phase');
        setCurrentPhase('go');
        mainMessageFadeAnim.setValue(0);
        goMessageScaleAnim.setValue(0.8);
        Animated.parallel([
          Animated.timing(mainMessageFadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(goMessageScaleAnim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      });
    });

    const goMessageAnimationDuration = 500;
    const totalTransitionDuration =
      1000 +
      300 +
      goMessageAnimationDuration +
      200;

    const timer = setTimeout(() => {
      console.log('Navigating to Scoring screen');
      setModalVisible(false);
      navigation.replace('Scoring', {
        matchId,
        strikerId,
        nonStrikerId,
        bowler,
        selectedStrikerName,
        selectedNonStrikerName,
        selectedBowlerName,
        isFirstInnings,
        score,
        wicket,
        completedOvers,
        matchDetails
      });
    }, totalTransitionDuration);

    return () => clearTimeout(timer);
  }, [
    navigation,
    mainMessageFadeAnim,
    goMessageScaleAnim,
    loaderTranslateY,
    subMessageTranslateY,
    subMessageOpacityAnim,
    matchId, strikerId, nonStrikerId, bowler, selectedStrikerName, selectedNonStrikerName,
    selectedBowlerName, isFirstInnings, score, wicket, completedOvers, matchDetails
  ]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => { }} // Disabling modal close by back button
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={AppGradients.primaryCard}
            style={styles.modalGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.messageContainer}>
              {currentPhase === 'initial' && (
                <>
                  <Animated.View style={[styles.lottieContainer, { transform: [{ translateY: loaderTranslateY }] }]}>
                    <LottieView
                      source={require('../../../assets/animations/loader.json')}
                      autoPlay
                      loop
                      style={styles.lottieAnimation}
                    />
                  </Animated.View>
                  <Animated.Text style={[styles.messageText, { opacity: mainMessageFadeAnim }]}>
                    Get Ready!
                  </Animated.Text>
                </>
              )}
              {currentPhase === 'go' && (
                <Animated.Text style={[styles.messageText, { opacity: mainMessageFadeAnim, transform: [{ scale: goMessageScaleAnim }] }]}>
                  Let's Go!
                </Animated.Text>
              )}
              <Animated.Text style={[styles.subMessageText, { opacity: subMessageOpacityAnim, transform: [{ translateY: subMessageTranslateY }] }]}>
                Let's get the scorebook ready!
              </Animated.Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lottieContainer: {
    marginBottom: 20,
  },
  lottieAnimation: {
    width: 250,
    height: 250,
  },
  messageText: {
    fontSize: 32,
    fontWeight: '800',
    color: AppColors.white,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subMessageText: {
    fontSize: 20,
    color: AppColors.white,
    textAlign: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
  },
});

export default MatchStartTransition;