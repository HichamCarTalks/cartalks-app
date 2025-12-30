import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

export default function AdminDashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin?type=stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch users
      const usersRes = await fetch('/api/admin?type=users');
      const usersData = await usersRes.json();
      setUsers(usersData);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`/api/users?id=${user.id}&licensePlate=${user.licensePlate}`, {
                method: 'DELETE'
              });
              if (res.ok || res.status === 204) {
                fetchData(); // Refresh list
              } else {
                Alert.alert('Error', 'Failed to delete user');
              }
            } catch (err) {
              Alert.alert('Error', 'Network error');
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.licensePlate}>{item.licensePlate}</Text>
        <Text style={styles.role}>Role: {item.role || 'user'}</Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteUser(item)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Active Now</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>User Management</Text>
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  list: {
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  licensePlate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  role: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});