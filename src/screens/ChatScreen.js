import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { api, Auth } from '../config/api';

export default function ChatScreen({ route, navigation }) {
  const { recipientName, licensePlate } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [conversationId, setConversationId] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setup();
    // Simple polling for "real-time" (every 5 seconds)
    const interval = setInterval(fetchMessages, 5000);
    
    // Mark messages as read on mount/interval
    markAsRead();
    
    return () => clearInterval(interval);
  }, []);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={showActionSheet} style={{ marginRight: 15 }}>
          <Text style={{ fontSize: 24 }}>⋮</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, currentUser, conversationId]);

  const showActionSheet = () => {
    const options = ['Block User', 'Report User', 'Cancel'];
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
        },
        buttonIndex => handleAction(buttonIndex)
      );
    } else {
        // Android simple alert fallback for MVP
        Alert.alert(
            'Safety Options',
            'Select an action',
            [
                { text: 'Block User', style: 'destructive', onPress: () => handleAction(0) },
                { text: 'Report User', onPress: () => handleAction(1) },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    }
  };

  const handleAction = async (index) => {
    if (index === 0) { // Block
        try {
            // We need to know who we are blocking (licensePlate or derived ID)
            // For now, we assume we block the OTHER party in the conversation.
            // Since conversationId = "PlateA_PlateB", and we know currentUser.plate, 
            // the other one is `licensePlate`.
            // Ideally we need User IDs, but let's see if we can get them.
            // Our safety API expects IDs.
            // We might need to fetch the user ID of the license plate first, or pass plates if API supports it.
            // *Fix*: Let's assume for this MVP we pass `licensePlate` as the ID since it's unique enough for the 'blocks' container logic 
            // if we tweaked it, BUT the backend expects `blockedId`.
            // Let's assume `licensePlate` IS the ID for blocking context to keep it simple, OR we fetch the user.
            
            // Actually, `messages` contain `senderId`. We can grab it from the last message from them.
            const theirMsg = messages.find(m => m.senderName !== currentUser.username);
            const blockedId = theirMsg ? theirMsg.senderId : licensePlate; // Fallback to plate if no msg
            
            await api.post('/safety?action=block', {
                blockerId: currentUser.id,
                blockedId: blockedId
            });
            Alert.alert('Blocked', 'You will no longer receive messages from this user.');
            navigation.goBack();
        } catch (e) {
            Alert.alert('Error', 'Failed to block user');
        }
    } else if (index === 1) { // Report
        Alert.alert('Report', 'User reported to administration.');
        await api.post('/safety?action=report', {
            reporterId: currentUser.id,
            reportedId: licensePlate,
            type: 'user',
            reason: 'User reported via chat'
        });
    }
  };

  const setup = async () => {
    const user = await Auth.getUser();
    if (user) {
      setCurrentUser(user);
      // Create a consistent ID: Alphabetically sorted plates
      // e.g. "AB12CD_XY34YZ"
      const plates = [user.licensePlate, licensePlate].sort();
      const convId = `${plates[0]}_${plates[1]}`;
      setConversationId(convId);
      // Fetch immediately
      fetchMessages(convId);
    }
  };

  const fetchMessages = async (convId = conversationId) => {
    if (!convId) return;
    try {
      const response = await api.get(`/messages?conversationId=${convId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async () => {
    if (conversationId && currentUser) {
        await api.put('/messages', {
            conversationId,
            userId: currentUser.id
        });
    }
  };

  const handleSend = async (imageUrl = null) => {
    const textToSend = message.trim();

    if ((textToSend || imageUrl) && currentUser) {
      setMessage(''); // Optimistic clear

      try {
        const payload = {
          conversationId,
          text: textToSend,
          senderId: currentUser.id,
          senderName: currentUser.username
        };
        
        if (imageUrl) payload.imageUrl = imageUrl;

        const response = await api.post('/messages', payload);
        
        if (response.ok) {
          fetchMessages(); // Refresh
        }
      } catch (e) {
        alert('Failed to send');
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'chat-image.jpg',
        });

        const uploadRes = await api.upload('/upload', formData);
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          // Send immediately as a message
          await handleSend(url);
        } else {
          alert('Failed to upload image');
        }
      } catch (e) {
        console.error(e);
        alert('Error uploading image');
      } finally {
        setUploading(false);
      }
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.senderId === currentUser?.id ? styles.myMessage : styles.theirMessage,
      ]}
    >
      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.messageImage} 
          resizeMode="cover"
        />
      )}
      {item.text ? (
        <Text
          style={[
            styles.messageText,
            item.senderId === currentUser?.id && styles.myMessageText,
          ]}
        >
          {item.text}
        </Text>
      ) : null}
      <Text style={styles.messageTime}>
        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        {item.senderId === currentUser?.id && (
            <Text style={styles.ticks}> {item.read ? '✓✓' : '✓'}</Text>
        )}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{recipientName}</Text>
        <Text style={styles.headerSubtitle}>{licensePlate}</Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={pickImage}
          disabled={uploading}
        >
          <Text style={styles.attachButtonText}>{uploading ? '...' : '📷'}</Text>
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 15,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#f0f0f0',
    marginTop: 2,
  },
  messagesList: {
    padding: 15,
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#667eea',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 5,
  },
  myMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    alignSelf: 'flex-end',
  },
  ticks: {
    fontSize: 12,
    color: '#4CAF50',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  attachButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginRight: 5,
  },
  attachButtonText: {
    fontSize: 24,
  },
  sendButton: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
