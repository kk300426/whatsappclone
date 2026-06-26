import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, Image, Modal,
  TouchableOpacity, ActivityIndicator, Alert, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { styles } from './styles';
import { Avatar } from './otherfeatures';
import { Theme, Message, Conversation, User } from '../types/types';
import { API_URL, getAuthHeaders } from '../../config';

// ── Tick indicator ───────────────────────────────────────────────────────────
function Ticks({ msg, currentUserId, members }: { msg: Message; currentUserId: string; members: User[] }) {
  if (msg.sender_id !== currentUserId) return null;
  const others = members.filter(m => m.id !== currentUserId);
  const seenAll = others.length > 0 && others.every(m => msg.statuses?.some(s => s.user_id === m.id && s.status === 'seen'));
  const deliveredAll = others.length > 0 && others.every(m => msg.statuses?.some(s => s.user_id === m.id && (s.status === 'delivered' || s.status === 'seen')));
  if (seenAll) return <Text style={{ fontSize: 11, color: '#53bdeb' }}>✓✓</Text>;
  if (deliveredAll) return <Text style={{ fontSize: 11, color: '#8696a0' }}>✓✓</Text>;
  return <Text style={{ fontSize: 11, color: '#8696a0' }}>✓</Text>;
}

// ── Date separator ───────────────────────────────────────────────────────────
function DateSep({ date }: { date: string }) {
  return (
    <View style={styles.dateSep}>
      <Text style={styles.dateSepText}>{date}</Text>
    </View>
  );
}

// ── Emoji list ───────────────────────────────────────────────────────────────
const EMOJIS = [
  '😀','😂','😍','🥺','😎','😭','😡','🥳','🤔','😴',
  '👍','👎','❤️','🔥','💯','🎉','😊','😅','🤣','😘',
  '💪','🙏','👏','✌️','🤞','👋','🤙','🖐','☀️','🌙',
  '🍕','🍔','☕','🎵','⚽','🏆','💻','📱','💰','🚀',
];

