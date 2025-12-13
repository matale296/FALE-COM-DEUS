import { Religion, ReligionConfig, Theme, ThemeId } from './types';
import { Book, Heart,  Moon, Sun, Cloud, Star,  Flame, Flower, Anchor,  Scale, Globe, Zap } from 'lucide-react';

export const THEMES: Record<ThemeId, Theme> = {
  [ThemeId.SERENE]: {
    id: ThemeId.SERENE,
    name: 'Sereno',
    colors: {
      bgApp: 'bg-slate-50',
      bgSidebar: 'bg-white',
      textMain: 'text-slate-900',
      textSecondary: 'text-slate-700',
      textMuted: 'text-slate-400',
      primary: 'bg-indigo-600',
      primaryHover: 'hover:bg-indigo-700',
      accent: 'text-indigo-600',
      border: 'border-slate-200',
      bubbleUser: 'bg-indigo-600',
      bubbleUserText: 'text-white',
      bubbleModel: 'bg-white',
      bubbleModelText: 'text-slate-700',
      inputBg: 'bg-white',
      inputText: 'text-slate-700',
      selectionHighlight: 'bg-indigo-50 border-indigo-200 ring-indigo-300',
      reflectionCardFrom: 'from-amber-50',
      reflectionCardTo: 'to-orange-50',
      reflectionCardBorder: 'border-amber-100',
      reflectionText: 'text-amber-900',
      reflectionIcon: 'text-amber-200'
    }
  },
  [ThemeId.EDEN]: {
    id: ThemeId.EDEN,
    name: 'Éden',
    colors: {
      bgApp: 'bg-[#f5f5f4]', // Stone-100 ish
      bgSidebar: 'bg-[#e7e5e4]', // Stone-200
      textMain: 'text-stone-800',
      textSecondary: 'text-stone-700',
      textMuted: 'text-stone-400',
      primary: 'bg-emerald-700',
      primaryHover: 'hover:bg-emerald-800',
      accent: 'text-emerald-700',
      border: 'border-stone-300',
      bubbleUser: 'bg-emerald-700',
      bubbleUserText: 'text-emerald-50',
      bubbleModel: 'bg-[#fafaf9]', // Stone-50
      bubbleModelText: 'text-stone-800',
      inputBg: 'bg-[#fafaf9]',
      inputText: 'text-stone-800',
      selectionHighlight: 'bg-emerald-100 border-emerald-300 ring-emerald-400',
      reflectionCardFrom: 'from-lime-50',
      reflectionCardTo: 'to-emerald-50',
      reflectionCardBorder: 'border-emerald-100',
      reflectionText: 'text-emerald-900',
      reflectionIcon: 'text-emerald-200'
    }
  },
  [ThemeId.NOCTURNAL]: {
    id: ThemeId.NOCTURNAL,
    name: 'Noturno',
    colors: {
      bgApp: 'bg-slate-900',
      bgSidebar: 'bg-slate-800',
      textMain: 'text-slate-100',
      textSecondary: 'text-slate-300',
      textMuted: 'text-slate-500',
      primary: 'bg-violet-600',
      primaryHover: 'hover:bg-violet-500',
      accent: 'text-violet-400',
      border: 'border-slate-700',
      bubbleUser: 'bg-violet-600',
      bubbleUserText: 'text-white',
      bubbleModel: 'bg-slate-800',
      bubbleModelText: 'text-slate-200',
      inputBg: 'bg-slate-800',
      inputText: 'text-slate-100',
      selectionHighlight: 'bg-violet-900/50 border-violet-500 ring-violet-500',
      reflectionCardFrom: 'from-slate-800',
      reflectionCardTo: 'to-slate-800',
      reflectionCardBorder: 'border-slate-600',
      reflectionText: 'text-slate-200',
      reflectionIcon: 'text-slate-600'
    }
  },
  [ThemeId.MINIMAL]: {
    id: ThemeId.MINIMAL,
    name: 'Minimalista',
    colors: {
      bgApp: 'bg-white',
      bgSidebar: 'bg-white',
      textMain: 'text-black',
      textSecondary: 'text-neutral-800',
      textMuted: 'text-neutral-400',
      primary: 'bg-black',
      primaryHover: 'hover:bg-neutral-800',
      accent: 'text-black',
      border: 'border-neutral-200',
      bubbleUser: 'bg-black',
      bubbleUserText: 'text-white',
      bubbleModel: 'bg-white',
      bubbleModelText: 'text-black',
      inputBg: 'bg-white',
      inputText: 'text-black',
      selectionHighlight: 'bg-neutral-100 border-black ring-neutral-400',
      reflectionCardFrom: 'from-neutral-50',
      reflectionCardTo: 'to-white',
      reflectionCardBorder: 'border-neutral-200',
      reflectionText: 'text-neutral-900',
      reflectionIcon: 'text-neutral-200'
    }
  }
};

