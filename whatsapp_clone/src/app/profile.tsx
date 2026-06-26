import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { styles } from './styles';
import { Avatar } from './otherfeatures';
import { Theme, User } from '../types/types';
import { API_URL, getAuthHeaders } from '../../config';

export default function Profile({
  theme, currentUser, token, goBack, onUserUpdate,
}: {
  theme: Theme;
  currentUser: User;
  token: string;
  goBack: () => void;
  onUserUpdate: (u: User) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(currentUser.username);
  const [about, setAbout] = useState(currentUser.about);
  const [profilePic, setProfilePic] = useState(currentUser.profile_pic);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setProfilePic(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/me`, {
        method: 'PUT', headers: getAuthHeaders(token),
        body: JSON.stringify({ username, about, profile_pic: profilePic }),
      });
      const data = await res.json();
      if (res.ok) { onUserUpdate(data); setEditing(false); Alert.alert('Saved', 'Profile updated!'); }
      else Alert.alert('Error', data.error || 'Could not update profile');
    } catch { Alert.alert('Error', 'Server error'); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.backHeader}>
        <Pressable onPress={goBack}><Text style={styles.back}>←</Text></Pressable>
        <Text style={[styles.pageTitle]}>Profile</Text>
        <Pressable onPress={() => setEditing(!editing)} style={{ marginLeft: 'auto' }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{editing ? 'Cancel' : 'Edit'}</Text>
        </Pressable>
      </View>

      {/* Avatar */}
      <View style={styles.profileHero}>
        <Pressable onPress={editing ? pickImage : undefined}>
          <Avatar name={username} uri={profilePic?.startsWith('data:') ? profilePic : profilePic ? `${API_URL}${profilePic}` : ''} size={110} online={currentUser.online} />
          {editing && (
            <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#00a884', borderRadius: 16, padding: 6 }}>
              <Text style={{ fontSize: 14 }}>📷</Text>
            </View>
          )}
        </Pressable>
        {editing ? (
          <TextInput value={username} onChangeText={setUsername}
            style={[styles.profileName, { color: theme.text, borderBottomWidth: 1, borderBottomColor: '#00a884', marginTop: 12, width: '80%', textAlign: 'center' }]} />
        ) : (
          <Text style={[styles.profileName, { color: theme.text }]}>{username}</Text>
        )}
        <Text style={[styles.profileAbout, { color: theme.muted }]}>{currentUser.email}</Text>
      </View>

      {/* Info cards */}
      <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
        <Text style={[{ color: '#00a884', fontSize: 12, marginBottom: 6, fontWeight: '600' }]}>About</Text>
        {editing ? (
          <TextInput value={about} onChangeText={setAbout}
            style={{ color: theme.text, fontSize: 15 }} multiline />
        ) : (
          <Text style={{ color: theme.text, fontSize: 15 }}>{about || 'Hey there! I am using WhatsApp.'}</Text>
        )}
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
        <Text style={[{ color: '#00a884', fontSize: 12, marginBottom: 6, fontWeight: '600' }]}>Email</Text>
        <Text style={{ color: theme.text, fontSize: 15 }}>{currentUser.email}</Text>
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
        <Text style={[{ color: '#00a884', fontSize: 12, marginBottom: 6, fontWeight: '600' }]}>Member Since</Text>
        <Text style={{ color: theme.text, fontSize: 15 }}>
          {new Date(currentUser.last_seen).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {editing && (
        <TouchableOpacity style={[styles.authButton, { margin: 16 }]} onPress={saveChanges} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.authButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}