import React, { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { useAppNavigation } from '../NavigationService';

export default function InternetConnectivityCheck({ children }) {
  const navigation = useAppNavigation();
  const hasShownAlert = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected && !hasShownAlert.current) {
        hasShownAlert.current = true;
        Alert.alert(
          'No Internet Connection',
          'You are offline. Please check your internet connection.',
          [
            {
              text: 'Reload',
              onPress: () => {
                hasShownAlert.current = false;
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' as never }],
                });
              },
            },
          ],
          { cancelable: false }
        );
      }
    });

    return () => unsubscribe();
  }, []);

  return children;
}
