import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, Auth } from '../config/api';

export default function ChatListScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Load user on mount
  useEffect(() => {
    Auth.getUser().then(user => {
      setCurrentUser(user);
    });
  }, []);

  // Fetch chats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        fetchChats();
      }
    }, [currentUser])
  );

  const fetchChats = async () => {
    if (!currentUser) return;
    
    try {
      // 1. Fetch Conversations
      const response = await api.get(`/conversations?licensePlate=${currentUser.licensePlate}`);
      
      // 2. Fetch Blocks
      const blocksRes = await api.get(`/safety?action=listBlocks&blockerId=${currentUser.id}`);
      let blockedIds = [];
      if (blocksRes.ok) {
         blockedIds = await blocksRes.json();
      }

      if (response.ok) {
        const data = await response.json();
        
        const formatted = data
          .map(conv => {
            // Identify the OTHER participant
            const otherPlate = conv.participants.find(p => p !== currentUser.licensePlate) || 'Unknown';
            return {
                id: conv.id,
                recipientName: 'Driver',
                licensePlate: otherPlate,
                lastMessage: conv.lastMessage,
                timestamp: conv.timestamp,
                unread: (conv.unreadCounts?.[currentUser.licensePlate] || 0) > 0,
                unreadCount: conv.unreadCounts?.[currentUser.licensePlate] || 0
            };
          })
          // Filter out blocked users (using licensePlate as ID for now, as discussed in safety.js)
          .filter(chat => !blockedIds.includes(chat.licensePlate));
          
        setChats(formatted);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => navigation.navigate('Chat', {
        recipientName: item.recipientName, // Ideally we fetch the real username later
        licensePlate: item.licensePlate,
      })}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {item.licensePlate.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.recipientName}>{item.licensePlate}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
        <Text 
          style={[
            styles.lastMessage, 
            item.unread && styles.unreadMessage
          ]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
      
      {item.unread && (
          <View style={styles.unreadDot}>
            {item.unreadCount > 1 && (
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
            )}
          </View>
      )}
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {chats.length > 0 ? (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>No chats yet</Text>
          <Text style={styles.emptySubtext}>
            Search for cars to start chatting
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 10,
  },
  chatCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  licensePlate: {
    fontSize: 14,
    color: '#667eea',
    marginBottom: 4,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadMessage: {
    fontWeight: 'bold',
    color: '#333',
  },
  unreadDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
