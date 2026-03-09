import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Flame, Zap, Clock, Trophy, ChevronRight, Star } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import type { User } from '../../types';

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  const loadUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/(auth)/login');
        return;
      }
      if (!session.user?.id) {
        router.replace('/(auth)/login');
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (data) setUser(data as User);
      if (!data && !error) {
        router.replace('/(auth)/login');
      }
    } catch (err) {
      console.error('Failed to load user', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadUser();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>H</Text>
        </View>
        <ActivityIndicator color="#4F46E5" size="large" style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  const xpProgress = (user.xp % 1000) / 10;
  const level = Math.floor(user.xp / 1000) + 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Assalomu alaykum 👋</Text>
            <Text style={styles.userName}>{user.name || user.username}</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(user.name || user.username || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
            <Flame color="#F97316" size={22} />
            <Text style={styles.statValue}>{user.streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <Zap color="#4F46E5" size={22} />
            <Text style={styles.statValue}>{user.xp}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
            <Clock color="#22C55E" size={22} />
            <Text style={styles.statValue}>{user.focusMinutes}</Text>
            <Text style={styles.statLabel}>Daqiqa</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FDF4FF' }]}>
            <Trophy color="#A855F7" size={22} />
            <Text style={styles.statValue}>{level}</Text>
            <Text style={styles.statLabel}>Daraja</Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Star color="#EAB308" size={18} />
            <Text style={styles.cardTitle}>Daraja {level} • {user.xp} XP</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${xpProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Keyingi darajaga {1000 - (user.xp % 1000)} XP qoldi
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tezkor amallar</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/intizom')}
            >
              <Zap color="#4F46E5" size={24} />
              <Text style={styles.actionText}>Intizom</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/community')}
            >
              <Trophy color="#A855F7" size={24} />
              <Text style={styles.actionText}>Jamiyat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/market')}
            >
              <Star color="#EAB308" size={24} />
              <Text style={styles.actionText}>Do'kon</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/settings')}
            >
              <Flame color="#F97316" size={24} />
              <Text style={styles.actionText}>Sozlamalar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Motivation Banner */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationTitle}>🔥 Bugun ham g'olib bo'l!</Text>
          <Text style={styles.motivationText}>
            Har bir qadam seni maqsadingga yaqinlashtiradi. Intizomli bo'lish - bu eng katta kuch.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  motivationCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 13,
    color: '#C7D2FE',
    lineHeight: 20,
  },
});
