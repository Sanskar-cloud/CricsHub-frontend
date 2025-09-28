import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Linking,
  TouchableOpacity
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppColors } from '../../assets/constants/colors.js';

const PrivacyPolicyScreen = ({ navigation }) => {
  const handleEmailPress = () => {
    Linking.openURL('mailto:support@cricshub.com');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://www.cricshub.com/privacy-policy');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={AppColors.background}
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color={AppColors.darkText} />
          </TouchableOpacity>
          <Text style={styles.heading}>Privacy Policy</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>
            
            <Text style={styles.introText}>
              At CricsHub, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information when you use our cricket tournament management application.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Information We Collect</Text>
              <Text style={styles.sectionText}>
                We collect information that you provide directly to us, including:
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Account information (name, email, phone number)</Text>
                <Text style={styles.listItem}>• Tournament and team data you create</Text>
                <Text style={styles.listItem}>• Player statistics and performance data</Text>
                <Text style={styles.listItem}>• Device information and usage data</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
              <Text style={styles.sectionText}>
                We use the information we collect to:
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Provide and maintain our services</Text>
                <Text style={styles.listItem}>• Improve user experience and app functionality</Text>
                <Text style={styles.listItem}>• Communicate with you about updates and features</Text>
                <Text style={styles.listItem}>• Ensure security and prevent fraud</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Data Sharing and Disclosure</Text>
              <Text style={styles.sectionText}>
                We do not sell your personal data. We may share information with:
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Service providers who assist in our operations</Text>
                <Text style={styles.listItem}>• Other tournament participants (as required for gameplay)</Text>
                <Text style={styles.listItem}>• Legal authorities when required by law</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Data Security</Text>
              <Text style={styles.sectionText}>
                We implement appropriate security measures to protect your information, including encryption, access controls, and regular security assessments.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Your Rights</Text>
              <Text style={styles.sectionText}>
                You have the right to:
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Access and update your personal information</Text>
                <Text style={styles.listItem}>• Delete your account and associated data</Text>
                <Text style={styles.listItem}>• Opt-out of marketing communications</Text>
                <Text style={styles.listItem}>• Request a copy of your data</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Children's Privacy</Text>
              <Text style={styles.sectionText}>
                Our services are not directed to children under 13. We do not knowingly collect personal information from children without parental consent.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Changes to This Policy</Text>
              <Text style={styles.sectionText}>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Contact Us</Text>
              <Text style={styles.sectionText}>
                If you have any questions about this Privacy Policy, please contact us:
              </Text>
              <TouchableOpacity onPress={handleEmailPress} style={styles.contactButton}>
                <Text style={styles.contactText}>contact@cricshub.com</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleWebsitePress} style={styles.contactButton}>
                <Text style={styles.contactText}>www.cricshub.com/privacy</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>© 2025 CricsHub. All rights reserved.</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.cardBorder,
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.darkText,
  },
  backButton: {
    padding: 4,
  },
  headerButton: {
    width: 40,
  },
  content: {
    padding: 24,
  },
  lastUpdated: {
    fontSize: 14,
    color: AppColors.lightText,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  introText: {
    fontSize: 16,
    color: AppColors.darkText,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.primary,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: AppColors.darkText,
    lineHeight: 24,
    marginBottom: 12,
  },
  list: {
    marginLeft: 16,
    marginTop: 8,
  },
  listItem: {
    fontSize: 15,
    color: AppColors.darkText,
    lineHeight: 22,
    marginBottom: 6,
  },
  contactButton: {
    padding: 12,
    backgroundColor: AppColors.white,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
  },
  contactText: {
    fontSize: 15,
    color: AppColors.primary,
    fontWeight: '500',
  },
  footer: {
    marginTop: 40,
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: AppColors.cardBorder,
  },
  footerText: {
    fontSize: 14,
    color: AppColors.lightText,
  },
});

export default PrivacyPolicyScreen;