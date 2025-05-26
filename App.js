import React, { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable } from 'react-native-gesture-handler';
import * as Progress from 'react-native-progress';
import { Picker } from '@react-native-picker/picker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { Alert, Image, Keyboard, Platform, Animated } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Modal, TouchableOpacity } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

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

function CurrentItemsScreen({ items, markAsFinished, addItem, itemName, setItemName, daysToFinish, setDaysToFinish, userName, inputGroupRef, clearItem }) {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const currentItems = items.filter(item => !item.finished);
  const filteredItems = currentItems.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

  const [sortBy, setSortBy] = useState('urgency'); // or 'name', 'date'

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'urgency') return a.urgencyLevel.localeCompare(b.urgencyLevel);
    if (sortBy === 'name' ) return a.name.localeCompare(b.name);
    if (sortBy === 'date' ) return new Date(a.addedDate) - new Date(b.addedDate);
    return 0;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#4a7c59" style={{ marginRight: 8 }} />
          <Text style={styles.title}>Current Items</Text>
        </View>
        {userName ? (
          <Text style={{ fontSize: 16, color: '#4a7c59', fontWeight: '600', marginLeft: 8 }}>
            Hello, {userName}!
          </Text>
        ) : null}
      </View>

      {/* Search Bar at the top */}
      <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 }}>
        <TextInput
          placeholder="Search items..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
          style={{
            padding: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#ddd',
            backgroundColor: '#fff',
            fontSize: 16,
            color: '#333',
          }}
        />
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
        )
        }
        ListEmptyComponent={
          <Animatable.View animation="fadeInUp" duration={600} style={styles.emptyState}>
            <MaterialCommunityIcons name="cart-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No current items</Text>
            <Text style={styles.emptySubtext}>Add items to track their duration</Text>
          </Animatable.View>
        }
        numColumns={1}
      />

      {/* Floating Action Button */}
      <Pressable
        onPress={() => setShowAddModal(true)}
        style={{
          position: 'absolute',
          bottom: 32,
          right: 32,
          backgroundColor: '#4a7c59',
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 5,
        }}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#fff" />
      </Pressable>

      {/* Add Item Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.2)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 24,
            width: 320,
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Add Item</Text>
            <Animatable.View ref={inputGroupRef} style={{ width: '100%' }}>
              <View style={[styles.inputRow, { marginBottom: 12 }]}>
                <MaterialCommunityIcons name="cart-outline" size={22} color="#aaa" style={styles.inputIcon} />
                <TextInput
                  placeholder="Item name"
                  placeholderTextColor="#999"
                  value={itemName}
                  onChangeText={setItemName}
                  style={styles.input}
                />
              </View>
              <View style={[styles.inputRow, { marginBottom: 12 }]}>
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
            </Animatable.View>
            <AnimatedButton
              style={{
                backgroundColor: '#4a7c59',
                borderRadius: 8,
                padding: 14,
                alignItems: 'center',
                width: 160,
              }}
              textStyle={{ color: '#fff', fontWeight: '600', fontSize: 17 }}
              onPress={() => {
                if (addItem()) {
                  setShowAddModal(false);
                }
              }}
            >
              Add Item
            </AnimatedButton>
            <Pressable onPress={() => setShowAddModal(false)} style={{ marginTop: 12 }}>
              <Text style={{ color: '#e4572e', fontWeight: 'bold' }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ShoppingListScreen({ items, clearItem, clearAll, userName }) {
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
    if (
      Platform.OS !== 'web' &&
      daysLeft === 1 &&
      daysPillRef.current &&
      typeof daysPillRef.current.pulse === 'function'
    ) {
      daysPillRef.current.pulse(1000);
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
          styles[`${item.urgencyLevel}Priority`]
        ]}
      >
        <Pressable
          onPressIn={() => {
            if (cardRef.current && typeof cardRef.current.pulse === 'function') {
              cardRef.current.pulse(300);
            }
          }}
          onPress={() => setSelectedItem(item)}
          style={{ flex: 1 }}
        >
          <View style={styles.itemHeader}>
            <Text style={styles.itemEmoji}>{emoji}</Text>
            <Text
              style={styles.itemName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
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
          <AnimatedButton
            style={styles.actionButton}
            textStyle={styles.actionButtonText}
            onPress={() => {
              if (cardRef.current && typeof cardRef.current.fadeOutLeft === 'function') {
                cardRef.current.fadeOutLeft(300).then(() => markAsFinished(item.id));
              } else {
                markAsFinished(item.id);
              }
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            Empty
          </AnimatedButton>
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
      <AnimatedButton
        style={styles.boughtButton}
        textStyle={styles.boughtButtonText}
        onPress={() => {
          if (cardRef.current && typeof cardRef.current.fadeOutLeft === 'function') {
            cardRef.current.fadeOutLeft(300).then(() => clearItem(item.id));
          } else {
            clearItem(item.id);
          }
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
      >
        Bought
      </AnimatedButton>
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
          Built for everyone who keeps life running smoothly — especially all the dedicated moms, wives, daughters, and every unsung hero.
        </Text>
        <View style={{
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
        borderRadius: 80,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
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
            borderRadius: 55,
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

function WelcomeScreen({ onNameSet }) {
  const [name, setName] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);

  const handleContinue = async () => {
    if (name.trim()) {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      setShowAnimation(true);
      setTimeout(() => {
        setShowAnimation(false);
        onNameSet(name.trim());
      }, 1200);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
      {showAnimation ? (
        <Animatable.View animation="bounceIn" duration={900} style={{ alignItems: 'center' }}>
          <LottieView
            source={require('./assets/confetti.json')}
            autoPlay
            loop={false}
            style={{ width: 180, height: 180 }}
          />
          <Text style={{ fontSize: 24, color: '#4a7c59', fontWeight: 'bold', marginTop: 16 }}>
            Welcome, {name.trim()}!
          </Text>
        </Animatable.View>
      ) : (
        <>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#4a7c59', marginBottom: 18 }}>Welcome!</Text>
          <Text style={{ fontSize: 16, color: '#333', marginBottom: 24, textAlign: 'center', maxWidth: 300 }}>
            Please enter your name to personalize your Grocery Tracker experience.
          </Text>
          <TextInput
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 12,
              width: 240,
              fontSize: 18,
              marginBottom: 18,
              backgroundColor: '#fff'
            }}
          />
          <AnimatedButton
            style={{
              backgroundColor: '#4a7c59',
              borderRadius: 8,
              padding: 14,
              alignItems: 'center',
              width: 160,
            }}
            textStyle={{ color: '#fff', fontWeight: '600', fontSize: 17 }}
            onPress={handleContinue}
          >
            Continue
          </AnimatedButton>
          <Text
            style={{
              position: 'absolute',
              bottom: 24,
              left: 0,
              right: 0,
              textAlign: 'center',
              color: '#aaa',
              fontSize: 13,
              fontStyle: 'italic',
            }}
          >
            Made by Aditya Sharma
          </Text>
        </>
      )}
    </SafeAreaView>
  );
}

function ChangeNameScreen({ route }) {
  const navigation = useNavigation();
  const [name, setName] = useState(route.params?.userName ?? '');
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: '#e0e0e0' }]}>
        <MaterialCommunityIcons name="account-edit-outline" size={26} color="#4a7c59" style={{ marginRight: 8 }} />
        <Text style={styles.title}>Change Name</Text>
      </View>
      <View style={{ padding: 32 }}>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>Enter your new name:</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            backgroundColor: '#fff',
            color: '#333',
            marginBottom: 16,
          }}
        />
        <AnimatedButton
          style={styles.settingsButton}
          textStyle={styles.settingsButtonText}
          onPress={async () => {
            if ((name ?? '').trim()) {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              route.params.setUserName(name.trim());
              navigation.navigate('MainTabs', { screen: 'Current Items' });
            }
          }}
        >
          Save
        </AnimatedButton>
      </View>
    </SafeAreaView>
  );
}

function SettingsScreen({ userName, setUserName, navigation }) {
  // Feedback handler
  const handleFeedback = () => {
    Alert.alert(
      "Feedback",
      "Send your feedback to adityasharma24109@gmail.com",
      [
        { text: "Copy Email", onPress: () => {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText('adityasharma24109@gmail.com');
              Alert.alert("Copied!", "Email address copied to clipboard.");
            }
          }
        },
        { text: "OK" }
      ]
    );
  };

  // Contact support handler
  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "For support, email: adityasharma24109@gmail.com",
      [
        { text: "Copy Email", onPress: () => {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText('adityasharma24109@gmail.com');
              Alert.alert("Copied!", "Email address copied to clipboard.");
            }
          }
        },
        { text: "OK" }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: '#e0e0e0' }]}>
        <MaterialCommunityIcons name="account-cog-outline" size={26} color="#4a7c59" style={{ marginRight: 8 }} />
        <Text style={styles.title}>Settings</Text>
      </View>
      <View style={{ padding: 32 }}>
        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Change Name', { userName, setUserName })}
        >
          <Text style={styles.settingsButtonText}>Change Name</Text>
        </Pressable>
        <Pressable
          style={styles.settingsButton}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleFeedback();
          }}
        >
          <Text style={styles.settingsButtonText}>Send Feedback</Text>
        </Pressable>
        <Pressable
          style={styles.settingsButtonDestructive}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleContactSupport();
          }}
        >
          <Text style={styles.settingsButtonDestructiveText}>Contact Support</Text>
        </Pressable>
      </View>
      {/* Version at the bottom */}
      <View style={{
        position: 'absolute',
        bottom: 24,
        left: 0,
        right: 0,
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 14, color: '#888' }}>
          Version <Text style={{ color: '#4a7c59', fontWeight: '600' }}>1.0.0</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

