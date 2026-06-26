import { StyleSheet, Dimensions } from 'react-native';
import { Theme } from '../types/types';

const { width, height } = Dimensions.get('window');
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

export const lightTheme: Theme = {
  text: '#111b21',
  border: '#e9edef',
  muted: '#8696a0',
  soft: '#f0f2f5',
  background: '#ffffff',
  chatBackground: '#efeae2',
  card: '#ffffff',
  accent: '#00a884',
  headerBg: '#008069',
  inputBg: '#f0f2f5',
  bubbleSent: '#d9fdd3',
  bubbleReceived: '#ffffff',
  bubbleSentText: '#111b21',
  bubbleReceivedText: '#111b21',
  online: '#25d366',
  danger: '#f33',
};

export const darkTheme: Theme = {
  text: '#e9edef',
  border: '#2a3942',
  muted: '#8696a0',
  soft: '#182229',
  background: '#0b141a',
  chatBackground: '#0b141a',
  card: '#1f2c34',
  accent: '#00a884',
  headerBg: '#1f2c34',
  inputBg: '#2a3942',
  bubbleSent: '#005c4b',
  bubbleReceived: '#1f2c34',
  bubbleSentText: '#e9edef',
  bubbleReceivedText: '#e9edef',
  online: '#25d366',
  danger: '#f33',
};

