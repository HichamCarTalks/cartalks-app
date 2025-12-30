import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [issueDate, setIssueDate] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const isValidLicensePlate = (plate) => {
    // Basic format check for 6 characters (removing dashes)
    // Matches logic in backend
    const p = plate.replace(/-/g, '').toUpperCase();
    if (p.length !== 6) return false;
    
    const patterns = [
      /^[A-Z]{2}\d{2}\d{2}$/,
      /^\d{2}\d{2}[A-Z]{2}$/,
      /^\d{2}[A-Z]{2}\d{2}$/,
      /^[A-Z]{2}\d{2}[A-Z]{2}$/,
      /^[A-Z]{2}[A-Z]{2}\d{2}$/,
      /^\d{2}[A-Z]{2}[A-Z]{2}$/,
      /^\d{2}[A-Z]{3}\d{1}$/,
      /^\d{1}[A-Z]{3}\d{2}$/,
      /^[A-Z]{2}\d{3}[A-Z]{1}$/,
      /^[A-Z]{1}\d{3}[A-Z]{2}$/,
      /^[A-Z]{3}\d{2}[A-Z]{1}$/,
      /^[A-Z]{1}\d{2}[A-Z]{3}$/,
      /^\d{1}[A-Z]{2}\d{3}$/,
      /^\d{3}[A-Z]{2}\d{1}$/
    ];
    return patterns.some(regex => regex.test(p));
  };

  const handleRegister = async () => {
    if (!username.trim() || !licensePlate.trim() || !password || !confirmPassword || !image || !issueDate) {
      Alert.alert('Error', 'Please fill in all fields and upload your Kentekenkaart');
      return;
    }

    if (!isValidLicensePlate(licensePlate)) {
        Alert.alert('Error', 'Invalid Dutch license plate format. Please check your entry.');
        return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setUploading(true);

    try {
      // 1. Upload Image
      const formData = new FormData();
      formData.append('file', {
        uri: image,
        type: 'image/jpeg',
        name: 'kentekenkaart.jpg',
      });

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!uploadRes.ok) throw new Error('Image upload failed');
      
      const { url: kentekenkaartUrl } = await uploadRes.json();

      // 2. Register User
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          licensePlate,
          password,
          kentekenkaartUrl,
          kentekenkaartIssueDate: issueDate,
        }),
      });

      const data = await response.json();

      if (response.ok || response.status === 201) {
        Alert.alert('Success', 'Registration successful! Verification pending.', [
          { text: 'OK', onPress: () => navigation.replace('Login') }
        ]);
      } else if (response.status === 202) {
        Alert.alert('Pending Review', data.message || 'This license plate is already registered. Your application is under review.', [
            { text: 'OK', onPress: () => navigation.replace('Login') }
        ]);
      } else {
        Alert.alert('Registration Failed', data.body || 'Something went wrong');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Registration process failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the CarTalks community</Text>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="License Plate (e.g., ABC123)"
              placeholderTextColor="#999"
              value={licensePlate}
              onChangeText={setLicensePlate}
              autoCapitalize="characters"
              maxLength={10}
            />

            <TextInput
              style={styles.input}
              placeholder="Issue Date (YYYY-MM-DD)"
              placeholderTextColor="#999"
              value={issueDate}
              onChangeText={setIssueDate}
            />

            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text style={styles.imageButtonText}>
                {image ? 'Change Kentekenkaart Photo' : 'Upload Kentekenkaart Photo'}
              </Text>
            </TouchableOpacity>
            
            {image && <Image source={{ uri: image }} style={styles.previewImage} />}

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}
              disabled={uploading}
            >
              <Text style={styles.buttonText}>
                  {uploading ? 'Processing...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.linkText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#f0f0f0',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  imageButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  imageButtonText: {
    color: '#667eea',
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
    resizeMode: 'cover',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#fff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});