import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Alert,
  Dimensions
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const AppColors = {
  white: "#FFFFFF",
  black: "#000000",
  blue: "#3498DB",
  background: "#F8F9FA",
  cardBorder: "rgba(255, 255, 255, 0.2)",
  error: "#E74C3C",
  darkText: "#000000",
  lightText: "#666666",
  lightBackground: "#F8F9FA",
  primary: "#4A90E2",
  primaryDark: "#357ABD",
  success: "#2ECC71",
  warning: "#F39C12",
};

const SupportScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!name || !email || !subject || !message) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      Alert.alert(
        'Success', 
        'Your message has been sent. We will get back to you within 24 hours.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      setIsSubmitting(false);
    }, 1500);
  };

  const openEmail = () => {
    Linking.openURL('mailto:support@cricshub.com');
  };

  const openPhone = () => {
    Linking.openURL('tel:+11234567890');
  };

  const openWebsite = () => {
    Linking.openURL('https://www.cricshub.com/contact-us');
  };

  const faqs = [
    {
      question: " How do I create a tournament?",
      answer: "Go to the Tournaments tab and click the 'Create Tournament' button. Fill in all required details and submit."
    },
    {
      question: " Can I edit tournament details after creation?",
      answer: "Yes, you can edit most tournament details from the tournament management screen."
    },
    {
      question: " How many teams can participate in a tournament?",
      answer: "You can have up to 16 teams in a single tournament with our current plan."
    },
    {
      question: " How do I add players to my team?",
      answer: "From your team management screen, tap 'Add Players' and either select from existing players or create new ones."
    }
  ];

  return (
    <View style={styles.safeArea}>
      <SafeAreaView style={styles.safeAreaContainer}>
        <RNStatusBar
          barStyle="dark-content"
          backgroundColor={AppColors.white}
          translucent={false}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={26} color={AppColors.darkText} />
          </TouchableOpacity>
          <Text style={styles.heading}>Support</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Contact Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get Help Quickly</Text>
            <View style={styles.contactMethods}>
              <TouchableOpacity style={styles.contactCard} onPress={openEmail}>
                <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <MaterialIcons name="email" size={24} color={AppColors.primary} />
                </View>
                <Text style={styles.contactText}>Email Support</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactCard} onPress={openPhone}>
                <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <MaterialIcons name="phone" size={24} color={AppColors.success} />
                </View>
                <Text style={styles.contactText}>Call Us</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactCard} onPress={openWebsite}>
                <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="globe-outline" size={24} color={AppColors.warning} />
                </View>
                <Text style={styles.contactText}>Visit Help Center</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FAQ Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <View style={styles.faqContainer}>
              {faqs.map((faq, index) => (
                <View key={index} style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>
                    <FontAwesome5 name="question-circle" size={16} color={AppColors.primary} /> {faq.question}
                  </Text>
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Contact Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send us a Message</Text>
            <View style={styles.form}>
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Your Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor={AppColors.lightText}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={AppColors.lightText}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              
              <Text style={styles.label}>Subject *</Text>
              <TextInput
                style={styles.input}
                placeholder="What is this regarding?"
                placeholderTextColor={AppColors.lightText}
                value={subject}
                onChangeText={setSubject}
              />
              
              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                placeholder="Describe your issue or question in detail..."
                placeholderTextColor={AppColors.lightText}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appVersion}>CricsHub v1.2.4</Text>
            <Text style={styles.appCopyright}>© 2025 CricsHub. All rights reserved.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  safeAreaContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.lightBackground,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.darkText,
  },
  headerButton: {
    padding: 6,
    width: 40,
  },
  section: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.darkText,
    marginBottom: 16,
  },
  contactMethods: {
    marginBottom: 10,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: AppColors.background,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.darkText,
  },
  faqContainer: {
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.darkText,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: AppColors.lightText,
    lineHeight: 20,
  },
  form: {
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputContainer: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.darkText,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderColor: '#E0E0E0',
    borderWidth: 1,
    padding: 16,
    color: AppColors.darkText,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: AppColors.background,
    fontSize: 16,
  },
  messageInput: {
    height: 120,
    paddingTop: 16,
  },
  submitButton: {
    backgroundColor: AppColors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 30,
  },
  appVersion: {
    fontSize: 14,
    color: AppColors.lightText,
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: AppColors.lightText,
  },
});

export default SupportScreen;