export enum Religion {
  UNIVERSAL = 'Espiritualidade Universal',
  CHRISTIANITY = 'Cristianismo',
  CATHOLICISM = 'Catolicismo',
  EVANGELICAL = 'Evangélico',
  SPIRITISM = 'Espiritismo',
  BUDDHISM = 'Budismo',
  HINDUISM = 'Hinduísmo',
  ISLAM = 'Islamismo',
  JUDAISM = 'Judaísmo',
  UMBANDA = 'Umbanda/Candomblé',
  STOICISM = 'Estoicismo (Filosofia)',
  AGNOSTIC = 'Agnóstico/Cético'
}

export enum ThemeId {
  SERENE = 'serene',
  EDEN = 'eden',
  NOCTURNAL = 'nocturnal',
  MINIMAL = 'minimal'
}

export interface ThemeColors {
  bgApp: string;
  bgSidebar: string;
  textMain: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  accent: string;
  border: string;
  bubbleUser: string;
  bubbleUserText: string;
  bubbleModel: string;
  bubbleModelText: string;
  inputBg: string;
  inputText: string;
  selectionHighlight: string;
  reflectionCardFrom: string;
  reflectionCardTo: string;
  reflectionCardBorder: string;
  reflectionText: string;
  reflectionIcon: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  colors: ThemeColors;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  audio?: string; // Base64 encoded audio
  mimeType?: string;
  timestamp: Date;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  date: Date;
  preview: string;
  religion: Religion;
  messages: Message[];
}

export interface ReligionConfig {
  id: Religion;
  name: string;
  description: string;
  icon: string;
  color: string;
  greeting: string;
}

export interface Reflection {
  text: string;
  source?: string;
}