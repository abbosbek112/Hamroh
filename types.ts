export type NavigationParams = { tab?: string };

export enum AppView {
  HOME = 'HOME',
  INTIZOM = 'INTIZOM',
  COMMUNITY = 'COMMUNITY',
  ABOUT = 'ABOUT',
  SUPPORT = 'SUPPORT',
  SETTINGS = 'SETTINGS',
  ADMIN = 'ADMIN',
  MARKET = 'MARKET',
  ORG_DASHBOARD = 'ORG_DASHBOARD',
  PARENT_PORTAL = 'PARENT_PORTAL',
}

export interface Badge {
  id: string;
  name: string;
  icon: string; // Emoji or URL
  description: string;
  isSecret?: boolean;
}

export interface User {
  id: string; // UUID from Auth provider
  name: string;
  username: string;
  email?: string;
  avatar: string;
  role: 'user' | 'admin';
  xp: number;
  level: number;
  streak: number;
  focusMinutes: number;
  // Settings
  bio?: string;
  phoneNumber?: string;
  age?: number;
  badges: string[]; // Array of Badge IDs
  inventory: string[]; // Array of purchased StoreItem IDs
  selectedBadgeId?: string;
  theme?: 'light' | 'dark';
  appTheme?: 'neon' | 'forest' | 'midnight';
  doubleXpExpiresAt?: number;
  focusBoosterExpiresAt?: string; // ISO Date string
  language?: 'uz' | 'ru' | 'en';
  status?: 'Active' | 'Banned';
  banExpiresAt?: string; // ISO Date for temporary bans
  lastActive?: number;
  createdAt?: string; // ISO Date for DB
  platform?: 'desktop' | 'mobile_android' | 'mobile_ios' | 'web';
  // Transformation System
  identity?: UserIdentity;
  routines?: RoutineStack[];
  lastReviewDate?: number; // Timestamp of last weekly review
}

export interface SupportMessage {
  id: string;
  text: string;
  sender: 'user' | 'admin';
  timestamp: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  status: 'OPEN' | 'RESOLVED';
  lastMessage: string;
  lastUpdated: number;
  messages: SupportMessage[];
  createdAt?: string;
}

export interface RoutineTask {
  id: string;
  time: string; // HH:MM
  title: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  userId?: string; // Foreign Key
  createdAt?: string;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  deadline: string; // ISO Date string
  userId?: string; // Foreign Key
  createdAt?: string;
}

export interface CommunityGroup {
  id: string;
  name: string;
  members: number;
  memberIds: string[]; // JSONB array in DB
  ownerId: string;
  category: string;
  description: string;
  pinnedMessageId?: string;
  lastMessage?: {
    text: string;
    sender: string;
    time: number;
  };
  createdAt?: string;
}

// Unified Message Interface for Groups and DMs
export interface GroupMessage {
  id: string;
  text: string;
  timestamp: number;
  userId: string;
  userName: string;
  userAvatar: string;
  readAt?: number;

  // Context
  groupId?: string;    // If Group Chat
  receiverId?: string; // If Direct Chat

  isSystem?: boolean;

  // JSONB in DB
  reactions?: { [emoji: string]: string[] }; // Changed to array of user IDs (1 user = 1 reaction type)
  replyTo?: {
    id: string;
    userName: string;
    text: string;
    userId?: string; // Optional: for better reference
  };
  isEdited?: boolean;
}

export interface JournalEntry {
  id: string;
  text: string;
  mood: string;
  timestamp: number;
  userId?: string;
  aiComment?: string;
}

export interface DailyReflection {
  id?: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  actionSatisfaction?: 'yoq' | 'ortacha' | 'ha';
  goalAchievement?: 'yaxshi' | 'ortacha' | 'ajoyib';
  mood?: number; // 1 to 5
  grateful1?: string;
  grateful2?: string;
  proud1?: string;
  proud2?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  completedToday: boolean;
  category: string;
}

export interface LimitPair {
  free: number;    // -1 means unlimited
}

export interface SystemConfig {
  limits: {
    aiDailyMessages: LimitPair;
    groupCreation: LimitPair;
    groupJoining: LimitPair;
    uploadSizeMB: LimitPair;
    activeHabits: LimitPair;
    historyRetentionDays: LimitPair;
  };
}

// --- MARKETING TYPES ---
export interface Deal {
  id: string;
  clientName: string;
  campaignTitle: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Pending' | 'Completed';
  type: 'Sponsorship' | 'Ad Integration' | 'Partnership';
  logoColor: string;
}

export interface ActiveAd {
  id: string;
  dealId: string;
  title: string;
  description: string;
  image: string;
  link: string;
  views: number;
  clicks: number;
  status: 'Running' | 'Expired';
  bgGradient: string;
  targetAudience: string;
}