export const RELIGIONS: ReligionConfig[] = [
  {
    id: Religion.UNIVERSAL,
    name: 'Espiritualidade Universal',
    description: 'Sabedoria focada no amor, luz e conexão cósmica.',
    icon: 'Globe',
    color: 'bg-indigo-100 text-indigo-700',
    greeting: 'A paz esteja com você, filho(a) do universo.'
  },
  {
    id: Religion.CHRISTIANITY,
    name: 'Cristianismo',
    description: 'Baseado nos ensinamentos de Cristo e na Bíblia Sagrada.',
    icon: 'Cross', // Mapped visually
    color: 'bg-blue-100 text-blue-700',
    greeting: 'A graça e a paz do Senhor estejam com você.'
  },
  {
    id: Religion.CATHOLICISM,
    name: 'Catolicismo',
    description: 'Tradição, santos e sacramentos da Igreja.',
    icon: 'Cross',
    color: 'bg-yellow-100 text-yellow-800',
    greeting: 'Que a benção divina ilumine seu caminho.'
  },
  {
    id: Religion.EVANGELICAL,
    name: 'Evangélico',
    description: 'Foco na Palavra, louvor e relação pessoal com Deus.',
    icon: 'Book',
    color: 'bg-emerald-100 text-emerald-700',
    greeting: 'A paz do Senhor, meu irmão(ã).'
  },
  {
    id: Religion.SPIRITISM,
    name: 'Espiritismo',
    description: 'Consolo, caridade e evolução da alma (Kardec).',
    icon: 'Ghost', // Using a soft icon
    color: 'bg-violet-100 text-violet-700',
    greeting: 'Muita luz e paz em sua jornada evolutiva.'
  },
  {
    id: Religion.BUDDHISM,
    name: 'Budismo',
    description: 'Dharma, compaixão e o caminho do meio.',
    icon: 'Flower',
    color: 'bg-amber-100 text-amber-700',
    greeting: 'Namastê. Que você encontre a paz interior.'
  },
  {
    id: Religion.HINDUISM,
    name: 'Hinduísmo',
    description: 'Karma, Dharma e a divindade em tudo.',
    icon: 'Sun',
    color: 'bg-orange-100 text-orange-700',
    greeting: 'Namastê. Que a luz do divino brilhe em você.'
  },
  {
    id: Religion.ISLAM,
    name: 'Islamismo',
    description: 'Submissão a Allah e paz (Salam).',
    icon: 'Moon',
    color: 'bg-green-100 text-green-700',
    greeting: 'As-salamu alaykum (A paz esteja convosco).'
  },
  {
    id: Religion.JUDAISM,
    name: 'Judaísmo',
    description: 'Sabedoria da Torá e tradição ancestral.',
    icon: 'Star',
    color: 'bg-cyan-100 text-cyan-700',
    greeting: 'Shalom aleikhem.'
  },
  {
    id: Religion.UMBANDA,
    name: 'Umbanda/Candomblé',
    description: 'Força dos Orixás, guias e natureza.',
    icon: 'Flame',
    color: 'bg-red-100 text-red-700',
    greeting: 'Axé e saravá, filho(a) de fé.'
  },
  {
    id: Religion.STOICISM,
    name: 'Estoicismo',
    description: 'Razão, virtude e aceitação do destino.',
    icon: 'Scale',
    color: 'bg-slate-200 text-slate-700',
    greeting: 'Saudações. Busquemos a sabedoria e a serenidade.'
  },
  {
    id: Religion.AGNOSTIC,
    name: 'Agnóstico/Cético',
    description: 'Diálogo filosófico, ético e reflexivo sem dogmas.',
    icon: 'Zap',
    color: 'bg-gray-100 text-gray-700',
    greeting: 'Olá. Vamos refletir sobre a vida com clareza.'
  }
];

export const INITIAL_TOPICS = [
  "Sinto-me ansioso(a) com o futuro.",
  "Como perdoar alguém que me feriu?",
  "Qual é o meu propósito na vida?",
  "Sinto-me sozinho(a).",
  "Preciso de coragem para uma decisão.",
  "Por que existe sofrimento?",
];