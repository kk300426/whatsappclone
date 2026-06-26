import { useCallback, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  Modal, TouchableOpacity, ActivityIndicator, Alert, Image,
} from 'react-native';
import { styles } from './styles';
import { Avatar, Icon } from './otherfeatures';
import { images } from './assets';
import { Theme, Conversation, User } from '../types/types';
import { API_URL, getAuthHeaders } from '../../config';

function formatTime(iso: string) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

function TickIcon({ statuses, senderId, currentUserId }: { statuses: any[]; senderId: string; currentUserId: string }) {
  if (senderId !== currentUserId) return null;
  const otherStatuses = statuses.filter((status) => status.user_id !== currentUserId);
  const allSeen = otherStatuses.length > 0 && otherStatuses.every((status) => status.status === 'seen');
  const allDelivered = otherStatuses.length > 0 && otherStatuses.every((status) => status.status === 'delivered' || status.status === 'seen');
  if (allSeen) return <Text style={{ fontSize: 12, color: '#53bdeb' }}>✓✓</Text>;
  if (allDelivered) return <Text style={{ fontSize: 12, color: '#8696a0' }}>✓✓</Text>;
  return <Text style={{ fontSize: 12, color: '#8696a0' }}>✓</Text>;
}

export default function Chats({
  theme,
  conversations,
  currentUserId,
  token,
  query,
  setQuery,
  openConversation,
  onNewChat,
  onNewGroup,
  openSettings,
  openProfile,
}: {
  theme: Theme;
  conversations: Conversation[];
  currentUserId: string;
  token: string;
  query: string;
  setQuery: (value: string) => void;
  openConversation: (conversation: Conversation) => void;
  onNewChat: (conversation: Conversation) => void;
  onNewGroup: () => void;
  openSettings: () => void;
  openProfile: () => void;
}) {
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  const unreadCount = conversations.reduce((sum, conversation) => sum + (Number(conversation.unread_count) || 0), 0);

  const searchUsers = useCallback(async (value: string) => {
    setUserQuery(value);
    if (value.length < 1) {
      setUsers([]);
      return;
    }
    setSearching(true);
    try {
      const response = await fetch(`${API_URL}/users?q=${encodeURIComponent(value)}`, {
        headers: getAuthHeaders(token),
      });
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setSearching(false);
    }
  }, [token]);

  const startChat = async (userId: string) => {
    setStarting(userId);
    try {
      const response = await fetch(`${API_URL}/conversations`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ member_id: userId }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowUserSearch(false);
        setUserQuery('');
        setUsers([]);
        onNewChat(data);
      } else {
        Alert.alert('Error', data.error || 'Could not start conversation');
      }
    } catch {
      Alert.alert('Error', 'Server error');
    } finally {
      setStarting(null);
    }
  };

  const filtered = conversations.filter((conversation) => {
    const name = conversation.is_group
      ? conversation.name
      : conversation.members?.find((member) => member.id !== currentUserId)?.username || '';
    return (name || '').toLowerCase().includes(query.toLowerCase());
  });

  const getConvName = (conversation: Conversation) =>
    conversation.is_group
      ? conversation.name || 'Group'
      : conversation.members?.find((member) => member.id !== currentUserId)?.username || 'Unknown';

  const getConvPic = (conversation: Conversation) =>
    conversation.is_group
      ? conversation.group_icon
      : conversation.members?.find((member) => member.id !== currentUserId)?.profile_pic || '';

  const getConvOnline = (conversation: Conversation) =>
    !conversation.is_group && (conversation.members?.find((member) => member.id !== currentUserId)?.online || false);

  const getLastMsgText = (conversation: Conversation) => {
    if (!conversation.last_message) return '';
    if (conversation.last_message.is_deleted) return 'This message was deleted';
    if (conversation.last_message.type === 'image') return 'Photo';
    if (conversation.last_message.type === 'voice') return 'Voice message';
    return conversation.last_message.content || '';
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, paddingTop: 20 }]}>
        <Text style={[styles.brand, { color: '#19a65a', fontSize: 32 }]}>WhatsApp</Text>
        <View style={styles.headerRight}>
          <Icon source={images.rupee} size={28} tintColor={theme.text} />
          <Icon source={images.camera} size={30} tintColor={theme.text} />
          <Pressable onPress={() => setShowMenu(true)}>
            <Icon source={images.dots} size={26} tintColor={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.inputBg, marginTop: 8, paddingVertical: 12 }]}>
        <Icon source={images.search} size={23} tintColor={theme.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Ask Meta AI or Search"
          placeholderTextColor={theme.muted}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {['All', 'Unread', 'Favourites', 'Groups'].map((filter, index) => (
          <Pressable key={filter} style={[styles.filter, { backgroundColor: index === 0 ? '#d8ffd6' : theme.background, borderColor: theme.border, borderWidth: 1 }]}>
            <Text style={{ color: index === 0 ? '#0b6b43' : theme.text, fontWeight: '700' }}>
              {filter}{filter === 'Unread' && unreadCount > 0 ? ` ${unreadCount}` : ''}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.listPad}>
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Image source={images.messages} style={{ width: 46, height: 46, tintColor: theme.muted }} />
            <Text style={{ color: theme.muted, marginTop: 12, fontSize: 15 }}>
              {query ? 'No results found' : 'No conversations yet'}
            </Text>
            {!query && (
              <TouchableOpacity
                onPress={() => setShowUserSearch(true)}
                style={{ marginTop: 16, backgroundColor: '#00a884', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Start a Chat</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map((conversation) => {
            const name = getConvName(conversation);
            const pic = getConvPic(conversation);
            const online = getConvOnline(conversation);
            const lastText = getLastMsgText(conversation);
            const unread = Number(conversation.unread_count) || 0;
            const isMine = conversation.last_message?.sender_id === currentUserId;

            return (
              <Pressable key={conversation.id} onPress={() => openConversation(conversation)} style={[styles.row, { borderBottomColor: theme.border, paddingHorizontal: 28, paddingVertical: 13 }]}>
                <Avatar name={name} uri={pic} size={60} online={online} />
                <View style={styles.rowInfo}>
                  <Text style={[styles.conversationName, { color: theme.text, fontSize: 18 }]} numberOfLines={1}>{name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {isMine && conversation.last_message && (
                      <TickIcon statuses={conversation.last_message.statuses || []} senderId={conversation.last_message.sender_id} currentUserId={currentUserId} />
                    )}
                    <Text style={[styles.lastMessage, { color: theme.muted, fontSize: 16 }]} numberOfLines={1}>{lastText}</Text>
                  </View>
                </View>
                <View style={styles.meta}>
                  <Text style={[styles.small, { color: unread > 0 ? '#00a884' : theme.muted, fontSize: 14 }]}>
                    {formatTime(conversation.last_message?.created_at || conversation.updated_at)}
                  </Text>
                  {unread > 0 && <Text style={styles.badge}>{unread > 99 ? '99+' : unread}</Text>}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setShowUserSearch(true)}>
        <Icon source={images.messages} size={30} tintColor="#fff" />
      </Pressable>

      <Modal transparent visible={showMenu} animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuSheet, { backgroundColor: theme.card }]}>
            <Pressable style={styles.menuItem} onPress={() => { setShowMenu(false); openProfile(); }}>
              <Text style={[styles.menuItemText, { color: theme.text }]}>Profile</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setShowMenu(false); openSettings(); }}>
              <Text style={[styles.menuItemText, { color: theme.text }]}>Settings</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setShowMenu(false); onNewGroup(); }}>
              <Text style={[styles.menuItemText, { color: theme.text }]}>New group</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showUserSearch} animationType="slide" onRequestClose={() => setShowUserSearch(false)}>
        <View style={[{ flex: 1 }, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { gap: 12, backgroundColor: theme.background }]}>
            <Pressable onPress={() => { setShowUserSearch(false); setUserQuery(''); setUsers([]); }}>
              <Text style={{ color: theme.text, fontSize: 28 }}>‹</Text>
            </Pressable>
            <Text style={[styles.brand, { fontSize: 22, color: theme.text }]}>New Chat</Text>
          </View>
          <TextInput
            style={[styles.userSearchInput, { backgroundColor: theme.inputBg, color: theme.text }]}
            placeholder="Search by name or email..."
            placeholderTextColor={theme.muted}
            value={userQuery}
            onChangeText={searchUsers}
            autoFocus
          />
          {searching && <ActivityIndicator color="#00a884" style={{ marginTop: 20 }} />}
          <ScrollView>
            {users.map((user) => (
              <Pressable key={user.id} style={[styles.userItem, { borderBottomColor: theme.border }]} onPress={() => startChat(user.id)}>
                <Avatar name={user.username} uri={user.profile_pic} size={46} online={user.online} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userItemName, { color: theme.text }]}>{user.username}</Text>
                  <Text style={styles.userItemSub}>{user.about || user.email}</Text>
                </View>
                {starting === user.id && <ActivityIndicator color="#00a884" size="small" />}
              </Pressable>
            ))}
            {!searching && userQuery.length > 0 && users.length === 0 && (
              <Text style={{ color: theme.muted, textAlign: 'center', marginTop: 32 }}>No users found</Text>
            )}
            {userQuery.length === 0 && (
              <Text style={{ color: theme.muted, textAlign: 'center', marginTop: 32 }}>Type a name to search users</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
