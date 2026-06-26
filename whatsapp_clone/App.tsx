import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { io } from 'socket.io-client';

import Updates from './src/app/updates';
import Settings from './src/app/settings';
import Profile from './src/app/profile';
import Communities from './src/app/communities';
import ChatScreen from './src/app/chatScreen';
import Chats from './src/app/chat';
import Calls from './src/app/calls';
import { styles, lightTheme, darkTheme } from './src/app/styles';
import { images } from './src/app/assets';
import { isTab } from './src/app/otherfeatures';
import BottomNav from './src/app/otherfeatures';
import { API_URL, SOCKET_URL, getAuthHeaders } from './config';
import ExUser from './src/login/exuser';
import NewUser from './src/login/NewUser';
import { Conversation, Screen, Tab, User } from './src/types/types';

const POLLING_INTERVAL = 4000;

export default function App() {
  const [splash, setSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState('');
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [screen, setScreen] = useState<Screen>('chats');
  const [previous, setPrevious] = useState<Screen>('chats');
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<any>(null);
  const selectedConversationRef = useRef<Conversation | null>(null);
  const theme = dark ? darkTheme : lightTheme;

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    const initApp = async () => {
      try {
        const [storedUser, storedToken, storedTheme] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('theme'),
        ]);

        setDark(storedTheme === 'dark');

        if (storedUser && storedToken) {
          setCurrentUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
      } finally {
        setSplash(false);
      }
    };

    initApp();
  }, []);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const fetchConversations = async (authToken = token) => {
    if (!authToken) return;
    try {
      const response = await fetch(`${API_URL}/conversations`, {
        headers: getAuthHeaders(authToken),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const nextConversations = Array.isArray(data) ? data : [];

      setConversations(nextConversations);

      const current = selectedConversationRef.current;
      if (current) {
        const updated = nextConversations.find((conversation) => conversation.id === current.id);
        if (updated) setSelectedConversation(updated);
      }
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (authToken = token) => {
    stopPolling();
    setLoading(true);
    fetchConversations(authToken);
    pollingIntervalRef.current = setInterval(() => fetchConversations(authToken), POLLING_INTERVAL);
  };

  useEffect(() => {
    if (!currentUser || !token) {
      stopPolling();
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    startPolling(token);
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit('user_online', currentUser.id);

    socket.on('receive_message', fetchConversations);
    socket.on('message_updated', fetchConversations);
    socket.on('message_deleted', fetchConversations);
    socket.on('messages_seen', fetchConversations);
    socket.on('message_status_update', fetchConversations);
    socket.on('user_status_change', fetchConversations);

    return () => {
      stopPolling();
      socket.off('receive_message', fetchConversations);
      socket.off('message_updated', fetchConversations);
      socket.off('message_deleted', fetchConversations);
      socket.off('messages_seen', fetchConversations);
      socket.off('message_status_update', fetchConversations);
      socket.off('user_status_change', fetchConversations);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser?.id, token]);

  const handleAuthSuccess = async (user: User, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('token', authToken);
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    setToken('');
    setConversations([]);
    setSelectedConversation(null);
    await AsyncStorage.multiRemove(['user', 'token']);
    setScreen('chats');
  };

  const navigate = (next: Screen) => {
    setPrevious(screen);
    setScreen(next);
  };

  const setTab = (next: Tab) => {
    setScreen(next);
  };

  const openConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setScreen('chat');
  };

  const handleNewChat = (conversation: Conversation) => {
    setConversations((items) => {
      const exists = items.some((item) => item.id === conversation.id);
      return exists
        ? items.map((item) => (item.id === conversation.id ? conversation : item))
        : [conversation, ...items];
    });
    openConversation(conversation);
  };

  const handleNewGroup = () => {
    Alert.alert('New group', 'Search for a person first, then start a chat. Group creation can be added from the same backend endpoint.');
  };

  const handleUserUpdate = async (user: User) => {
    setCurrentUser(user);
    await AsyncStorage.setItem('user', JSON.stringify(user));
  };

  const toggleTheme = async () => {
    const next = !dark;
    setDark(next);
    await AsyncStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const unreadChats = useMemo(
    () => conversations.reduce((sum, conversation) => sum + (Number(conversation.unread_count) || 0), 0),
    [conversations],
  );

  if (splash) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.splash, { backgroundColor: theme.background }]}>
          <Image source={images.logo} style={styles.logo} resizeMode="contain" />
          <View style={styles.metaSection}>
            <Text style={{ color: theme.muted }}>from</Text>
            <Image source={images.meta} style={styles.metaLogo} resizeMode="contain" />
          </View>
          <StatusBar style={dark ? 'light' : 'dark'} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!currentUser || !token) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <StatusBar style={dark ? 'light' : 'dark'} />
          {authScreen === 'login' ? (
            <ExUser onLoginSuccess={handleAuthSuccess} onNavigateToSignup={() => setAuthScreen('signup')} />
          ) : (
            <NewUser onRegisterSuccess={handleAuthSuccess} onNavigateToLogin={() => setAuthScreen('login')} />
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.app, { backgroundColor: theme.background }]}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        {loading && conversations.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ color: theme.text, fontSize: 16, marginBottom: 10 }}>Loading chats...</Text>
            <Text style={{ color: theme.muted, fontSize: 12 }}>Syncing with server</Text>
          </View>
        ) : (
          <>
            {screen === 'chats' && (
              <Chats
                theme={theme}
                conversations={conversations}
                currentUserId={currentUser.id}
                token={token}
                query={query}
                setQuery={setQuery}
                openConversation={openConversation}
                onNewChat={handleNewChat}
                onNewGroup={handleNewGroup}
                openSettings={() => navigate('settings')}
                openProfile={() => navigate('profile')}
              />
            )}
            {screen === 'updates' && <Updates theme={theme} currentUser={currentUser} token={token} />}
            {screen === 'communities' && <Communities theme={theme} />}
            {screen === 'calls' && <Calls theme={theme} />}
            {screen === 'settings' && (
              <Settings
                theme={theme}
                dark={dark}
                toggleTheme={toggleTheme}
                openProfile={() => navigate('profile')}
                goBack={() => setScreen('chats')}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            )}
            {screen === 'profile' && (
              <Profile
                theme={theme}
                currentUser={currentUser}
                token={token}
                goBack={() => setScreen(previous)}
                onUserUpdate={handleUserUpdate}
              />
            )}
            {screen === 'chat' && selectedConversation && (
              <ChatScreen
                theme={theme}
                conversation={selectedConversation}
                currentUser={currentUser}
                token={token}
                socket={socketRef.current}
                onBack={() => setScreen('chats')}
                onMessageSent={() => fetchConversations(token)}
              />
            )}
            {isTab(screen) && <BottomNav active={screen} theme={theme} setScreen={setTab} unreadChats={unreadChats} />}
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
