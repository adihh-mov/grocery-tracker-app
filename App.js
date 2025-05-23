import React, { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable } from 'react-native-gesture-handler';
import * as Progress from 'react-native-progress';
import { Picker } from '@react-native-picker/picker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { Alert, Image } from 'react-native';

import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Modal, TouchableOpacity, useColorScheme } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { SafeAreaView } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

const getDaysRemaining = (finishDate) => {
  const today = new Date();
  const finish = new Date(finishDate);
  const diffTime = finish - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getItemEmoji = (name) => {
  const n = name.toLowerCase();
  if (n.includes('milk')) return '🥛';
  if (n.includes('bread')) return '🍞';
  if (n.includes('egg')) return '🥚';
  if (n.includes('cheese')) return '🧀';
  if (n.includes('apple')) return '🍎';
  if (n.includes('banana')) return '🍌';
  if (n.includes('rice')) return '🍚';
  if (n.includes('potato')) return '🥔';
  if (n.includes('onion')) return '🧅';
  if (n.includes('tomato')) return '🍅';
  if (n.includes('carrot')) return '🥕';
  if (n.includes('broccoli')) return '🥦';
  if (n.includes('chicken')) return '🍗';
  if (n.includes('fish')) return '🐟';
  if (n.includes('meat')) return '🥩';
  if (n.includes('water')) return '💧';
  if (n.includes('oil')) return '🛢️';
  if (n.includes('butter')) return '🧈';
  if (n.includes('coffee')) return '☕';
  if (n.includes('tea')) return '🍵';
  // Default
  return '🛒';
};

function CurrentItemsScreen({ items, markAsFinished, addItem, itemName, setItemName, daysToFinish, setDaysToFinish }) {
  const currentItems = items.filter(item => !item.finished);
  const cardRef = useRef(null);
  const inputGroupRef = useRef(null);

  const [sortBy, setSortBy] = useState('urgency'); // or 'name', 'date'
  const [category, setCategory] = useState('General');

  const sortedItems = [...currentItems].sort((a, b) => {
    if (sortBy === 'urgency') return a.urgencyLevel.localeCompare(b.urgencyLevel);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'date') return new Date(a.addedDate) - new Date(b.addedDate);
    return 0;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#4a7c59" style={{ marginRight: 8 }} />
          <Text style={styles.title}>Current Items</Text>
        </View>
      </View>

      <View ref={inputGroupRef} style={styles.inputGroup}>
        <View style={styles.inputRow}>
          <MaterialCommunityIcons name="cart-outline" size={22} color="#aaa" style={styles.inputIcon} />
          <TextInput
            placeholder="Item name"
            placeholderTextColor="#999"
            value={itemName}
            onChangeText={setItemName}
            style={styles.input}
          />
        </View>
        <View style={styles.inputRow}>
          <MaterialCommunityIcons name="calendar-clock" size={22} color="#aaa" style={styles.inputIcon} />
          <TextInput
            placeholder="Days until empty"
            placeholderTextColor="#999"
            value={daysToFinish}
            onChangeText={setDaysToFinish}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
        {/* Removed Picker for category */}
        <Pressable 
          onPress={addItem}
          accessible
          accessibilityLabel="Add item"
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Text style={styles.buttonText}>Add Item</Text>
        </Pressable>
      </View>

      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable
                style={{ backgroundColor: '#e4572e', justifyContent: 'center', alignItems: 'center', width: 80, height: '100%' }}
                onPress={() => clearItem(item.id)}
              >
                <MaterialCommunityIcons name="delete" size={28} color="#fff" />
              </Pressable>
            )}
          >
            <CurrentItemCard item={item} markAsFinished={markAsFinished} />
          </Swipeable>
        )}
        ListEmptyComponent={
          <Animatable.View animation="fadeInUp" duration={600} style={styles.emptyState}>
            <MaterialCommunityIcons name="cart-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No current items</Text>
            <Text style={styles.emptySubtext}>Add items to track their duration</Text>
          </Animatable.View>
        }
      />
    </SafeAreaView>
  );
}

