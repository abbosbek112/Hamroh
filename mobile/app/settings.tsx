import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, LogOut, Globe, Moon, Bell, Shield, ChevronRight } from 'lucide-react-native';
import { supabase } from '../services/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import type { User as UserType } from '../types';

export default function SettingsScreen() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      if (data) setUser(data as UserType);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Chiqish', 'Rostdan ham chiqmoqchimisiz?', [
      { text: 'Bekor qilish', style: 'cancel' },
      {
        text: 'Chiqish',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const languages = [
    { code: 'uz', label: "O'zbekcha" },
    { code: 'ru', label: 'Русский' },
    { code: 'en', label: 'English' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        {user && (
          <View style={styles.profileCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {(user.name || user.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.profileName}>{user.name || user.username}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{user.xp}</Text>
                <Text style={styles.profileStatLabel}>XP</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{user.streak}</Text>
                <Text style={styles.profileStatLabel}>Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{Math.floor(user.xp / 1000) + 1}</Text>
                <Text style={styles.profileStatLabel}>Daraja</Text>
              </View>
            </View>
          </View>
        )}

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Til</Text>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={styles.settingRow}
              onPress={() => setLanguage(lang.code as any)}
            >
              <View style={styles.settingLeft}>
                <Globe color="#4F46E5" size={20} />
                <Text style={styles.settingLabel}>{lang.label}</Text>
              </View>
              {language === lang.code && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ko'rinish</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Moon color="#6366F1" size={20} />
              <Text style={styles.settingLabel}>Qorong'u rejim</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#E2E8F0', true: '#4F46E5' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Other Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Boshqa</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/support')}
          >
            <View style={styles.settingLeft}>
              <Bell color="#22C55E" size={20} />
              <Text style={styles.settingLabel}>Qo'llab-quvvatlash</Text>
            </View>
            <ChevronRight color="#94A3B8" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/about')}
          >
            <View style={styles.settingLeft}>
              <Shield color="#8B5CF6" size={20} />
              <Text style={styles.settingLabel}>Dastur haqida</Text>
            </View>
            <ChevronRight color="#94A3B8" size={18} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color="#EF4444" size={20} />
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  profileCard: {
    backgroundColor: '#4F46E5',
    margin: 16,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLargeText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: '#C7D2FE',
    marginBottom: 20,
  },
  profileStats: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 24,
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#C7D2FE',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 32,
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
