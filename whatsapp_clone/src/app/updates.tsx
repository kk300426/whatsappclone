import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  Modal, Image, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { styles } from './styles';
import { Avatar, Icon } from './otherfeatures';
import { images } from './assets';
import { Theme, StatusUpdate, User } from '../types/types';
import { API_URL, getAuthHeaders } from '../../config';

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Updates({ theme, currentUser, token }: { theme: Theme; currentUser: User; token: string }) {
  const [statuses, setStatuses] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<StatusUpdate | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [statusImage, setStatusImage] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => { loadStatuses(); }, []);

  const loadStatuses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/status`, { headers: getAuthHeaders(token) });
      const data = await response.json();
      setStatuses(Array.isArray(data) ? data : []);
    } catch {
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const postStatus = async () => {
    if (!statusText.trim() && !statusImage) {
      Alert.alert('Error', 'Add text or image');
      return;
    }
    setPosting(true);
    try {
      let mediaUrl = '';
      if (statusImage) {
        const uploadResponse = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: getAuthHeaders(token),
          body: JSON.stringify({ base64: statusImage, ext: 'jpg' }),
        });
        const { url } = await uploadResponse.json();
        mediaUrl = url;
      }
      const response = await fetch(`${API_URL}/status`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          content: statusText,
          media_url: mediaUrl,
          type: statusImage ? 'image' : 'text',
        }),
      });
      if (response.ok) {
        setShowCreate(false);
        setStatusText('');
        setStatusImage('');
        loadStatuses();
      } else {
        Alert.alert('Error', 'Could not post status');
      }
    } catch {
      Alert.alert('Error', 'Server error');
    } finally {
      setPosting(false);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setStatusImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const myStatuses = statuses.filter((status) => status.user_id === currentUser.id);
  const contactStatuses: Record<string, StatusUpdate[]> = {};
  statuses.filter((status) => status.user_id !== currentUser.id).forEach((status) => {
    if (!contactStatuses[status.user_id]) contactStatuses[status.user_id] = [];
    contactStatuses[status.user_id].push(status);
  });

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, paddingTop: 20 }]}>
        <Text style={[styles.brand, { color: theme.text, fontSize: 32 }]}>Updates</Text>
        <View style={styles.headerRight}>
          <Icon source={images.search} size={28} tintColor={theme.text} />
          <Icon source={images.dots} size={26} tintColor={theme.text} />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#00a884" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <Text style={{ color: theme.text, fontSize: 30, fontWeight: '800', paddingHorizontal: 28, paddingTop: 22, paddingBottom: 18 }}>
            Status
          </Text>
          <Pressable style={[styles.statusRow, { borderBottomColor: theme.border, paddingHorizontal: 28 }]} onPress={() => setShowCreate(true)}>
            <View style={{ position: 'relative' }}>
              <Avatar name={currentUser.username} uri={currentUser.profile_pic} size={64} />
              <View style={[styles.statusAddBtn, { width: 28, height: 28, position: 'absolute', bottom: -2, right: -2, borderRadius: 14 }]}>
                <Text style={{ color: '#fff', fontSize: 22, lineHeight: 25, fontWeight: '700' }}>+</Text>
              </View>
            </View>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusName, { color: theme.text, fontSize: 20 }]}>Add status</Text>
              <Text style={[styles.statusTime, { color: theme.muted, fontSize: 17 }]}>
                {myStatuses.length > 0 ? `${myStatuses.length} update${myStatuses.length !== 1 ? 's' : ''}` : 'Disappears after 24 hours'}
              </Text>
            </View>
          </Pressable>

          <Text style={{ color: theme.muted, fontSize: 16, fontWeight: '800', paddingHorizontal: 28, paddingTop: 28, paddingBottom: 10 }}>
            Recent updates
          </Text>
          {Object.entries(contactStatuses).map(([uid, userStatuses]) => {
            const latest = userStatuses[0];
            return (
              <Pressable key={uid} style={[styles.statusRow, { borderBottomColor: theme.border, paddingHorizontal: 28 }]} onPress={() => setViewing(latest)}>
                <View style={styles.statusRing}>
                  <Avatar name={latest.user.username} uri={latest.user.profile_pic} size={56} />
                </View>
                <View style={styles.statusInfo}>
                  <Text style={[styles.statusName, { color: theme.text, fontSize: 20 }]}>{latest.user.username}</Text>
                  <Text style={[styles.statusTime, { fontSize: 17 }]}>{formatTime(latest.created_at)}</Text>
                </View>
              </Pressable>
            );
          })}
          {Object.keys(contactStatuses).length === 0 && myStatuses.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Image source={images.updates} style={{ width: 50, height: 50, tintColor: theme.muted }} />
              <Text style={{ color: theme.muted, marginTop: 12, fontSize: 15 }}>No status updates yet</Text>
            </View>
          )}
        </ScrollView>
      )}

      <Pressable style={[styles.fab, { bottom: 80 }]} onPress={() => setShowCreate(true)}>
        <Icon source={images.camera} size={30} tintColor="#fff" />
      </Pressable>

      <Modal visible={!!viewing} animationType="fade" onRequestClose={() => setViewing(null)}>
        <View style={styles.statusViewBg}>
          <Pressable style={styles.statusViewClose} onPress={() => setViewing(null)}>
            <Text style={{ color: '#fff', fontSize: 26 }}>x</Text>
          </Pressable>
          {viewing?.media_url && <Image source={{ uri: `${API_URL}${viewing.media_url}` }} style={styles.statusViewImg} />}
          {viewing?.content && <Text style={styles.statusViewText}>{viewing.content}</Text>}
          <Text style={styles.statusViewTime}>{viewing ? formatTime(viewing.created_at) : ''}</Text>
        </View>
      </Modal>

      <Modal visible={showCreate} animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={[{ flex: 1 }, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { backgroundColor: theme.background }]}>
            <Pressable onPress={() => { setShowCreate(false); setStatusText(''); setStatusImage(''); }}>
              <Text style={{ color: theme.text, fontSize: 22 }}>x</Text>
            </Pressable>
            <Text style={[styles.brand, { fontSize: 18, marginLeft: 12, color: theme.text }]}>New Status</Text>
          </View>
          <View style={{ flex: 1, padding: 20 }}>
            {statusImage ? (
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Image source={{ uri: statusImage }} style={{ width: 200, height: 200, borderRadius: 12 }} />
                <Pressable onPress={() => setStatusImage('')} style={{ marginTop: 8 }}>
                  <Text style={{ color: '#f33' }}>Remove image</Text>
                </Pressable>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                style={{ alignItems: 'center', padding: 20, borderRadius: 12, borderWidth: 2, borderColor: theme.border, borderStyle: 'dashed', marginBottom: 16 }}
              >
                <Icon source={images.camera} size={32} tintColor={theme.text} />
                <Text style={{ color: theme.muted, marginTop: 8 }}>Add a photo</Text>
              </TouchableOpacity>
            )}
            <TextInput
              style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, fontSize: 16, color: theme.text, minHeight: 100, textAlignVertical: 'top' }}
              placeholder="Type a status..."
              placeholderTextColor={theme.muted}
              value={statusText}
              onChangeText={setStatusText}
              multiline
            />
          </View>
          <TouchableOpacity style={[styles.authButton, { margin: 20, marginBottom: 36 }]} onPress={postStatus} disabled={posting}>
            {posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.authButtonText}>Share Status</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
