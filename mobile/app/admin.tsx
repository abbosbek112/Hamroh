import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Shield, Users, BarChart2, AlertTriangle } from 'lucide-react-native';
import { supabase } from '../services/supabaseClient';
import type { User } from '../types';

export default function AdminScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, totalGroups: 0 });
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/(auth)/login');
        return;
      }
      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      if (!data || data.role !== 'admin') {
        router.back();
        return;
      }
      setUser(data as User);
      // Load stats
      const [usersResult, groupsResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('community_groups').select('id', { count: 'exact' }),
      ]);
      setStats({
        totalUsers: usersResult.count || 0,
        activeToday: 0,
        totalGroups: groupsResult.count || 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#4F46E5" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Shield color="#4F46E5" size={24} />
          <Text style={styles.headerTitle}>Admin Panel</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Users color="#4F46E5" size={24} />
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Jami foydalanuvchilar</Text>
          </View>
          <View style={styles.statCard}>
            <BarChart2 color="#22C55E" size={24} />
            <Text style={styles.statValue}>{stats.activeToday}</Text>
            <Text style={styles.statLabel}>Bugun faol</Text>
          </View>
          <View style={styles.statCard}>
            <Users color="#A855F7" size={24} />
            <Text style={styles.statValue}>{stats.totalGroups}</Text>
            <Text style={styles.statLabel}>Guruhlar</Text>
          </View>
          <View style={styles.statCard}>
            <AlertTriangle color="#F97316" size={24} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Shikoyatlar</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Admin Panel</Text>
          <Text style={styles.infoText}>
            To'liq admin paneli uchun veb ilovadan foydalaning. Mobil admin panel asosiy statistikani ko'rsatadi.
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    margin: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6366F1',
    lineHeight: 22,
  },
});
