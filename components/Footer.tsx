import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAppNavigation } from './NavigationService';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const Footer = () => {
  const [activeTab, setActiveTab] = useState('HOME');
  const navigation = useAppNavigation();

  const footerTabs = [
    { key: 'MATCHES', icon: 'sports-cricket', label: 'Matches', route: 'Main', nestedRoute: 'MyMatches', iconType: 'material' },
    { key: 'TOURNAMENTS', icon: 'trophy', label: 'Tournaments', route: 'Main', nestedRoute: 'Tournaments', iconType: 'fontawesome' },
    { key: 'HOME', icon: 'home', label: 'Home', route: 'Main', nestedRoute: 'Home', iconType: 'fontawesome' },
    { key: 'TEAMS', icon: 'users', label: 'Teams', route: 'Main', nestedRoute: 'Teams', iconType: 'fontawesome' },
  ];

  const animatedValues = footerTabs.map(() => new Animated.Value(1));

  const handleTabPress = (tab, index) => {
    setActiveTab(tab.key);

    Animated.sequence([
      Animated.spring(animatedValues[index], {
        toValue: 1.2,
        useNativeDriver: true,
      }),
      Animated.spring(animatedValues[index], {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    if (tab.route && tab.nestedRoute) {
      navigation.navigate(tab.route, { screen: tab.nestedRoute });
    }
  };

  return (
    <View style={styles.footerWrapper}>
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(245,245,245,0.9)']}
        style={styles.footer}
      >
        {footerTabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.footerButton}
            onPress={() => handleTabPress(tab, index)}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: animatedValues[index] }] },
              ]}
            >
              {tab.iconType === 'material' ? (
                <MaterialIcons
                  name={tab.icon as any}
                  size={28}
                  color={activeTab === tab.key ? '#4A90E2' : '#777'}
                />
              ) : (
                <Icon
                  name={tab.icon as any}
                  size={26}
                  color={activeTab === tab.key ? '#4A90E2' : '#777'}
                />
              )}
              {activeTab === tab.key && (
                <>
                  <Text style={styles.activeText}>{tab.label}</Text>
                  <View style={styles.activeDot} />
                </>
              )}
            </Animated.View>
          </TouchableOpacity>
        ))}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  footerWrapper: {
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.25,   // Stronger shadow
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,      // More spread
    elevation: 15,         // Higher for Android
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 70,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  footerButton: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4A90E2',
    marginTop: 4,
  },
});


export default Footer;
