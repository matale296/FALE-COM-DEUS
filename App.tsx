import React, { useState, useEffect, useRef } from 'react';
import { Message, Religion, ChatSession, ThemeId } from './types';
import { RELIGIONS, INITIAL_TOPICS, THEMES } from './constants';
import * as GeminiService from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ReligionSelector from './components/ReligionSelector';
import DailyReflection from './components/DailyReflection';
import { Chat, GenerateContentResponse } from '@google/genai';
import { History, Trash2, ArrowRight, Palette, X, MessageSquare, Menu } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [selectedReligion, setSelectedReligion] = useState<Religion>(Religion.UNIVERSAL);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reflection, setReflection] = useState<string>("");
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(ThemeId.SERENE);
  
  // UI State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Session History State
  const [history, setHistory] = useState<ChatSession[]>([]);

  // Refs
  const chatInstance = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derived
  const theme = THEMES[currentThemeId];
  const colors = theme.colors;

  // Initialize Chat
  const initChat = (religion: Religion) => {
    chatInstance.current = GeminiService.startChatSession(religion);
    const config = RELIGIONS.find(r => r.id === religion);
    
    // Add initial greeting from the system (simulated)
    setMessages([{
      id: 'init-1',
      role: 'model',
      text: config ? config.greeting : 'Olá, estou aqui para ouvir você.',
      timestamp: new Date()
    }]);
  };

  // Load Reflection
  const loadReflection = async (religion: Religion) => {
    setReflectionLoading(true);
    const text = await GeminiService.generateReflection(religion);
    setReflection(text);
    setReflectionLoading(false);
  };

  // Setup on Mount and Religion Change
  useEffect(() => {
    // If there is an existing conversation when switching religion, save it to history?
    // For now, we just reset or keep context. Let's restart context for new religion.
    // If user has typed messages, save to history before switching.
    if (messages.length > 1) { 
       addToHistory(messages, selectedReligion);
    }

    initChat(selectedReligion);
    loadReflection(selectedReligion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReligion]);

  // Load history from local storage
  useEffect(() => {
    const saved = localStorage.getItem('chat_history');
    const savedTheme = localStorage.getItem('app_theme');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Rehydrate dates
        const hydrated = parsed.map((s: any) => ({
            ...s,
            date: new Date(s.date),
            messages: s.messages.map((m: any) => ({...m, timestamp: new Date(m.timestamp)}))
        }));
        setHistory(hydrated);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    if (savedTheme && Object.values(ThemeId).includes(savedTheme as ThemeId)) {
        setCurrentThemeId(savedTheme as ThemeId);
    }
  }, []);

  // Save history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(history));
  }, [history]);

  // Save theme
  const changeTheme = (id: ThemeId) => {
      setCurrentThemeId(id);
      localStorage.setItem('app_theme', id);
  };

  const addToHistory = (msgs: Message[], rel: Religion) => {
     // Only save if there is real conversation
     const userMsgs = msgs.filter(m => m.role === 'user');
     if (userMsgs.length === 0) return;

     const newSession: ChatSession = {
       id: Date.now().toString(),
       date: new Date(),
       religion: rel,
       preview: userMsgs[0].text ? (userMsgs[0].text.substring(0, 50) + '...') : 'Mensagem de voz',
       title: userMsgs[0].text ? userMsgs[0].text.substring(0, 30) : 'Nova conversa',
       messages: msgs
     };
     setHistory(prev => {
        // Avoid duplicates if saving same session
        const existingIndex = prev.findIndex(s => s.messages[0].timestamp.getTime() === msgs[0].timestamp.getTime());
        if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newSession;
            return updated;
        }
        return [newSession, ...prev];
     });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string, audio?: { data: string; mimeType: string }) => {
    if (!chatInstance.current) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
      audio: audio?.data,
      mimeType: audio?.mimeType
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Use the service helper to handle text or audio
      const result = await GeminiService.sendMessage(chatInstance.current, text, audio);
      
      // Placeholder for AI response
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'model',
        text: '',
        timestamp: new Date()
      }]);

      let fullText = '';
      
      for await (const chunk of result) {
        const chunkText = (chunk as GenerateContentResponse).text;
        if (chunkText) {
            fullText += chunkText;
            setMessages(prev => prev.map(m => 
                m.id === aiMsgId ? { ...m, text: fullText } : m
            ));
        }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Desculpe, houve uma desconexão espiritual momentânea. Por favor, tente novamente.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistorySession = (session: ChatSession) => {
      // Save current if needed
      if (messages.length > 1) {
          addToHistory(messages, selectedReligion);
      }
      setSelectedReligion(session.religion);
      // Small timeout to allow religion state to update before setting messages
      setTimeout(() => {
          setMessages(session.messages);
          setIsHistoryOpen(false);
          setIsMobileMenuOpen(false); // Close mobile menu if open
      }, 50);
  };
  
  const clearHistory = () => {
      setHistory([]);
      localStorage.removeItem('chat_history');
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setHistory(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className={`flex h-screen ${colors.bgApp} relative overflow-hidden transition-colors duration-500`}>
      
      {/* Main Chat Area (LEFT on Desktop, Full on Mobile) */}
      <main className="flex-1 h-full flex flex-col relative z-0 min-w-0">
        
        {/* Mobile Header */}
        <div className={`md:hidden flex-shrink-0 h-16 flex items-center justify-between px-4 border-b ${colors.border} ${colors.bgSidebar}`}>
            <h1 className={`text-xl font-serif font-bold ${colors.textMain} tracking-tight`}>Fale com Deus</h1>
            <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className={`p-2 rounded-lg ${colors.textSecondary} hover:bg-black/5`}
            >
                <Menu size={24} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-12 md:py-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} theme={theme} />
            ))}
            {isLoading && (
              <div className={`flex items-center gap-2 ${colors.textMuted} text-sm ml-4 mb-4 animate-pulse`}>
                <div className={`w-2 h-2 rounded-full ${colors.accent.replace('text-', 'bg-')}`}></div>
                <div className={`w-2 h-2 rounded-full animation-delay-200 ${colors.accent.replace('text-', 'bg-')}`}></div>
                <div className={`w-2 h-2 rounded-full animation-delay-400 ${colors.accent.replace('text-', 'bg-')}`}></div>
                <span className="ml-2">Ouvindo...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className={`p-4 md:p-6 bg-gradient-to-t ${currentThemeId === ThemeId.NOCTURNAL ? 'from-slate-900 via-slate-900/90' : 'from-slate-50 via-slate-50/90'} to-transparent transition-colors duration-500`}>
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} theme={theme} />
          <p className={`text-center text-[10px] ${colors.textMuted} mt-2`}>
            IA generativa pode cometer erros. Use para reflexão, não como dogma absoluto.
          </p>
        </div>
      </main>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Right Sidebar (RIGHT - Fixed on Desktop, Drawer on Mobile) */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-80 md:w-96 flex-shrink-0 
        ${colors.bgSidebar} border-l ${colors.border} 
        flex flex-col transition-transform duration-300 shadow-2xl md:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 md:static md:block
      `}>
        {/* Mobile Close Button */}
        <div className="md:hidden absolute top-4 right-4 z-50">
            <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-2 rounded-full ${colors.bgApp} shadow-sm text-slate-500`}
            >
                <X size={20} />
            </button>
        </div>

        <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
          
          <div className="flex justify-between items-center mb-6 pt-2 md:pt-0">
            {/* Title only visible on desktop sidebar */}
            <h1 className={`hidden md:block text-2xl font-serif font-bold ${colors.textMain} tracking-tight`}>Fale com Deus</h1>
            
            {/* On mobile, we show 'Configurações' title instead of app title in sidebar */}
            <h2 className={`md:hidden text-xl font-serif font-bold ${colors.textMain}`}>Caminho Espiritual</h2>

            <button 
                onClick={() => setIsHistoryOpen(true)}
                className={`p-2 ${colors.textMuted} hover:text-indigo-600 hover:bg-slate-100/50 rounded-full transition-colors`}
                title="Ver Histórico"
            >
                <History size={20} />
            </button>
          </div>

          {/* Theme Selector */}
          <div className="mb-6">
            <h3 className={`text-xs font-semibold ${colors.textMuted} uppercase tracking-wider mb-3 flex items-center gap-2`}>
                <Palette size={12} /> Tema Visual
            </h3>
            <div className="flex gap-2">
                {Object.values(THEMES).map((t) => (
                    <button
                        key={t.id}
                        onClick={() => changeTheme(t.id)}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                            currentThemeId === t.id ? `ring-2 ring-offset-2 ring-indigo-300 scale-110` : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ 
                            backgroundColor: t.id === ThemeId.NOCTURNAL ? '#1e293b' : t.id === ThemeId.EDEN ? '#047857' : t.id === ThemeId.MINIMAL ? '#ffffff' : '#4f46e5',
                            borderColor: t.id === ThemeId.MINIMAL ? '#e5e5e5' : 'transparent'
                         }}
                        title={t.name}
                    >
                        {currentThemeId === t.id && <div className={`w-2 h-2 rounded-full ${t.id === ThemeId.MINIMAL ? 'bg-black' : 'bg-white'}`} />}
                    </button>
                ))}
            </div>
          </div>

          <div className="mb-8">
            <DailyReflection text={reflection} isLoading={reflectionLoading} theme={theme} />
          </div>

          <div className="mb-8">
            <ReligionSelector selected={selectedReligion} onSelect={(r) => { setSelectedReligion(r); if(window.innerWidth < 768) setIsMobileMenuOpen(false); }} theme={theme} />
          </div>

          <div>
             <h3 className={`text-xs font-semibold ${colors.textMuted} uppercase tracking-wider mb-3`}>Tópicos para Iniciar</h3>
             <div className="space-y-2">
               {INITIAL_TOPICS.map((topic, idx) => (
                 <button 
                  key={idx} 
                  onClick={() => { handleSendMessage(topic); if(window.innerWidth < 768) setIsMobileMenuOpen(false); }}
                  className={`w-full text-left p-3 rounded-xl ${colors.bgApp} hover:brightness-95 ${colors.textSecondary} text-sm transition-all border border-transparent hover:border-indigo-100 group flex items-center justify-between`}
                 >
                   <span>{topic}</span>
                   <ArrowRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                 </button>
               ))}
             </div>
          </div>
        </div>
      </aside>

      {/* History Modal / Overlay */}
      {isHistoryOpen && (
        <div className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex justify-end">
            <div className={`w-full max-w-md h-full ${colors.bgSidebar} shadow-2xl flex flex-col animate-slide-in-right`}>
                <div className={`p-6 border-b ${colors.border} flex justify-between items-center`}>
                    <h2 className={`font-serif text-xl font-bold ${colors.textMain}`}>Suas Conversas</h2>
                    <div className="flex gap-2">
                        {history.length > 0 && (
                            <button 
                                onClick={clearHistory}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Limpar tudo"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button 
                            onClick={() => setIsHistoryOpen(false)}
                            className={`p-2 ${colors.textMuted} hover:text-slate-600 rounded-full`}
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className={`text-center py-10 ${colors.textMuted}`}>
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Nenhuma conversa salva ainda.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map(session => (
                                <div 
                                    key={session.id}
                                    onClick={() => loadHistorySession(session)}
                                    className={`p-4 rounded-xl border ${colors.border} ${colors.bgApp} hover:brightness-95 cursor-pointer transition-all group relative`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                            RELIGIONS.find(r => r.id === session.religion)?.color || 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {RELIGIONS.find(r => r.id === session.religion)?.name || 'Desconhecido'}
                                        </span>
                                        <button 
                                            onClick={(e) => deleteSession(e, session.id)}
                                            className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <p className={`font-semibold text-sm mb-1 ${colors.textMain} line-clamp-1`}>{session.title}</p>
                                    <p className={`text-xs ${colors.textMuted} line-clamp-2 mb-2`}>{session.preview}</p>
                                    <p className={`text-[10px] ${colors.textMuted} text-right`}>
                                        {new Date(session.date).toLocaleDateString()} • {new Date(session.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;