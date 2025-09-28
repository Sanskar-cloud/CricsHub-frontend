import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, AppGradients } from '../../assets/constants/colors';

const CustomAlertDialog = ({
  visible,
  title,
  message,
  onClose,
  type = 'info',
  buttons = [],
}) => {
  let iconName;
  let iconColor;
  let titleColor;
  let lottieSource = null;

  switch (type) {
    case 'success':
      lottieSource = require('../../assets/animations/Success animation.json'); 
      titleColor = AppColors.successGreen;
      break;
    case 'error':
      iconName = 'error';
      iconColor = AppColors.errorRed;
      titleColor = AppColors.errorRed;
      break;
    case 'warning':
      lottieSource = require('../../assets/animations/Warning animation.json'); 
      titleColor = AppColors.warningOrange;
      break;
    case 'info':
    default:
      iconName = 'info';
      iconColor = AppColors.primaryBlue;
      break;
  }
  const dialogButtons = buttons.length > 0 ? buttons : [{ text: 'OK', onPress: onClose, gradientColors: AppGradients.primaryButton }];

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.alertContainer} onStartShouldSetResponder={() => true}>
          {lottieSource ? (
            <LottieView
              source={lottieSource}
              autoPlay
              loop={false}
              style={styles.lottieIcon}
            />
          ) : (
            iconName && (
              <MaterialIcons name={iconName} size={65} color={iconColor} style={styles.alertIcon} />
            )
          )}
          {/* {title && <Text style={[styles.alertTitle, { color: titleColor }]}>{title}</Text>} */}
          <Text style={styles.alertMessage}>{message}</Text>

          <View style={styles.buttonContainer}>
            {dialogButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.alertButton, button.style]}
                onPress={() => {
                  if (button.onPress) {
                    button.onPress();
                  } else {
                    onClose(); 
                  }
                }}
              >
                <LinearGradient
                  colors={button.gradientColors || AppGradients.primaryButton}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.alertButtonGradient}
                >
                  <Text style={styles.alertButtonText}>{button.text}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.overlay, 
  },
  alertContainer: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 25,
    alignItems: 'center',
    maxWidth: 340,
    shadowColor: AppColors.black,
    shadowOffset: {
      width: 0,
      height: 10, 
    },
    shadowOpacity: 0.25, 
    shadowRadius: 15,
    elevation: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.cardBorder,
  },
  alertIcon: {
    marginBottom: 10,
  },
  lottieIcon: {
    width: 140,
    height: 140,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  alertMessage: {
    fontSize: 16,
    color: AppColors.mediumText,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
    paddingHorizontal: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  alertButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: AppColors.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  alertButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonText: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default CustomAlertDialog;