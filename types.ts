export enum VoiceName {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export interface StudyConfig {
  voice: VoiceName;
  speed: number;
  autoPlay: boolean;
}

export interface UserGoals {
  objectives: string;
  knowledgeBase: string;
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  audioData?: {
    buffer: AudioBuffer;
    duration: number;
  };
  isTyping?: boolean;
}

export interface AudioState {
  isPlaying: boolean;
  currentMessageId: string | null;
  currentTime: number;
  duration: number;
}
