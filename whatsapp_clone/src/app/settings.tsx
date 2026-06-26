import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import { Avatar } from './otherfeatures';
import { Theme, User } from '../types/types';

const SETTINGS_ITEMS = [
  { emoji: '🔑', label: 'Account' },
  { emoji: '🔒', label: 'Privacy' },
  { emoji: '🎨', label: 'Avatar' },
  { emoji: '💬', label: 'Chats' },
  { emoji: '🔔', label: 'Notifications' },
  { emoji: '📦', label: 'Storage and Data' },
  { emoji: '🌐', label: 'Language' },
  { emoji: '❓', label: 'Help' },
  { emoji: '👥', label: 'Invite a Friend' },
];

export default function Settings({
  theme, dark, toggleTheme, openProfile, goBack, currentUser, onLogout,
}: {
  theme: Theme;
  dark: boolean;
  toggleTheme: () => void;
  openProfile: () => void;
  goBack: () => void;
  currentUser: User | null;
  onLogout: () => void;
}) {
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.backHeader}>
        <Pressable onPress={goBack}><Text style={styles.back}>←</Text></Pressable>
        <Text style={styles.pageTitle}>Settings</Text>
      </View>

      {/* Profile row */}
      <Pressable onPress={openProfile} style={[styles.row, { borderBottomColor: theme.border, paddingVertical: 14, paddingHorizontal: 16 }]}>
        <Avatar name={currentUser?.username || '?'} uri={currentUser?.profile_pic || ''} size={58} online={currentUser?.online} />
        <View style={styles.rowInfo}>
          <Text style={[styles.title, { color: theme.text, fontSize: 18 }]}>{currentUser?.username || 'User'}</Text>
          <Text style={{ color: theme.muted, marginTop: 2 }}>{currentUser?.about || 'Hey there! I am using WhatsApp.'}</Text>
        </View>
        <Text style={{ color: theme.muted, fontSize: 18 }}>›</Text>
      </Pressable>

      {/* Dark mode toggle */}
      <View style={[styles.themeCard, { backgroundColor: theme.card }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 22 }}>🌙</Text>
          <Text style={[styles.title, { color: theme.text }]}>Dark Mode</Text>
        </View>
        <Switch value={dark} onValueChange={toggleTheme} trackColor={{ true: '#00a884' }} />
      </View>

      {/* Setting items */}
      {SETTINGS_ITEMS.map((item) => (
        <Pressable key={item.label} style={[styles.settingItem, { borderBottomColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
            <Text style={{ color: theme.text, fontSize: 15 }}>{item.label}</Text>
          </View>
        </Pressable>
      ))}

      {/* Logout */}
      <Pressable
        onPress={onLogout}
        style={[styles.settingItem, { borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 14 }]}
      >
        <Text style={{ fontSize: 20 }}>🚪</Text>
        <Text style={{ color: theme.danger, fontSize: 15, fontWeight: '700' }}>Log Out</Text>
      </Pressable>

      <Text style={{ color: theme.muted, textAlign: 'center', fontSize: 12, padding: 20 }}>
        WhatsApp Clone v1.0.0 • Built with ❤️
      </Text>
    </ScrollView>
  );
}
