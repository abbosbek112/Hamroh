import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, Coins, Star, Zap, Palette } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import type { StoreItem } from '../../types';

export default function MarketScreen() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data } = await supabase
        .from('store_items')
        .select('*')
        .order('price', { ascending: true });
      if (data) setItems(data as StoreItem[]);
    } catch (err) {
      console.error('Failed to load store items', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = (item: StoreItem) => {
    Alert.alert(
      `${item.name} sotib olish`,
      `Narxi: ${item.price} tanga. Tasdiqlaysizmi?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { text: 'Sotib olish', onPress: () => console.log('Buy', item.id) },
      ]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'THEME': return <Palette color="#A855F7" size={20} />;
      case 'BADGE': return <Star color="#EAB308" size={20} />;
      case 'UTILITY': return <Zap color="#4F46E5" size={20} />;
      default: return <Star color="#64748B" size={20} />;
    }
  };

  const renderItem = ({ item }: { item: StoreItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemIcon}>
        <Text style={styles.itemIconText}>{item.icon}</Text>
      </View>
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          {getTypeIcon(item.type)}
          <Text style={styles.itemName}>{item.name}</Text>
          {item.isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.itemFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.priceText}>{item.price}</Text>
          </View>
          <TouchableOpacity
            style={styles.buyButton}
            onPress={() => handleBuy(item)}
          >
            <Text style={styles.buyButtonText}>Sotib olish</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ShoppingBag color="#4F46E5" size={24} />
        <Text style={styles.headerTitle}>Do'kon</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#4F46E5" size="large" />
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingBag color="#CBD5E1" size={48} />
          <Text style={styles.emptyTitle}>Do'kon bo'sh</Text>
          <Text style={styles.emptyText}>Tez orada yangi mahsulotlar qo'shiladi!</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
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
  loader: {
    marginTop: 48,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemIconText: {
    fontSize: 28,
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  premiumBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D97706',
  },
  itemDescription: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 18,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinIcon: {
    fontSize: 14,
  },
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  buyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
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
  },
});
