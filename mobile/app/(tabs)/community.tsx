import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Plus, MessageCircle } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import type { CommunityGroup } from '../../types';

export default function CommunityScreen() {
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('community_groups')
        .select('*')
        .order('members', { ascending: false })
        .limit(20);
      if (data) setGroups(data as CommunityGroup[]);
    } catch (err) {
      console.error('Failed to load groups', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderGroup = ({ item }: { item: CommunityGroup }) => (
    <TouchableOpacity style={styles.groupCard}>
      <View style={styles.groupIcon}>
        <Text style={styles.groupIconText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupCategory}>{item.category}</Text>
        {item.lastMessage && (
          <Text style={styles.groupLastMessage} numberOfLines={1}>
            {item.lastMessage.sender}: {item.lastMessage.text}
          </Text>
        )}
      </View>
      <View style={styles.groupMeta}>
        <View style={styles.membersCount}>
          <Users color="#64748B" size={12} />
          <Text style={styles.membersText}>{item.members}</Text>
        </View>
        <MessageCircle color="#94A3B8" size={16} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Users color="#4F46E5" size={24} />
          <Text style={styles.headerTitle}>Jamiyat</Text>
        </View>
        <TouchableOpacity style={styles.createButton}>
          <Plus color="#4F46E5" size={20} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#4F46E5" size="large" />
      ) : groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users color="#CBD5E1" size={48} />
          <Text style={styles.emptyTitle}>Guruhlar yo'q</Text>
          <Text style={styles.emptyText}>
            Birinchi guruhni yarating va do'stlaringizni taklif qiling!
          </Text>
          <TouchableOpacity style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Guruh yaratish</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginTop: 48,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  groupCategory: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
    marginBottom: 2,
  },
  groupLastMessage: {
    fontSize: 12,
    color: '#64748B',
  },
  groupMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  membersCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  membersText: {
    fontSize: 11,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
