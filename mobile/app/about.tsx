import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Info, Star, Shield, Globe, Code } from 'lucide-react-native';

export default function AboutScreen() {
  const features = [
    { icon: '🎯', title: 'Intizom tizimi', desc: 'Kunlik vazifalar, odatlar va Pomodoro taymer' },
    { icon: '👥', title: 'Jamiyat', desc: "Maqsaddoshlar bilan bog'laning" },
    { icon: '🏪', title: "Do'kon", desc: "XP va tangalar bilan sovg'alar oling" },
    { icon: '📊', title: 'Tahlil', desc: "O'z rivojlanishingizni kuzating" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>H</Text>
          </View>
          <Text style={styles.appName}>Hamroh AI</Text>
          <Text style={styles.version}>Versiya 1.0.0</Text>
          <Text style={styles.tagline}>
            Shaxsiy rivojlanish va intizom hamrohi
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imkoniyatlar</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Shield color="#4F46E5" size={18} />
            <Text style={styles.infoText}>Ma'lumotlaringiz xavfsiz saqlanadi</Text>
          </View>
          <View style={styles.infoRow}>
            <Star color="#EAB308" size={18} />
            <Text style={styles.infoText}>O'zbek tilida yaratilgan</Text>
          </View>
          <View style={styles.infoRow}>
            <Globe color="#22C55E" size={18} />
            <Text style={styles.infoText}>Hamroh.ai - O'zbekiston uchun</Text>
          </View>
        </View>

        <Text style={styles.copyright}>
          © 2025 Hamroh AI. Barcha huquqlar himoyalangan.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  version: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  copyright: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    paddingVertical: 24,
  },
});