function ShoppingListScreen({ items, clearItem, clearAll }) {
  const shoppingItems = items.filter(item => item.finished);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="cart-outline" size={24} color="#4a7c59" style={{ marginRight: 8 }} />
          <Text style={styles.title}>Shopping List</Text>
        </View>
        <Pressable
          style={styles.clearAllButton}
          onPress={clearAll}
        >
          <Text style={styles.clearAllButtonText}>Clear All</Text>
        </Pressable>
      </View>

      <FlatList
        data={shoppingItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        renderItem={({ item }) => (
          <ShoppingItemCard item={item} clearItem={clearItem} />
        )}
        ListEmptyComponent={
          <Animatable.View animation="fadeInUp" duration={600} style={styles.emptyState}>
            <MaterialCommunityIcons name="check-circle-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Shopping list is empty</Text>
            <Text style={styles.emptySubtext}>Mark items as empty to add them here</Text>
          </Animatable.View>
        }
      />
    </SafeAreaView>
  );
}

function CurrentItemCard({ item, markAsFinished }) {
  const cardRef = useRef(null);
  const daysPillRef = useRef(null);
  const totalDays = Math.ceil((new Date(item.finishDate) - new Date(item.addedDate)) / (1000 * 60 * 60 * 24));
  const daysLeft = getDaysRemaining(item.finishDate);
  const progress = Math.max(0, daysLeft / totalDays);
  const urgencyLevel = item.urgencyLevel || (daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low');
  const emoji = getItemEmoji(item.name);

  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (daysLeft === 1) {
      daysPillRef.current?.pulse(1000);
    }
  }, [daysLeft]);

  return (
    <>
      <Animatable.View
        ref={cardRef}
        animation="fadeInUp"
        duration={500}
        style={[
          styles.itemCard,
          styles[`${urgencyLevel}Priority`]
        ]}
      >
        <Pressable
          onPressIn={() => cardRef.current?.pulse(300)}
          onPress={() => setSelectedItem(item)}
          style={{ flex: 1 }}
        >
          <View style={styles.itemHeader}>
            <Text style={styles.itemEmoji}>{emoji}</Text>
            <Text style={styles.itemName}>{item.name}</Text>
            <View
              ref={daysLeft === 1 ? daysPillRef : null}
              style={[
                styles.daysPill,
                styles[`${urgencyLevel}Pill`]
              ]}
            >
              <Text style={styles.daysText}>
                {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
              </Text>
            </View>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>ADDED:</Text>
            <Text style={styles.dateValue}>{formatDate(new Date(item.addedDate))}</Text>
          </View>
          <Progress.Bar progress={progress} width={null} color="#4a7c59" style={{ marginTop: 8 }} />
          <Pressable
            onPress={() => {
              cardRef.current.fadeOutLeft(300).then(() => markAsFinished(item.id));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={({ pressed }) => [
              styles.emptyButton,
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={styles.emptyButtonText}>Empty</Text>
          </Pressable>
        </Pressable>
      </Animatable.View>

      <Modal visible={!!selectedItem} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 300 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{selectedItem?.name}</Text>
            <Text>Added: {formatDate(new Date(selectedItem?.addedDate))}</Text>
            <Text>Expires: {formatDate(new Date(selectedItem?.finishDate))}</Text>
            <Pressable onPress={() => setSelectedItem(null)} style={{ marginTop: 20 }}>
              <Text style={{ color: '#e4572e', fontWeight: 'bold' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function ShoppingItemCard({ item, clearItem }) {
  const cardRef = useRef(null);
  const emoji = getItemEmoji(item.name);

  return (
    <Animatable.View
      ref={cardRef}
      animation="fadeInUp"
      duration={500}
      style={[
        styles.shoppingCard,
        styles[`${item.urgencyLevel || 'low'}Priority`]
      ]}
    >
      <Text style={styles.itemEmoji}>{emoji}</Text>
      <Text style={styles.itemName}>{item.name}</Text>
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>ADDED:</Text>
        <Text style={styles.dateValue}>{formatDate(new Date(item.addedDate))}</Text>
      </View>
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>FINISHED:</Text>
        <Text style={styles.dateValue}>{formatDate(new Date(item.finishDate))}</Text>
      </View>
      <Pressable
        onPressIn={() => cardRef.current?.pulse(300)}
        onPress={() => {
          cardRef.current.fadeOutLeft(300).then(() => clearItem(item.id));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        style={({ pressed }) => [
          styles.boughtButton,
          pressed && styles.buttonPressed
        ]}
      >
        <Text style={styles.boughtButtonText}>Bought</Text>
      </Pressable>
    </Animatable.View>
  );
}

function AboutScreen() {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f7f7f7' }]}>
      <View style={[styles.header, { borderBottomColor: '#e0e0e0', backgroundColor: '#f7f7f7' }]}>
        <MaterialCommunityIcons name="information-outline" size={26} color="#4a7c59" style={{ marginRight: 8 }} />
        <Text style={[styles.title, { color: '#222', fontWeight: '700' }]}>About</Text>
      </View>
      <View style={{ padding: 32, alignItems: 'center' }}>
        <MaterialCommunityIcons name="cart-outline" size={48} color="#4a7c59" style={{ marginBottom: 16 }} />
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: '#222',
          marginBottom: 6,
          textAlign: 'center',
          letterSpacing: 0.5,
        }}>
          Grocery Tracker
        </Text>
        <Text style={{
          fontSize: 14,
          color: '#555',
          marginBottom: 18,
          textAlign: 'center',
          fontStyle: 'italic',
          fontWeight: '400',
          lineHeight: 20,
        }}>
          Built for everyone who keeps life running smoothly — especially all the dedicated moms, wives, daughters, and every caring soul who makes sure nothing runs out.
        </Text>
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 10,
          padding: 18,
          marginBottom: 18,
          width: '100%',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#ececec',
        }}>
          <Text style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>
            Version <Text style={{ color: '#4a7c59', fontWeight: '600' }}>1.0.0</Text>
          </Text>
          <Text style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>
            Made by <Text style={{
              color: '#4a7c59',
              fontWeight: '600',
              fontSize: 15,
            }}>Aditya Sharma</Text>
          </Text>
          <Text style={{ fontSize: 14, color: '#888' }}>
            Contact:{' '}
            <Text
              style={{
                color: '#e4572e',
                fontWeight: '600',
                textDecorationLine: 'underline',
              }}
              selectable
              onPress={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText('adityasharma24109@gmail.com');
                }
              }}
            >
              adityasharma24109@gmail.com
            </Text>
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 8 }}>
          Thank you for using Grocery Tracker! Your feedback is always welcome.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function SplashScreen() {
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#f7f7f7',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <View style={{
        width: 160,
        height: 160,
        borderRadius: 80, // makes it a perfect circle
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        // Optional: subtle shadow for depth
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      }}>
        <Image
          source={require('./assets/logo.png')}
          style={{
            width: 110,
            height: 110,
            borderRadius: 55, // makes the logo itself round if it's square
            resizeMode: 'contain',
            backgroundColor: 'transparent',
          }}
        />
      </View>
      <Text style={{
        fontSize: 28,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 12,
        letterSpacing: 0.5,
        textAlign: 'center'
      }}>
        Grocery Tracker
      </Text>
      <Text style={{
        fontSize: 15,
        color: '#4a7c59',
        textAlign: 'center',
        fontStyle: 'italic',
        maxWidth: 280,
        lineHeight: 22,
      }}>
        Made for everyone who keeps life running smoothly of themselves and others &lt;3
      </Text>
    </View>
  );
}

