import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';

export default function LicensePlateSearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Mock data - in a real app, this would fetch from a backend
  const mockCars = [
    { id: '1', plate: 'ABC123', owner: 'John Doe', model: 'Tesla Model 3' },
    { id: '2', plate: 'XYZ789', owner: 'Jane Smith', model: 'Honda Civic' },
    { id: '3', plate: 'DEF456', owner: 'Mike Johnson', model: 'Toyota Camry' },
    { id: '4', plate: 'GHI789', owner: 'Alice Cooper', model: 'Ford Mustang' },
    { id: '5', plate: 'JKL012', owner: 'Bob Marley', model: 'Chevrolet Camaro' },
    { id: '6', plate: 'MNO345', owner: 'Charlie Chaplin', model: 'Volkswagen Beetle' },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a license plate');
      return;
    }

    try {
      const response = await fetch(`/api/cars?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to search cars');
    }
  };

  const handleStartChat = (car) => {
    navigation.navigate('Chat', { 
      recipientName: car.owner,
      licensePlate: car.plate,
    });
  };

  const renderCarItem = ({ item }) => (
    <View style={styles.carCard}>
      <View style={styles.carInfo}>
        <Text style={styles.licensePlate}>{item.plate}</Text>
        <Text style={styles.carModel}>{item.model}</Text>
        <Text style={styles.ownerName}>Owner: {item.owner}</Text>
      </View>
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => handleStartChat(item)}
      >
        <Text style={styles.chatButtonText}>Chat</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter license plate..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderCarItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No cars found' : 'Search for a license plate to connect'}
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
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#667eea',
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  searchButtonText: {
    fontSize: 24,
  },
  listContainer: {
    padding: 15,
  },
  carCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  carInfo: {
    flex: 1,
  },
  licensePlate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  carModel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 14,
    color: '#999',
  },
  chatButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  chatButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
