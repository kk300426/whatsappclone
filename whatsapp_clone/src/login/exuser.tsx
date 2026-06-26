import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, KeyboardAvoidingView, ScrollView,
  Platform, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../app/styles';
import { API_URL } from '../../config';

interface Props {
  onLoginSuccess: (user: any, token: string) => void;
  onNavigateToSignup: () => void;
}

export default function ExUser({ onLoginSuccess, onNavigateToSignup }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const e = email.trim();
    const p = password.trim();
    if (!e || !p) { Alert.alert('Error', 'Enter email and password'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, password: p }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Login Failed', data.error || 'Invalid credentials'); return; }
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.token);
    } catch {
      Alert.alert('Error', 'Cannot connect to server. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.authPage} keyboardShouldPersistTaps="handled">
        <View style={styles.authCard}>
          <View style={styles.authBrand}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#00a884', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 36 }}>💬</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#111b21' }}>WhatsApp</Text>
            <Text style={{ color: '#8696a0', fontSize: 13, marginTop: 4 }}>Sign in to continue</Text>
          </View>

          <Text style={styles.authTitle}>Login</Text>

          <TextInput
            style={styles.authInput}
            placeholder="Email address"
            placeholderTextColor="#8696a0"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.authInput}
            placeholder="Password"
            placeholderTextColor="#8696a0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.authButton} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.authButtonText}>Login</Text>}
          </TouchableOpacity>

          <View style={styles.authFooter}>
            <Text style={styles.authFooterText}>New here?</Text>
            <TouchableOpacity onPress={onNavigateToSignup}>
              <Text style={styles.authLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}