// ── Context menu ─────────────────────────────────────────────────────────────
function ContextMenu({
  visible, x, y, isMine, onReply, onEdit, onDelete, onForward, onCopy, onClose,
}: {
  visible: boolean; x: number; y: number; isMine: boolean;
  onReply: () => void; onEdit: () => void; onDelete: () => void;
  onForward: () => void; onCopy: () => void; onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose}>
      <View style={[styles.contextMenu, { top: Math.min(y, 400), left: isMine ? undefined : 20, right: isMine ? 20 : undefined }]}>
        {[
          { label: '↩ Reply', action: onReply },
          ...(isMine ? [{ label: '✎ Edit', action: onEdit }] : []),
          { label: '⎘ Forward', action: onForward },
          { label: '⎘ Copy', action: onCopy },
          ...(isMine ? [{ label: '🗑 Delete', action: onDelete }] : []),
        ].map((item, i) => (
          <Pressable key={i} onPress={() => { item.action(); onClose(); }}
            style={[styles.contextMenuItem, { borderBottomColor: '#f0f2f5', borderBottomWidth: i < 3 ? 1 : 0 }]}>
            <Text style={styles.contextMenuText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </Pressable>
  );
}

// ── Message Bubble ───────────────────────────────────────────────────────────
function Bubble({
  msg, isMine, theme, currentUserId, members, onLongPress,
}: {
  msg: Message; isMine: boolean; theme: Theme; currentUserId: string; members: User[];
  onLongPress: (msg: Message, y: number) => void;
}) {
  const bgColor = isMine ? theme.bubbleSent : theme.bubbleReceived;
  const textColor = isMine ? theme.bubbleSentText : theme.bubbleReceivedText;

  const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Pressable
      onLongPress={(e) => onLongPress(msg, e.nativeEvent.pageY)}
      style={[styles.bubbleWrapper, isMine ? styles.bubbleSentWrapper : styles.bubbleReceivedWrapper]}
    >
      <View style={[styles.bubble, isMine ? styles.bubbleSent : styles.bubbleReceived, { backgroundColor: bgColor }]}>
        {/* Group: sender name */}
        {!isMine && members.length > 2 && (
          <Text style={styles.senderName}>{msg.sender?.username}</Text>
        )}
        {/* Reply preview */}
        {msg.reply_message && (
          <View style={styles.replyPreview}>
            <Text style={styles.replyUser}>{msg.reply_message.sender?.username}</Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {msg.reply_message.type === 'image' ? '📷 Photo' : msg.reply_message.content}
            </Text>
          </View>
        )}
        {/* Deleted */}
        {msg.is_deleted ? (
          <Text style={[styles.deletedText, { color: theme.muted }]}>🚫 This message was deleted</Text>
        ) : msg.type === 'image' && msg.media_url ? (
          <Image source={{ uri: `${API_URL}${msg.media_url}` }} style={styles.bubbleImage} resizeMode="cover" />
        ) : msg.type === 'voice' ? (
          <View style={styles.voiceContainer}>
            <Text style={{ fontSize: 22 }}>🎤</Text>
            <View style={[styles.voiceBar, { backgroundColor: isMine ? 'rgba(0,0,0,0.15)' : '#e9edef' }]} />
            <Text style={{ color: textColor, fontSize: 12 }}>0:12</Text>
          </View>
        ) : (
          <Text style={[styles.bubbleText, { color: textColor }]}>{msg.content}</Text>
        )}
        {/* Time + ticks + edited */}
        {!msg.is_deleted && (
          <View style={styles.bubbleTimeRow}>
            {msg.is_edited && <Text style={[styles.editedTag, { color: theme.muted }]}>edited</Text>}
            <Text style={[styles.bubbleTime, { color: isMine ? 'rgba(0,0,0,0.45)' : theme.muted }]}>{timeStr}</Text>
            <Ticks msg={msg} currentUserId={currentUserId} members={members} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ── Main ChatScreen ──────────────────────────────────────────────────────────
export default function ChatScreen({
  theme, conversation, currentUser, token, socket,
  onBack, onMessageSent,
}: {
  theme: Theme;
  conversation: Conversation;
  currentUser: User;
  token: string;
  socket: any;
  onBack: () => void;
  onMessageSent: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [forwardConversations, setForwardConversations] = useState<Conversation[]>([]);
  const [forwardingTo, setForwardingTo] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [contextMsg, setContextMsg] = useState<Message | null>(null);
  const [contextY, setContextY] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const typingTimeout = useRef<any>(null);

  const other = conversation.members?.find(m => m.id !== currentUser.id);
  const convName = conversation.is_group ? conversation.name || 'Group' : other?.username || 'Chat';
  const convPic = conversation.is_group ? conversation.group_icon : other?.profile_pic || '';
  const isOnline = !conversation.is_group && (other?.online || false);

  // Load messages
  useEffect(() => {
    loadMessages();
    socket?.emit('join_conversation', conversation.id);
    return () => { socket?.emit('leave_conversation', conversation.id); };
  }, [conversation.id]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    const onReceive = (msg: Message) => {
      if (msg.conversation_id !== conversation.id) return;
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      // Mark as seen
      socket.emit('message_seen', { message_id: msg.id, conversation_id: msg.conversation_id, user_id: currentUser.id });
    };
    const onUpdated = (msg: Message) => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m));
    const onDeleted = ({ id }: { id: string }) => setMessages(prev => prev.map(m => m.id === id ? { ...m, is_deleted: true, content: 'This message was deleted' } : m));
    const onTyping = ({ user_id, username }: any) => {
      if (user_id === currentUser.id) return;
      setTypingUsers(prev => prev.includes(username) ? prev : [...prev, username]);
    };
    const onStopTyping = ({ user_id }: any) => {
      setTypingUsers(prev => prev.filter(u => u !== user_id));
    };
    const onStatusUpdate = ({ message_id, user_id, status }: any) => {
      setMessages(prev => prev.map(m => {
        if (m.id !== message_id) return m;
        const newStatuses = [...(m.statuses || []).filter(s => s.user_id !== user_id), { user_id, status }];
        return { ...m, statuses: newStatuses };
      }));
    };
    const onMsgsSeen = ({ message_ids, seen_by }: any) => {
      setMessages(prev => prev.map(m => {
        if (!message_ids.includes(m.id)) return m;
        const newStatuses = [...(m.statuses || []).filter(s => s.user_id !== seen_by), { user_id: seen_by, status: 'seen' as const }];
        return { ...m, statuses: newStatuses };
      }));
    };
    socket.on('receive_message', onReceive);
    socket.on('message_updated', onUpdated);
    socket.on('message_deleted', onDeleted);
    socket.on('user_typing', onTyping);
    socket.on('user_stop_typing', onStopTyping);
    socket.on('message_status_update', onStatusUpdate);
    socket.on('messages_seen', onMsgsSeen);
    return () => {
      socket.off('receive_message', onReceive);
      socket.off('message_updated', onUpdated);
      socket.off('message_deleted', onDeleted);
      socket.off('user_typing', onTyping);
      socket.off('user_stop_typing', onStopTyping);
      socket.off('message_status_update', onStatusUpdate);
      socket.off('messages_seen', onMsgsSeen);
    };
  }, [socket, conversation.id]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/messages/${conversation.id}`, { headers: getAuthHeaders(token) });
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch { /* silent */ }
    finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
    }
  };

  const handleDraftChange = (text: string) => {
    setDraft(text);
    if (!socket) return;
    socket.emit('typing', { conversation_id: conversation.id, user_id: currentUser.id, username: currentUser.username });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop_typing', { conversation_id: conversation.id, user_id: currentUser.id });
    }, 1500);
  };

  const sendMessage = async (type = 'text', content = draft, mediaUrl = '') => {
    const text = content.trim();
    if (type === 'text' && !text) return;
    if (editingMsg) { editMessage(editingMsg.id, text); return; }
    setSending(true);
    try {
      const body: any = {
        conversation_id: conversation.id,
        content: text,
        type,
        media_url: mediaUrl,
      };
      if (replyTo) body.reply_to = replyTo.id;
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setDraft('');
        setReplyTo(null);
        setShowEmoji(false);
        socket?.emit('stop_typing', { conversation_id: conversation.id, user_id: currentUser.id });
        onMessageSent();
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  const editMessage = async (id: string, content: string) => {
    try {
      const res = await fetch(`${API_URL}/messages/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ content }),
      });
      if (res.ok) { setEditingMsg(null); setDraft(''); }
    } catch { /* silent */ }
  };

  const deleteMessage = async (id: string) => {
    Alert.alert('Delete message', 'Delete for everyone?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await fetch(`${API_URL}/messages/${id}`, { method: 'DELETE', headers: getAuthHeaders(token) });
        }
      }
    ]);
  };

  const openForward = async (msg: Message) => {
    setForwardMsg(msg);
    try {
      const res = await fetch(`${API_URL}/conversations`, { headers: getAuthHeaders(token) });
      const data = await res.json();
      setForwardConversations(Array.isArray(data) ? data : []);
    } catch {
      setForwardConversations([]);
    }
  };

  const forwardMessage = async (target: Conversation) => {
    if (!forwardMsg) return;
    setForwardingTo(target.id);
    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          conversation_id: target.id,
          content: forwardMsg.content,
          type: forwardMsg.type,
          media_url: forwardMsg.media_url,
        }),
      });
      if (res.ok) {
        setForwardMsg(null);
        setForwardConversations([]);
        onMessageSent();
      } else {
        Alert.alert('Forward failed', 'Could not forward this message.');
      }
    } catch {
      Alert.alert('Forward failed', 'Server error.');
    } finally {
      setForwardingTo(null);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6, base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      // Upload
      try {
        const res = await fetch(`${API_URL}/upload`, {
          method: 'POST', headers: getAuthHeaders(token),
          body: JSON.stringify({ base64, ext: 'jpg' }),
        });
        const { url } = await res.json();
        await sendMessage('image', '', url);
      } catch { /* silent */ }
    }
  };

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const d = new Date(m.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    const last = grouped[grouped.length - 1];
    if (last && last.date === d) last.msgs.push(m);
    else grouped.push({ date: d, msgs: [m] });
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.chatScreen, { backgroundColor: theme.chatBackground }]}>
      {/* Header */}
      <View style={styles.chatHeader}>
        <Pressable onPress={onBack}><Text style={styles.chatBack}>←</Text></Pressable>
        <Avatar name={convName} uri={convPic} size={40} online={isOnline} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.chatName} numberOfLines={1}>{convName}</Text>
          <Text style={styles.chatSubtitle}>
            {typingUsers.length > 0 ? `${typingUsers[0]} is typing…` : isOnline ? 'online' : other?.last_seen ? `last seen ${formatTime(other.last_seen)}` : ''}
          </Text>
        </View>
        <View style={styles.chatHeaderActions}>
          <Pressable onPress={pickImage}><Text style={{ fontSize: 20, color: '#fff' }}>📷</Text></Pressable>
          <Text style={{ fontSize: 20, color: '#fff' }}>📞</Text>
          <Text style={{ fontSize: 20, color: '#fff' }}>⋮</Text>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#00a884" /></View>
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.messageList} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          {grouped.map(group => (
            <View key={group.date}>
              <DateSep date={group.date} />
              {group.msgs.map(msg => (
                <Bubble
                  key={msg.id}
                  msg={msg}
                  isMine={msg.sender_id === currentUser.id}
                  theme={theme}
                  currentUserId={currentUser.id}
                  members={conversation.members || []}
                  onLongPress={(m, y) => { setContextMsg(m); setContextY(y); }}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Reply bar */}
      {(replyTo || editingMsg) && (
        <View style={[styles.replyBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>{editingMsg ? '✎' : '↩'}</Text>
          <View style={styles.replyBarContent}>
            <Text style={styles.replyBarUser}>{editingMsg ? 'Edit message' : replyTo?.sender?.username}</Text>
            <Text style={styles.replyBarText} numberOfLines={1}>{editingMsg ? editingMsg.content : replyTo?.content}</Text>
          </View>
          <Pressable style={styles.replyBarClose} onPress={() => { setReplyTo(null); setEditingMsg(null); setDraft(''); }}>
            <Text style={{ fontSize: 18, color: '#8696a0' }}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* Emoji panel */}
      {showEmoji && (
        <View style={[styles.emojiPanel, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <ScrollView contentContainerStyle={styles.emojiGrid}>
            {EMOJIS.map((e) => (
              <Pressable key={e} style={styles.emojiItem} onPress={() => setDraft(d => d + e)}>
                <Text style={styles.emojiText}>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input bar */}
      <View style={[styles.messageBar, { backgroundColor: theme.card }]}>
        <Pressable style={styles.emojiButton} onPress={() => setShowEmoji(s => !s)}>
          <Text style={{ fontSize: 24 }}>😊</Text>
        </Pressable>
        <View style={[styles.messageInputWrap, { backgroundColor: theme.inputBg }]}>
          <TextInput
            value={draft}
            onChangeText={handleDraftChange}
            placeholder={editingMsg ? 'Edit message…' : 'Message'}
            placeholderTextColor={theme.muted}
            style={[styles.messageInput, { color: theme.text }]}
            multiline
          />
          <Pressable style={styles.attachButton} onPress={pickImage}>
            <Text style={{ fontSize: 20, color: theme.muted }}>📎</Text>
          </Pressable>
        </View>
        {draft.trim() ? (
          <Pressable style={styles.sendButton} onPress={() => sendMessage()} disabled={sending}>
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontSize: 20 }}>➤</Text>}
          </Pressable>
        ) : (
          <Pressable style={styles.sendButton} onPress={() => sendMessage('voice', '🎤 Voice message')}>
            <Text style={{ fontSize: 20 }}>🎤</Text>
          </Pressable>
        )}
      </View>

      {/* Context menu */}
      <ContextMenu
        visible={!!contextMsg}
        x={0}
        y={contextY - 80}
        isMine={contextMsg?.sender_id === currentUser.id}
        onReply={() => { setReplyTo(contextMsg!); setContextMsg(null); }}
        onEdit={() => { setEditingMsg(contextMsg!); setDraft(contextMsg!.content); setContextMsg(null); }}
        onDelete={() => { deleteMessage(contextMsg!.id); setContextMsg(null); }}
        onForward={() => { openForward(contextMsg!); setContextMsg(null); }}
        onCopy={() => { setDraft(d => d + (contextMsg?.content || '')); }}
        onClose={() => setContextMsg(null)}
      />

      <Modal visible={!!forwardMsg} animationType="slide" onRequestClose={() => setForwardMsg(null)}>
        <View style={[{ flex: 1 }, { backgroundColor: theme.background }]}>
          <View style={styles.backHeader}>
            <Pressable onPress={() => setForwardMsg(null)}><Text style={styles.back}>←</Text></Pressable>
            <Text style={styles.pageTitle}>Forward to</Text>
          </View>
          <ScrollView>
            {forwardConversations
              .filter((item) => item.id !== conversation.id)
              .map((item) => {
                const member = item.members?.find(m => m.id !== currentUser.id);
                const name = item.is_group ? item.name || 'Group' : member?.username || 'Unknown';
                const pic = item.is_group ? item.group_icon : member?.profile_pic || '';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.userItem, { borderBottomColor: theme.border }]}
                    onPress={() => forwardMessage(item)}
                    disabled={!!forwardingTo}
                  >
                    <Avatar name={name} uri={pic} size={46} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userItemName, { color: theme.text }]}>{name}</Text>
                      <Text style={styles.userItemSub} numberOfLines={1}>
                        {item.is_group ? 'Group chat' : member?.about || member?.email || 'Contact'}
                      </Text>
                    </View>
                    {forwardingTo === item.id && <ActivityIndicator color="#00a884" size="small" />}
                  </TouchableOpacity>
                );
              })}
            {forwardConversations.filter((item) => item.id !== conversation.id).length === 0 && (
              <Text style={{ color: theme.muted, textAlign: 'center', marginTop: 32 }}>No other chats to forward to</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}
