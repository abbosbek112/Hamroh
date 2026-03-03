import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HelpCircle, Mail, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react-native';

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <TouchableOpacity style={styles.faqItem} onPress={() => setIsOpen(!isOpen)}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        {isOpen ? <ChevronUp color="#64748B" size={18} /> : <ChevronDown color="#64748B" size={18} />}
      </View>
      {isOpen && <Text style={styles.faqAnswer}>{answer}</Text>}
    </TouchableOpacity>
  );
};

export default function SupportScreen() {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) {
      Alert.alert('Xato', 'Xabar kiriting');
      return;
    }
    Alert.alert('Yuborildi', 'Xabaringiz qabul qilindi. Tez orada javob beramiz!');
    setMessage('');
  };

  const faqs = [
    {
      question: "Streak qanday ishlaydi?",
      answer: "Har kuni dasturga kirib, kamida bitta vazifani bajarganingizda streak saqlanadi. Bir kun qoldirsa, streak nolga tushadi.",
    },
    {
      question: "XP nima va u nima uchun kerak?",
      answer: "XP (tajriba ballari) - bu sizning faolligingizni ko'rsatuvchi ball. Vazifalar, odatlar va fokus sessiyalari uchun XP olasiz. Ko'p XP = yuqori daraja.",
    },
    {
      question: "Tangalar qanday ishlatiladi?",
      answer: "Tangalar do'konda maxsus narsalar sotib olish uchun ishlatiladi: mavzular, nishonlar va boshqalar.",
    },
    {
      question: "Parolimni unutdim, nima qilaman?",
      answer: "Kirish sahifasida 'Parolni unutdim' tugmasini bosing. Email manzilingizga havola yuboriladi.",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <HelpCircle color="#4F46E5" size={28} />
          <Text style={styles.headerTitle}>Qo'llab-quvvatlash</Text>
        </View>

        {/* Contact Options */}
        <View style={styles.contactSection}>
          <TouchableOpacity style={styles.contactCard}>
            <Mail color="#4F46E5" size={24} />
            <Text style={styles.contactLabel}>Email orqali yozing</Text>
            <Text style={styles.contactValue}>support@hamroh.ai</Text>
          </TouchableOpacity>
        </View>

        {/* Send Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Xabar yuborish</Text>
          <View style={styles.messageCard}>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Savolingiz yoki muammoingizni yozing..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <MessageCircle color="#FFFFFF" size={18} />
              <Text style={styles.sendButtonText}>Yuborish</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ko'p so'raladigan savollar</Text>
          <View style={styles.faqList}>
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  contactSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  contactCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  contactLabel: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  contactValue: {
    fontSize: 13,
    color: '#6366F1',
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
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageInput: {
    fontSize: 14,
    color: '#0F172A',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    padding: 14,
    borderRadius: 12,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  faqList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    paddingRight: 8,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
    lineHeight: 20,
  },
});