export const styles = StyleSheet.create({
  /* ── Layout ── */
  flex1: { flex: 1 },
  screen: { flex: 1 },
  app: { flex: 1 },
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowInfo: { flex: 1, marginLeft: 12 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, margin: 12, borderRadius: 12 },

  /* ── Header ── */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, paddingVertical: 12, backgroundColor: '#ffffff' },
  brand: { fontSize: 22, fontWeight: '700', color: '#ffffff', letterSpacing: 0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 18 },

  /* ── Search ── */
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginVertical: 8, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 8 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },

  /* ── Filters ── */
  filters: { maxHeight: 56, paddingHorizontal: 28, paddingVertical: 8 },
  filter: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, marginRight: 8 },

  /* ── Chat list ── */
  listPad: { paddingBottom: 80 },
  title: { fontSize: 16, fontWeight: '600' },
  small: { fontSize: 12 },
  meta: { alignItems: 'flex-end', gap: 4 },
  badge: { backgroundColor: '#25d366', color: '#fff', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, fontSize: 12, fontWeight: '700', overflow: 'hidden' },
  conversationName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  lastMessage: { fontSize: 13 },

  /* ── Avatar ── */
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#00a884', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  onlineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#25d366', position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: '#fff' },

  /* ── FAB ── */
  fab: { position: 'absolute', bottom: 80, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#00a884', justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText: { color: '#fff', fontSize: 26, lineHeight: 30 },

  /* ── Bottom Nav ── */
  bottomNav: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 8, paddingTop: 8 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 2, minWidth: 0 },
  navLabel: { fontSize: 13, marginTop: 4, maxWidth: 86 },

  /* ── Chat screen ── */
  chatScreen: { flex: 1 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, backgroundColor: '#008069', gap: 10 },
  chatBack: { fontSize: 22, color: '#fff', paddingRight: 4 },
  chatName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  chatSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  chatHeaderActions: { marginLeft: 'auto', flexDirection: 'row', gap: 16 },
  messageList: { padding: 8, paddingBottom: 16 },

  /* ── Bubbles ── */
  bubbleWrapper: { marginVertical: 2 },
  bubbleSentWrapper: { alignItems: 'flex-end' },
  bubbleReceivedWrapper: { alignItems: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, elevation: 1 },
  bubbleSent: { borderTopRightRadius: 2 },
  bubbleReceived: { borderTopLeftRadius: 2 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTime: { fontSize: 10, marginTop: 2, alignSelf: 'flex-end' },
  bubbleTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-end', marginTop: 2 },
  senderName: { fontSize: 12, fontWeight: '700', color: '#00a884', marginBottom: 2 },
  deletedText: { fontStyle: 'italic', color: '#8696a0' },
  editedTag: { fontSize: 10, color: '#8696a0' },
  bubbleImage: { width: 200, height: 200, borderRadius: 6, marginBottom: 4 },
  voiceContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  voiceBar: { flex: 1, height: 3, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2 },

  /* ── Reply preview in bubble ── */
  replyPreview: { borderLeftWidth: 3, borderLeftColor: '#00a884', paddingLeft: 8, marginBottom: 4, opacity: 0.85 },
  replyUser: { fontSize: 12, fontWeight: '700', color: '#00a884' },
  replyText: { fontSize: 12, color: '#8696a0' },

  /* ── Message input bar ── */
  messageBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingVertical: 8, gap: 8 },
  messageInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 6, gap: 8 },
  messageInput: { flex: 1, fontSize: 15, maxHeight: 120, paddingVertical: 4 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00a884', justifyContent: 'center', alignItems: 'center' },
  attachButton: { padding: 6 },
  emojiButton: { padding: 6 },

  /* ── Reply bar ── */
  replyBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  replyBarContent: { flex: 1 },
  replyBarUser: { fontSize: 13, fontWeight: '700', color: '#00a884' },
  replyBarText: { fontSize: 13, color: '#8696a0' },
  replyBarClose: { padding: 4 },

  /* ── Typing ── */
  typingIndicator: { paddingHorizontal: 16, paddingVertical: 4 },
  typingText: { fontSize: 12, fontStyle: 'italic', color: '#8696a0' },

  /* ── Date separator ── */
  dateSep: { alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginVertical: 8 },
  dateSepText: { fontSize: 12, color: '#667781' },

  /* ── Settings ── */
  backHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#008069' },
  back: { fontSize: 22, marginRight: 12, color: '#fff' },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  pagePadding: { paddingLeft: 8 },
  settingItem: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  themeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, margin: 12, borderRadius: 12 },
  toggle: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#00a884' },
  toggleText: { color: '#fff', fontWeight: '700' },

  /* ── Profile ── */
  profileHero: { alignItems: 'center', paddingVertical: 28 },
  profileName: { fontSize: 24, fontWeight: '700', marginTop: 12 },
  profileAbout: { fontSize: 14, marginTop: 4 },
  infoCard: { marginHorizontal: 12, marginBottom: 8, padding: 16, borderRadius: 12 },

  /* ── Splash ── */
  logo: { width: 100, height: 100 },
  metaLogo: { width: 80, height: 24 },
  metaSection: { position: 'absolute', bottom: 32, alignItems: 'center', gap: 6 },

  /* ── Auth ── */
  authPage: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#008069' },
  authCard: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 20, padding: 28, elevation: 8 },
  authBrand: { alignItems: 'center', marginBottom: 24 },
  authHero: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  authTitle: { fontSize: 26, fontWeight: '700', color: '#111b21', textAlign: 'center', marginBottom: 20 },
  authInput: { width: '100%', height: 50, borderWidth: 1, borderColor: '#e9edef', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#f9f9f9', fontSize: 15, marginBottom: 12 },
  authButton: { width: '100%', height: 50, borderRadius: 12, backgroundColor: '#00a884', justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  authButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  authFooter: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 6 },
  authFooterText: { color: '#667781', fontSize: 14 },
  authLink: { color: '#00a884', fontWeight: '700', fontSize: 14 },

  /* ── Status / Updates ── */
  statusRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  statusRing: { width: 52, height: 52, borderRadius: 26, borderWidth: 2.5, borderColor: '#00a884', justifyContent: 'center', alignItems: 'center' },
  statusRingViewed: { borderColor: '#8696a0' },
  statusAddBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#00a884', justifyContent: 'center', alignItems: 'center' },
  statusInfo: { flex: 1, marginLeft: 14 },
  statusName: { fontSize: 16, fontWeight: '600' },
  statusTime: { fontSize: 12, color: '#8696a0', marginTop: 2 },
  statusViewBg: { flex: 1, backgroundColor: '#000' },
  statusViewImg: { width: '100%', height: '75%', resizeMode: 'contain' },
  statusViewText: { color: '#fff', fontSize: 22, fontWeight: '600', textAlign: 'center', padding: 24 },
  statusViewClose: { position: 'absolute', top: 48, left: 16 },
  statusViewTime: { position: 'absolute', top: 48, alignSelf: 'center', color: '#fff', opacity: 0.7, fontSize: 12 },

  /* ── Modal ── */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, gap: 12 },
  menuOverlay: { flex: 1, alignItems: 'flex-end', paddingTop: 76, paddingRight: 14, backgroundColor: 'rgba(0,0,0,0.05)' },
  menuSheet: { minWidth: 170, borderRadius: 12, elevation: 8, paddingVertical: 6 },
  menuItem: { paddingHorizontal: 18, paddingVertical: 13 },
  menuItemText: { fontSize: 16 },

  /* ── User search ── */
  userSearchInput: { margin: 12, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  userItemName: { fontSize: 15, fontWeight: '600' },
  userItemSub: { fontSize: 12, color: '#8696a0', marginTop: 1 },

  /* ── Emoji panel ── */
  emojiPanel: { height: 220, borderTopWidth: StyleSheet.hairlineWidth },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  emojiItem: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  emojiText: { fontSize: 24 },

  /* ── Context menu ── */
  contextMenu: { position: 'absolute', backgroundColor: '#fff', borderRadius: 12, elevation: 8, overflow: 'hidden', minWidth: 160 },
  contextMenuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  contextMenuText: { fontSize: 14 },
});