// --- ADMIN TYPES ---
export interface AdminUser extends User {
  riskScore: number;
  joinedDate: string;
  lastActive: any;
}

export interface AdminGroup extends CommunityGroup {
  healthScore: number;
  status: 'Healthy' | 'Warning' | 'Critical';
  aiSummary: string;
}

export interface SpamLog {
  id: string;
  user: string;
  content: string;
  aiConfidence: number;
  timestamp: string;
  type: 'Scam' | 'Hate Speech' | 'Spam';
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'Server' | 'Marketing' | 'Team' | 'Office' | 'Other';
  date: string;
  description?: string;
}

// --- REAL TIME EVENTS ---
export type EventType =
  | 'NEW_MESSAGE'
  | 'UPDATE_MESSAGE'
  | 'DELETE_MESSAGE'
  | 'USER_ONLINE'
  | 'ROUTINE_UPDATE'
  | 'USER_UPDATE'
  | 'CHALLENGE_UPDATE';

export interface SocketEvent {
  type: EventType;
  payload: any;
  channelId: string; // groupId or userId
}

// --- MARKET TYPES ---
export type StoreItemType = 'THEME' | 'UTILITY' | 'BADGE';

export interface StoreItem {
  id: string;
  type: StoreItemType;
  isPremium?: boolean;
  name: string;
  description: string;
  price: number;
  icon: string;
  value?: string; // For themes: the theme key, for badges: the badge ID
}

// --- CHALLENGE TYPES ---


export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  participantsCount: number;
  rewardXP: number;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  category?: string;
  totalCheckIns?: number;
  lastCheckIn?: string;
  isJoined?: boolean; // populated by getChallenges
}

export interface UserChallenge {
  userId: string;
  challengeId: string;
  progress: number; // Percentage 0-100
  status: 'JOINED' | 'COMPLETED';
  lastCheckIn?: string; // ISO Date of last check-in
  streak: number;
}

export interface ChallengeParticipant {
  userId: string;
  name: string;
  avatar: string;
  progress: number; // value relevant to challenge (e.g. days completed)
  rank: number;
}


// --- TRANSFORMATION SYSTEM TYPES (AI-FREE) ---

export interface UserIdentity {
  manifest: string; // "I am a person who..." (1-2 sentences)
  values: string[]; // 3 core values
  reason: string; // "Why do I do this?"
  startDate: string; // ISO Date for 90-day challenge
}

export interface SmartJournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'MORNING' | 'EVENING';
  answers: {
    questionId: string;
    answer: string;
    text?: string; // For custom inputs
  }[];
  energyLevel: number; // 1-5 slider
  feedback?: string; // Rule-based system Feedback
  createdAt: number;
}

export interface RoutineStep {
  id: string;
  title: string;
  duration: number; // minutes, optional
  isCompleted: boolean;
}

export interface RoutineStack {
  id: string;
  name: string; // e.g., "Morning Ritual"
  steps: RoutineStep[];
  currentStepIndex: number;
  isCompleted: boolean;
  streak: number;
  lastCompletedDate: string; // YYYY-MM-DD
}

// --- ORGANIZATION (O'QUV MARKAZ) TYPES ---

export type OrgRole = 'teacher' | 'student' | 'parent';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  inviteCode: string;
  ownerId: string;
  subscriptionPlan: 'free' | 'starter' | 'standard';
  maxStudents: number;
  memberCount?: number;
  createdAt?: string;
}

export interface OrganizationMember {
  id: string;
  orgId: string;
  userId: string;
  role: OrgRole;
  classId?: string;
  joinedAt?: string;
  // Joined user data
  userName?: string;
  userAvatar?: string;
  userXp?: number;
  userLevel?: number;
  userStreak?: number;
  userFocusMinutes?: number;
  userLastActive?: number;
}

export interface OrgClass {
  id: string;
  orgId: string;
  name: string;
  teacherId?: string;
  teacherName?: string;
  studentCount?: number;
  createdAt?: string;
}

export interface StudentAnalytics {
  userId: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  focusMinutes: number;
  todosCompleted: number;
  todosTotal: number;
  routinesCompleted: number;
  routinesTotal: number;
  lastActive: number;
  riskLevel: 'safe' | 'warning' | 'danger';
}

export interface TeacherTask {
  id: string;
  orgId: string;
  assignedBy: string;
  assignedTo: string;
  assignedToName?: string;
  assignedByName?: string;
  classId?: string;
  title: string;
  description?: string;
  deadline?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface ParentStudentLink {
  id: string;
  parentId: string;
  studentId: string;
  orgId: string;
  studentName?: string;
  studentAvatar?: string;
  createdAt: string;
}
