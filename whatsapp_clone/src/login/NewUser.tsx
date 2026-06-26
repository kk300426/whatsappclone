import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { styles } from '../app/styles';
import { Avatar } from '../app/otherfeatures';
import { API_URL } from '../../config';

interface Props {
  onRegisterSuccess: (user: any, token: string) => void;
  onNavigateToLogin: () => void;
}

export default function NewUser({ onRegisterSuccess, onNavigateToLogin }: Props) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo access'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setProfilePic(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleRegister = async () => {
    const u = username.trim(); const e = email.trim(); const p = password.trim();
    if (!u || !e || !p) { Alert.alert('Error', 'All fields are required'); return; }
    if (p !== confirm.trim()) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (p.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, email: e, password: p, profile_pic: profilePic }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Sign Up Failed', data.error || 'Registration failed'); return; }
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      onRegisterSuccess(data.user, data.token);
    } catch {
      Alert.alert('Error', 'Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.authPage} keyboardShouldPersistTaps="handled">
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Create Account</Text>

          <TouchableOpacity onPress={pickImage} style={{ alignSelf: 'center', marginBottom: 16 }}>
            <Avatar name={username || '?'} uri={profilePic} size={80} />
            <Text style={{ color: '#00a884', textAlign: 'center', fontSize: 12, marginTop: 6 }}>Tap to add photo</Text>
          </TouchableOpacity>

          <TextInput style={styles.authInput} placeholder="Username" placeholderTextColor="#8696a0"
            value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextInput style={styles.authInput} placeholder="Email address" placeholderTextColor="#8696a0"
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.authInput} placeholder="Password (min 6 chars)" placeholderTextColor="#8696a0"
            value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput style={styles.authInput} placeholder="Confirm Password" placeholderTextColor="#8696a0"
            value={confirm} onChangeText={setConfirm} secureTextEntry />

          <TouchableOpacity style={styles.authButton} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.authButtonText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.authFooter}>
            <Text style={styles.authFooterText}>Already have an account?</Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.authLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}