// Main App component
export default function App() {
  const [itemName, setItemName] = useState('');
  const [daysToFinish, setDaysToFinish] = useState('');
  const [items, setItems] = useState([]);
  const [showSplash, setShowSplash] = useState(true);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: isDark ? '#181a20' : '#f8f9fa',
    },
    header: {
      padding: 20,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    title: {
      fontSize: 22,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
    },
    inputGroup: {
      padding: 20,
      paddingBottom: 10,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      backgroundColor: isDark ? '#23262f' : '#fff',
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#fff' : '#333',
    },
    addButton: {
      backgroundColor: '#4a7c59',
      borderRadius: 8,
      padding: 15,
      alignItems: 'center',
    },
    buttonPressed: {
      opacity: 0.8,
    },
    buttonText: {
      color: '#fff',
      fontWeight: '500',
      fontSize: 16,
    },
    listContent: {
      padding: 24,
      paddingTop: 16,
    },
    itemCard: {
      backgroundColor: isDark ? '#23262f' : '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderLeftWidth: 4,
      // Shadow for iOS
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      // Elevation for Android
      elevation: 3,
    },
    lowPriority: {
      borderLeftColor: '#a5c882',
    },
    mediumPriority: {
      borderLeftColor: '#e6af2e',
    },
    highPriority: {
      borderLeftColor: '#e4572e',
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    itemEmoji: {
      fontSize: 26,
      marginRight: 8,
      marginLeft: -2,
      alignSelf: 'center',
    },
    itemName: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#fff' : '#222',
      flex: 1,
      marginLeft: 2,
    },
    daysPill: {
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginLeft: 10,
    },
    lowPill: {
      backgroundColor: '#a5c882',
    },
    mediumPill: {
      backgroundColor: '#e6af2e',
    },
    highPill: {
      backgroundColor: '#e4572e',
    },
    daysText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 13,
    },
    dateRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    dateLabel: {
      fontSize: 12,
      color: '#aaa',
      textTransform: 'uppercase',
      fontWeight: '600',
      width: 60,
      letterSpacing: 1,
    },
    dateValue: {
      fontSize: 13,
      color: '#666',
      flexShrink: 1,
      flexWrap: 'wrap',
    },
    actionButton: {
      marginTop: 10,
      padding: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#ddd',
      alignItems: 'center',
    },
    actionButtonText: {
      color: '#e4572e',
      fontWeight: '500',
    },
    shoppingCard: {
      backgroundColor: isDark ? '#23262f' : '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderLeftWidth: 4,
      flex: 1,
      margin: 8,
      minWidth: 0,
      maxWidth: '48%',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: 120,
      // Shadow for iOS
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      // Elevation for Android
      elevation: 3,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 18,
      color: '#999',
      marginTop: 16,
      fontWeight: '500',
    },
    emptySubtext: {
      fontSize: 14,
      color: '#bbb',
      textAlign: 'center',
    },
    boughtButton: {
      marginTop: 10,
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 6,
      backgroundColor: '#4a7c59',
      alignItems: 'center',
      alignSelf: 'flex-start',
    },
    boughtButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 15,
    },
    emptyButton: {
      paddingVertical: 6,
      paddingHorizontal: 18,
      backgroundColor: '#fff',
      borderColor: '#e4572e',
      borderWidth: 1,
      borderRadius: 20,
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginTop: 8,
      minWidth: 70,
    },
    emptyButtonText: {
      fontWeight: '600',
      color: '#e4572e',
      fontSize: 14,
      letterSpacing: 0.5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.1)',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
    },
    menuModal: {
      backgroundColor: '#fff',
      borderRadius: 8,
      paddingHorizontal: 18,
      marginTop: 60,
      marginRight: 20,
      // Shadow for iOS
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      // Elevation for Android
      elevation: 3,
    },
    clearAllButton: {
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    clearAllButtonText: {
      color: '#e4572e',
      fontWeight: '600',
      fontSize: 16,
    },
    menuButton: {
      position: 'absolute',
      right: 16,
      top: 18,
      padding: 6,
      zIndex: 10,
    },
    modalOverlayActive: {
      flex: 1,
      backgroundColor: 'rgba(30, 60, 120, 0.18)', // subtle blue overlay
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
    },
  };

  const addItem = () => {
    if (!itemName.trim() || !daysToFinish.trim()) {
      inputGroupRef.current?.shake(500);
      return;
    }

    const days = parseInt(daysToFinish);
    if (isNaN(days) || days <= 0) return;

    const today = new Date();
    const finishDate = new Date(today);
    finishDate.setDate(today.getDate() + days);

    // Determine urgencyLevel
    let urgencyLevel = 'low';
    if (days <= 3) urgencyLevel = 'high';
    else if (days <= 7) urgencyLevel = 'medium';

    const newItem = {
      id: Date.now().toString(),
      name: itemName.trim(),
      addedDate: today.toISOString(),
      finishDate: finishDate.toISOString(),
      finished: false,
      urgencyLevel, // Save the color level
    };

    setItems([...items, newItem]);
    setItemName('');
    setDaysToFinish('');

    // Schedule notifications
    scheduleItemNotifications(newItem.name, finishDate);
  };

  const markAsFinished = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, finished: true } : item
    ));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const clearItem = (id) => {
    setItems(items.filter(item => item.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const clearAll = () => {
    Alert.alert(
      "Clear All",
      "Are you sure you want to clear all finished items?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", style: "destructive", onPress: () => {
            setItems(items.filter(item => !item.finished));
          }
        }
      ]
    );
  };

  useEffect(() => {
    AsyncStorage.getItem('groceryItems').then(data => {
      if (data) setItems(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('groceryItems', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800); // 1.8 seconds
    return () => clearTimeout(timer);
  }, []);

  async function scheduleItemNotifications(itemName, finishDate) {
    // Notification for 2 days left
    const twoDaysLeft = new Date(finishDate);
    twoDaysLeft.setDate(twoDaysLeft.getDate() - 2);
    twoDaysLeft.setHours(9, 0, 0, 0); // 9 AM

    if (twoDaysLeft > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ 2 days left!",
          body: `${itemName} will finish in 2 days.`,
        },
        trigger: twoDaysLeft,
      });
    }

    // Notification for finish day
    const finishDay = new Date(finishDate);
    finishDay.setHours(9, 0, 0, 0); // 9 AM

    if (finishDay > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✅ Item finished!",
          body: `${itemName} is scheduled to finish today.`,
        },
        trigger: finishDay,
      });
    }
  }

  if (showSplash) return <SplashScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Current Items') {
                iconName = focused ? 'format-list-checks' : 'format-list-bulleted';
              } else if (route.name === 'Shopping List') {
                iconName = focused ? 'cart' : 'cart-outline';
              } else {
                iconName = focused ? 'information' : 'information-outline';
              }
              return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#4a7c59',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: {
              backgroundColor: '#f8f9fa',
              borderTopWidth: 1,
              borderTopColor: '#eee',
              height: 60,
              paddingBottom: 5
            },
            headerShown: false,
          })}
        >
          <Tab.Screen name="Current Items">
            {() => (
              <CurrentItemsScreen
                items={items}
                markAsFinished={markAsFinished}
                addItem={addItem}
                itemName={itemName}
                setItemName={setItemName}
                daysToFinish={daysToFinish}
                setDaysToFinish={setDaysToFinish}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Shopping List">
            {() => <ShoppingListScreen items={items} clearItem={clearItem} clearAll={clearAll} />}
          </Tab.Screen>
          <Tab.Screen
            name="About"
            component={AboutScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="information-outline" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  inputGroup: {
    padding: 20,
    paddingBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4a7c59',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
  listContent: {
    padding: 24,
    paddingTop: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 3,
  },
  lowPriority: {
    borderLeftColor: '#a5c882',
  },
  mediumPriority: {
    borderLeftColor: '#e6af2e',
  },
  highPriority: {
    borderLeftColor: '#e4572e',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemEmoji: {
    fontSize: 26,
    marginRight: 8,
    marginLeft: -2,
    alignSelf: 'center',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    flex: 1,
    marginLeft: 2,
  },
  daysPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  lowPill: {
    backgroundColor: '#a5c882',
  },
  mediumPill: {
    backgroundColor: '#e6af2e',
  },
  highPill: {
    backgroundColor: '#e4572e',
  },
  daysText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dateLabel: {
    fontSize: 12,
    color: '#aaa',
    textTransform: 'uppercase',
    fontWeight: '600',
    width: 60,
    letterSpacing: 1,
  },
  dateValue: {
    fontSize: 13,
    color: '#666',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  actionButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#e4572e',
    fontWeight: '500',
  },
  shoppingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    flex: 1,
    margin: 8,
    minWidth: 0,
    maxWidth: '48%',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 120,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
  },
  boughtButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: '#4a7c59',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  boughtButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyButton: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    borderColor: '#e4572e',
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    minWidth: 70,
  },
  emptyButtonText: {
    fontWeight: '600',
    color: '#e4572e',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 18,
    marginTop: 60,
    marginRight: 20,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 3,
  },
  clearAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  clearAllButtonText: {
    color: '#e4572e',
    fontWeight: '600',
    fontSize: 16,
  },
  menuButton: {
    position: 'absolute',
    right: 16,
    top: 18,
    padding: 6,
    zIndex: 10,
  },
  modalOverlayActive: {
    flex: 1,
    backgroundColor: 'rgba(30, 60, 120, 0.18)', // subtle blue overlay
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
});