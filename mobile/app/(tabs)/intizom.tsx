import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, CheckCircle, Target, Clock } from 'lucide-react-native';
import { useFocus } from '../../contexts/FocusContext';
import { useLanguage } from '../../contexts/LanguageContext';

type Tab = 'DAILY' | 'HABITS' | 'PLAN' | 'POMODORO';

export default function IntizomScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('DAILY');
  const { focusTime, isActive, toggleTimer, resetTimer, formatTime } = useFocus();
  const { t } = useLanguage();

  const tabs: { id: Tab; label: string }[] = [
    { id: 'DAILY', label: "Kunlik" },
    { id: 'HABITS', label: "Odatlar" },
    { id: 'PLAN', label: "Reja" },
    { id: 'POMODORO', label: "Fokus" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'DAILY':
        return (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <CheckCircle color="#22C55E" size={20} />
                <Text style={styles.cardTitle}>Bugungi vazifalar</Text>
              </View>
              <Text style={styles.emptyText}>
                Hozircha vazifalar yo'q. Yangi vazifa qo'shing!
              </Text>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Vazifa qo'shish</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'HABITS':
        return (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Zap color="#4F46E5" size={20} />
                <Text style={styles.cardTitle}>Odatlar</Text>
              </View>
              <Text style={styles.emptyText}>
                Hali odatlar yo'q. Yangi odat boshlang!
              </Text>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Odat qo'shish</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'PLAN':
        return (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Target color="#A855F7" size={20} />
                <Text style={styles.cardTitle}>Maqsadlar va reja</Text>
              </View>
              <Text style={styles.emptyText}>
                Maqsadlaringizni belgilang va rejangizni tuzing.
              </Text>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Maqsad qo'shish</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'POMODORO':
        return (
          <View style={styles.tabContent}>
            <View style={styles.pomodoroCard}>
              <Clock color="#FFFFFF" size={28} />
              <Text style={styles.pomodoroTitle}>Fokus Taymer</Text>
              <Text style={styles.pomodoroTime}>{formatTime(focusTime)}</Text>
              <View style={styles.pomodoroButtons}>
                <TouchableOpacity
                  style={[styles.pomodoroBtn, isActive && styles.pomodoroBtnActive]}
                  onPress={toggleTimer}
                >
                  <Text style={styles.pomodoroBtnText}>
                    {isActive ? "⏸ To'xtat" : '▶ Boshlash'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pomodoroResetBtn}
                  onPress={resetTimer}
                >
                  <Text style={styles.pomodoroResetText}>↺ Qayta</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.pomodoroInfo}>
                25 daqiqalik fokus sessiyasi
              </Text>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Zap color="#4F46E5" size={24} />
        <Text style={styles.headerTitle}>Intizom</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
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
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  tabActive: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  addButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 14,
  },
  pomodoroCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  pomodoroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 24,
  },
  pomodoroTime: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    marginBottom: 32,
  },
  pomodoroButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pomodoroBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  pomodoroBtnActive: {
    backgroundColor: '#818CF8',
  },
  pomodoroBtnText: {
    color: '#4F46E5',
    fontWeight: 'bold',
    fontSize: 15,
  },
  pomodoroResetBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  pomodoroResetText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  pomodoroInfo: {
    color: '#C7D2FE',
    fontSize: 13,
  },
});
