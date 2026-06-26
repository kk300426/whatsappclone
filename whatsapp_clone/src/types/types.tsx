export type Theme = {
  text: string;
  border: string;
  muted: string;
  soft: string;
  background: string;
  chatBackground: string;
  card: string;
  accent: string;
  headerBg: string;
  inputBg: string;
  bubbleSent: string;
  bubbleReceived: string;
  bubbleSentText: string;
  bubbleReceivedText: string;
  online: string;
  danger: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
  profile_pic: string;
  about: string;
  online: boolean;
  last_seen: string;
};

export type Conversation = {
  id: string;
  name: string | null;
  is_group: boolean;
  group_icon: string;
  updated_at: string;
  last_message: Message | null;
  unread_count: number;
  members: User[];
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'file';
  media_url: string;
  reply_to: string | null;
  reply_message: ReplyMessage | null;
  is_deleted: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  sender: { id: string; username: string; profile_pic: string };
  statuses: MessageStatus[];
};

export type ReplyMessage = {
  id: string;
  content: string;
  type: string;
  sender: { username: string };
};

export type MessageStatus = {
  user_id: string;
  status: 'sent' | 'delivered' | 'seen';
};

export type StatusUpdate = {
  id: string;
  user_id: string;
  content: string;
  media_url: string;
  type: 'text' | 'image';
  viewers: string[];
  expires_at: string;
  created_at: string;
  user: { id: string; username: string; profile_pic: string };
};

export type Tab = 'chats' | 'updates' | 'communities' | 'calls';
export type Screen =
  | Tab
  | 'chat'
  | 'settings'
  | 'profile'
  | 'search_users'
  | 'new_group'
  | 'status_view';