// Animated Button Component
const AnimatedButton = ({ style, textStyle, onPress, children, ...props }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={style}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        {...props}
      >
        {typeof children === 'string'
          ? <Text style={textStyle}>{children}</Text>
          : children}
      </Pressable>
    </Animated.View>
  );
};

// Main App component
export default function App() {
  const [itemName, setItemName] = useState('');
  const [daysToFinish, setDaysToFinish] = useState('');
  const [items, setItems] = useState([]);
  const [showSplash, setShowSplash] = useState(true);
  const [userName, setUserName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);

  const inputGroupRef = useRef(null);

  const addItem = () => {
    if (!itemName.trim() || !daysToFinish.trim()) {
      inputGroupRef.current?.shake?.(500);
      return false; // indicate failure
    }

    const days = parseInt(daysToFinish, 10);
    if (isNaN(days) || days <= 0) {
      inputGroupRef.current?.shake?.(500);
      return false; // indicate failure
    }

    const today = new Date();
    const finishDate = new Date(today);
    finishDate.setDate(today.getDate() + days);

    let urgencyLevel = 'low';
    if (days <= 3) urgencyLevel = 'high';
    else if (days <= 7) urgencyLevel = 'medium';

    const newItem = {
      id: Date.now().toString(),
      name: itemName.trim(),
      addedDate: today.toISOString(),
      finishDate: finishDate.toISOString(),
      finished: false,
      urgencyLevel,
    };

    setItems([...items, newItem]);
    setItemName('');
    setDaysToFinish('');

    scheduleItemNotifications(newItem.name, finishDate);

    Keyboard.dismiss();
    return true; // indicate success
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
    AsyncStorage.getItem('userName').then(name => {
      if (name) setUserName(name);
      else setShowNameModal(true);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('groceryItems', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (userName) {
      AsyncStorage.setItem('userName', userName);
      setShowNameModal(false);
    }
  }, [userName]);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-move expired items to Shopping List
    const now = new Date();
    const updated = items.map(item => {
      if (!item.finished && new Date(item.finishDate) < now) {
        return { ...item, finished: true };
      }
      return item;
    });
    // Only update if something changed
    if (JSON.stringify(updated) !== JSON.stringify(items)) {
      setItems(updated);
    }
  }, [items]);

  async function scheduleItemNotifications(itemName, finishDate) {
    if (Platform.OS === 'web') return; // <-- add this line

    const twoDaysLeft = new Date(finishDate);
    twoDaysLeft.setDate(twoDaysLeft.getDate() - 2);
    twoDaysLeft.setHours(9, 0, 0, 0);

    if (twoDaysLeft > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ 2 days left!",
          body: `${itemName} will finish in 2 days.`,
        },
        trigger: twoDaysLeft,
      });
    }

    const finishDay = new Date(finishDate);
    finishDay.setHours(9, 0, 0, 0);

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

  if (!userName) {
    return (
      <SafeAreaProvider>
        <WelcomeScreen
          onNameSet={async (name) => {
            setUserName(name);
            await AsyncStorage.setItem('userName', name);
          }}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs">
              {() => (
                <Tab.Navigator
                  screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                      let iconName;
                      if (route.name === 'Current Items') {
                        iconName = focused ? 'format-list-checks' : 'format-list-bulleted';
                      } else if (route.name === 'Shopping List') {
                        iconName = focused ? 'cart' : 'cart-outline';
                      } else if (route.name === 'About') {
                        iconName = focused ? 'information' : 'information-outline';
                      } else if (route.name === 'Settings') {
                        iconName = 'account-cog-outline';
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
                        userName={userName}
                        inputGroupRef={inputGroupRef}
                        clearItem={clearItem} // <-- add this line
                      />
                    )}
                  </Tab.Screen>
                  <Tab.Screen name="Shopping List">
                    {() => (
                      <ShoppingListScreen
                        items={items}
                        clearItem={clearItem}
                        clearAll={clearAll}
                        userName={userName}
                      />
                    )}
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
                  <Tab.Screen
                    name="Settings"
                    options={{
                      tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account-cog-outline" size={size} color={color} />
                      ),
                    }}
                  >
                    {({ navigation }) => (
                      <SettingsScreen
                        userName={userName}
                        setUserName={setUserName}
                        navigation={navigation}
                      />
                    )}
                  </Tab.Screen>
                </Tab.Navigator>
              )}
            </Stack.Screen>
            <Stack.Screen name="Change Name">
              {({ route }) => (
                <ChangeNameScreen
                  route={route}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
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
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 24,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, // softer shadow
    shadowRadius: 6,     // softer shadow
    elevation: 2,        // softer shadow
    marginHorizontal: 8,
    flex: 1,
    minWidth: 0,
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
    alignItems: 'center',
    gap: 8,
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
    flex: 2,
    marginLeft: 2,
    flexShrink: 1,
    flexWrap: 'nowrap',
    minWidth: 0,
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
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 18,
    backgroundColor: '#f3f4f6', // soft neutral
    alignItems: 'center',
    alignSelf: 'flex-start',
    elevation: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonText: {
    color: '#4a7c59', // accent color
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, // softer shadow
    shadowRadius: 6,     // softer shadow
    elevation: 2,        // softer shadow
  },
  boughtButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 18,
    backgroundColor: '#f3f4f6', // soft neutral
    alignItems: 'center',
    alignSelf: 'flex-start',
    elevation: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  boughtButtonText: {
    color: '#4a7c59', // accent color
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  clearAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
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
    backgroundColor: 'rgba(30, 60, 120, 0.18)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  darkModeButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    width: 160,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
  },
  // Settings tab minimalist buttons
  settingsButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    width: 180,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  settingsButtonText: {
    color: '#4a7c59',
    fontWeight: '600',
    fontSize: 17,
  },
  settingsButtonDestructive: {
    backgroundColor: '#fbeaea',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    width: 180,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  settingsButtonDestructiveText: {
    color: '#e4572e',
    fontWeight: '600',
    fontSize: 17,
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
});