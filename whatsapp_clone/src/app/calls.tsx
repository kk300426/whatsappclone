import { View, Text, ScrollView } from 'react-native';
import { styles } from './styles';
import { Avatar } from './otherfeatures';
import { Theme } from '../types/types';

const SAMPLE_CALLS = [
  { name: 'Alice', type: 'Incoming', time: 'Today, 10:30 AM', emoji: '📲', missed: false },
  { name: 'Bob', type: 'Outgoing', time: 'Today, 9:15 AM', emoji: '📱', missed: false },
  { name: 'Carol', type: 'Missed', time: 'Yesterday, 6:22 PM', emoji: '📵', missed: true },
  { name: 'Dave', type: 'Incoming', time: 'Yesterday, 2:00 PM', emoji: '📲', missed: false },
];

export default function Calls({ theme }: { theme: Theme }) {
  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={styles.brand}>Calls</Text>
        <Text style={{ color: '#fff', fontSize: 20 }}>🔍</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <Text style={{ color: theme.muted, fontSize: 12, fontWeight: '700', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, textTransform: 'uppercase' }}>
          Recent
        </Text>
        {SAMPLE_CALLS.map((call, i) => (
          <View key={i} style={[styles.row, { borderBottomColor: theme.border, paddingHorizontal: 16 }]}>
            <Avatar name={call.name} size={46} />
            <View style={styles.rowInfo}>
              <Text style={[styles.title, { color: call.missed ? theme.danger : theme.text }]}>{call.name}</Text>
              <Text style={{ color: theme.muted, fontSize: 13 }}>{call.emoji} {call.type}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={{ color: theme.muted, fontSize: 12 }}>{call.time}</Text>
              <Text style={{ fontSize: 18 }}>📞</Text>
            </View>
          </View>
        ))}
        <View style={{ alignItems: 'center', paddingTop: 40 }}>
          <Text style={{ fontSize: 40 }}>📞</Text>
          <Text style={{ color: theme.muted, marginTop: 12 }}>Your recent calls appear here</Text>
        </View>
      </ScrollView>
    </View>
  );
}