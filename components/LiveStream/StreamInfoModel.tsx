import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView,TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, AppGradients } from '../../assets/constants/colors';

const StreamInfoModal = ({ visible, onClose, onContinue }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={AppGradients.primaryCard}
            style={styles.modalGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={AppColors.white} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <Ionicons name="wifi" size={40} color={AppColors.white} />
              <Text style={styles.modalTitle}>How to Start Streaming</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Connect to OBS Studio and broadcast your live match in minutes!
              </Text>

              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Ionicons name="football-outline" size={20} color={AppColors.white} />
                  <Text style={styles.featureText}>
                    Select a **live match** from the list below.
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="laptop-outline" size={20} color={AppColors.white} />
                  <Text style={styles.featureText}>
                    On the next screen, enter your OBS Studio's **IP address**.
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="wifi-outline" size={20} color={AppColors.white} />
                  <Text style={styles.featureText}>
                    Make sure your mobile and PC are on the **same Wi-Fi network**.
                  </Text>
                </View>
                
                <View style={styles.featureItem}>
                  <Ionicons name="play-circle-outline" size={20} color={AppColors.white} />
                  <Text style={styles.featureText}>
                    After connecting, you can use our templates and go live!
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={onContinue}
            >
              <Text style={styles.continueButtonText}>Got it! Let's Stream</Text>
            </TouchableOpacity>
            
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
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 15,
    padding: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.white,
    textAlign: 'center',
    marginTop: 10,
  },
  modalBody: {
    marginBottom: 25,
  },
  modalText: {
    color: AppColors.white,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  featureList: {
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
  },
  featureText: {
    color: AppColors.white,
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: AppColors.white,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: AppColors.primaryBlue,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default StreamInfoModal;