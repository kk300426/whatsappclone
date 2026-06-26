import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { styles } from './styles';
import { images } from './assets';
import { Theme, Tab, Screen } from '../types/types';

export function Avatar({
  name = '',
  uri = '',
  size = 48,
  online = false,
}: {
  name?: string;
  uri?: string;
  size?: number;
  online?: boolean;
}) {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const radius = size / 2;
  const colors = ['#00a884', '#128c7e', '#075e54', '#25d366', '#34b7f1'];
  const color = colors[name.charCodeAt(0) % colors.length] || '#00a884';

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius }} defaultSource={images.user} />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: color,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '700' }}>{initials || '?'}</Text>
        </View>
      )}
      {online && (
        <View
          style={{
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: (size * 0.28) / 2,
            backgroundColor: '#25d366',
            position: 'absolute',
            bottom: 0,
            right: 0,
            borderWidth: 2,
            borderColor: '#fff',
          }}
        />
      )}
    </View>
  );
}

export function Icon({ source, size = 22, tintColor }: { source: any; size?: number; tintColor?: string }) {
  return <Image source={source} style={{ width: size, height: size, tintColor }} resizeMode="contain" />;
}

export function PageHeader({ title, theme, right }: { title: string; theme: Theme; right?: ReactNode }) {
  return (
    <View style={[styles.header, { backgroundColor: theme.background }]}>
      <Text style={[styles.brand, { color: theme.text }]}>{title}</Text>
      {right}
    </View>
  );
}

export function SimpleList({
  pairs,
  theme,
  square = false,
}: {
  pairs: string[][];
  theme: Theme;
  square?: boolean;
}) {
  return (
    <View>
      {pairs.map(([title, subtitle]) => (
        <View key={`${title}-${subtitle}`} style={[styles.row, { borderBottomColor: theme.border, paddingHorizontal: 16 }]}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: square ? 12 : 23,
              backgroundColor: '#d8ffd6',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon source={images.communities} size={25} tintColor="#0b7c4c" />
          </View>
          <View style={styles.rowInfo}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>{subtitle}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function Fab({ icon = images.messages, onPress }: { icon?: any; onPress?: () => void }) {
  return (
    <Pressable style={styles.fab} onPress={onPress}>
      <Icon source={icon} size={28} tintColor="#fff" />
    </Pressable>
  );
}

const NAV_ITEMS: { key: Tab; label: string; icon: any }[] = [
  { key: 'chats', label: 'Chats', icon: images.messages },
  { key: 'updates', label: 'Updates', icon: images.updates },
  { key: 'communities', label: 'Communities', icon: images.communities },
  { key: 'calls', label: 'Calls', icon: images.calls },
];

export default function BottomNav({
  active,
  theme,
  setScreen,
  unreadChats = 0,
}: {
  active: Tab;
  theme: Theme;
  setScreen: (tab: Tab) => void;
  unreadChats?: number;
}) {
  return (
    <View style={[styles.bottomNav, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
      {NAV_ITEMS.map(({ key, label, icon }) => {
        const isActive = active === key;
        return (
          <Pressable key={key} onPress={() => setScreen(key)} style={styles.navItem}>
            <View style={[localStyles.navIconWrap, isActive && localStyles.navIconActive]}>
              <Icon source={icon} size={26} tintColor={isActive ? '#0b6b43' : '#111b21'} />
              {key === 'chats' && unreadChats > 0 && (
                <View style={localStyles.navBadge}>
                  <Text style={localStyles.navBadgeText}>{unreadChats > 99 ? '99+' : unreadChats}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.navLabel, { color: '#111b21', fontWeight: isActive ? '800' : '600' }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function isTab(screen: Screen): screen is Tab {
  return ['chats', 'updates', 'communities', 'calls'].includes(screen as string);
}

const localStyles = StyleSheet.create({
  navIconWrap: {
    minWidth: 64,
    height: 34,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconActive: {
    backgroundColor: '#d8ffd6',
  },
  navBadge: {
    position: 'absolute',
    top: -5,
    right: 12,
    backgroundColor: '#0b7c4c',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  navBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
