import React, { useState, useEffect, useRef } from 'react';
import { Message, Religion, ChatSession, ThemeId } from './types';
import { RELIGIONS, INITIAL_TOPICS, THEMES } from './constants';
import * as GeminiService from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ReligionSelector from './components/ReligionSelector';
import DailyReflection from './components/DailyReflection';
import WelcomeScreen from './components/WelcomeScreen';
import { Chat, GenerateContentResponse, Content } from '@google/genai';
import { History, Trash2, ArrowRight, Palette, X, MessageSquare, Menu, LogOut } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [selectedReligion, setSelectedReligion] = useState<Religion>(Religion.UNIVERSAL);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reflection, setReflection] = useState<string>("");
  const [reflectionLoading, setReflectionLoading] = useState(false);
  
  // Theme State Initialization with System Preference Detection
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(() => {
    try {
      // 1. Check user preference in LocalStorage
      const savedTheme = localStorage.getItem('app_theme');
      if (savedTheme && Object.values(ThemeId).includes(savedTheme as ThemeId)) {
        return savedTheme as ThemeId;
      }
      // 2. Check System Dark Mode Preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return ThemeId.NOCTURNAL;
      }
    } catch (e) {
      console.warn("Could not access localStorage or matchMedia", e);
    }
    // 3. Default
    return ThemeId.SERENE;
  });
  
  // UI State
  const [showWelcome, setShowWelcome] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  
  // Session History State
  const [history, setHistory] = useState<ChatSession[]>([]);

  // Refs
  const chatInstance = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derived
  const theme = THEMES[currentThemeId];
  const colors = theme.colors;

  // Initialize Chat (helper)
  const initChat = (religion: Religion, existingMessages: Message[] = []) => {
    // Convert Message[] to Gemini Content format for history
    const geminiHistory: Content[] = existingMessages
      .filter(m => !m.isError) // Exclude error messages from context
      .map(m => {
        const parts = [];
        if (m.audio) {
            parts.push({ inlineData: { mimeType: m.mimeType || 'audio/webm', data: m.audio } });
        }
        if (m.text) {
            parts.push({ text: m.text });
        }
        // If message has no content, fallback to empty text to avoid crashes
        if (parts.length === 0) parts.push({ text: '...' });

        return {
           role: m.role,
           parts: parts
        };
      });

    chatInstance.current = GeminiService.startChatSession(religion, geminiHistory);
    
    // Only add greeting if we are starting fresh
    if (existingMessages.length === 0) {
        const config = RELIGIONS.find(r => r.id === religion);
        setMessages([{
            id: 'init-1',
            role: 'model',
            text: config ? config.greeting : 'Olá, estou aqui para ouvir você.',
            timestamp: new Date()
        }]);
    }
  };

  // Load Reflection
  const loadReflection = async (religion: Religion) => {
    setReflectionLoading(true);
    try {
      const text = await GeminiService.generateReflection(religion);
      setReflection(text);
    } catch (e: any) {
      console.error("Reflection failed", e);
      // Fallback text is handled in the service, but if it bubbles up:
      setReflection("A paz começa dentro de você.");
    } finally {
      setReflectionLoading(false);
    }
  };

  // INITIALIZATION
  useEffect(() => {
    // 1. Load History
    const savedHistory = localStorage.getItem('chat_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
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

    // Theme is now loaded in useState initializer

    // 2. Load Active Session OR Preferred Religion
    const activeSession = localStorage.getItem('active_session');
    let restoredSession = false;
    
    if (activeSession) {
        try {
            const parsed = JSON.parse(activeSession);
            if (parsed.messages && parsed.messages.length > 0) {
                const rehydratedMessages = parsed.messages.map((m: any) => ({
                    ...m, 
                    timestamp: new Date(m.timestamp)
                }));
                const religion = parsed.religion || Religion.UNIVERSAL;
                
                // Restore state and Skip Welcome
                setMessages(rehydratedMessages);
                setSelectedReligion(religion);
                
                try {
                  initChat(religion, rehydratedMessages);
                } catch (e) {
                  console.error("Failed to restore chat session", e);
                }
                
                loadReflection(religion);
                setShowWelcome(false);
                restoredSession = true;
            }
        } catch (e) {
            console.error("Failed to restore active session", e);
        }
    }

    if (!restoredSession) {
        // If no active session, check for preferred religion to pre-select or default
        const preferred = localStorage.getItem('preferred_religion');
        if (preferred && Object.values(Religion).includes(preferred as Religion)) {
            setSelectedReligion(preferred as Religion);
        }
        // We stay on Welcome Screen (showWelcome is true by default)
    }
    
    setIsAppReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PERSISTENCE: Save Active Session
  useEffect(() => {
    if (!isAppReady) return;
    
    // If on welcome screen, don't save active session (or clear it if we wanted to be strict)
    if (showWelcome) return;

    localStorage.setItem('active_session', JSON.stringify({
        messages,
        religion: selectedReligion
    }));
  }, [messages, selectedReligion, isAppReady, showWelcome]);

  // PERSISTENCE: Save History
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(history));
  }, [history]);

  // ACTION: Start Chat from Welcome Screen
  const handleStartFromWelcome = (religion: Religion) => {
      setSelectedReligion(religion);
      localStorage.setItem('preferred_religion', religion); // Persist choice
      
      // Critical Fix: Update UI state BEFORE attempting logic that might fail (API calls)
      setShowWelcome(false);
      setMessages([]);
      
      try {
        initChat(religion, []);
      } catch (error) {
        console.error("Failed to init chat", error);
        // Show friendly error in chat instead of crashing
        setMessages([{
            id: 'init-error',
            role: 'model',
            text: "Não foi possível conectar ao servidor. Verifique se a Chave de API está configurada corretamente.",
            timestamp: new Date(),
            isError: true
        }]);
      }
      
      loadReflection(religion).catch(e => console.error(e));
  };

  // ACTION: Return to Home/Welcome (End Session)
  const handleExitChat = () => {
      // Archive session if valid
      if (messages.length > 1) {
          addToHistory(messages, selectedReligion);
      }
      // Clear active session from storage
      localStorage.removeItem('active_session');
      setMessages([]);
      setShowWelcome(true);
      setIsMobileMenuOpen(false);
  };

  // Handle Religion Change from Sidebar
  const handleReligionChange = (newReligion: Religion) => {
      if (newReligion === selectedReligion) return;

      if (messages.length > 1) { 
         addToHistory(messages, selectedReligion);
      }

      setSelectedReligion(newReligion);
      localStorage.setItem('preferred_religion', newReligion); // Update persistence
      setMessages([]); 
      
      try {
        initChat(newReligion, []);
      } catch (e) {
        console.error("Init chat failed", e);
      }
      loadReflection(newReligion);
      
      if(window.innerWidth < 768) setIsMobileMenuOpen(false);
  };

  const changeTheme = (id: ThemeId) => {
      setCurrentThemeId(id);
      localStorage.setItem('app_theme', id);
  };

  const addToHistory = (msgs: Message[], rel: Religion) => {
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
    if (!chatInstance.current) {
        // Try to re-init if instance is missing
        try {
            initChat(selectedReligion, messages);
        } catch(e) {
            console.error("Cannot send message, chat not initialized");
            return;
        }
    }
    
    if (!chatInstance.current) return;

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
      const result = await GeminiService.sendMessage(chatInstance.current, text, audio);
      
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

    } catch (error: any) {
      console.error(error);
      
      let errorMessage = "Desculpe, houve uma desconexão espiritual momentânea. Por favor, tente novamente.";
      
      // Enhanced error detection for Leaked API Keys or Permission issues
      const errString = String(error).toLowerCase();
      const errMsg = error?.message?.toLowerCase() || '';
      
      if (errString.includes('leaked') || errMsg.includes('leaked') || errString.includes('permission_denied') || errMsg.includes('permission_denied')) {
        errorMessage = "Acesso negado: Sua Chave de API foi bloqueada por segurança (relatada como vazada) ou é inválida. Por favor, gere uma nova chave no Google AI Studio.";
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: errorMessage,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistorySession = (session: ChatSession) => {
      if (messages.length > 1) {
          addToHistory(messages, selectedReligion);
      }
      
      setSelectedReligion(session.religion);
      setMessages(session.messages);
      
      try {
        initChat(session.religion, session.messages);
      } catch (e) {
        console.error(e);
      }
      
      setIsHistoryOpen(false);
      setIsMobileMenuOpen(false);
      setShowWelcome(false); // Ensure we leave welcome screen
  };
  
  const clearHistory = () => {
      setHistory([]);
      localStorage.removeItem('chat_history');
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setHistory(prev => prev.filter(s => s.id !== id));
  };

  // RENDER: WELCOME SCREEN
  if (showWelcome && isAppReady) {
      return (
          <WelcomeScreen 
            onSelect={handleStartFromWelcome} 
            theme={theme} 
            initialSelected={selectedReligion} 
          />
      );
  }

  // RENDER: CHAT INTERFACE
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
            {messages.map((msg, index) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                theme={theme} 
                isGenerating={isLoading && index === messages.length - 1 && msg.role === 'model'}
              />
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
        {/* Sidebar Content */}
        <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
          
          <div className="flex justify-between items-center mb-6 pt-2 md:pt-0">
            {/* Title only visible on desktop sidebar */}
            <h1 className={`hidden md:block text-2xl font-serif font-bold ${colors.textMain} tracking-tight`}>Fale com Deus</h1>
            
            {/* On mobile, we show 'Configurações' title instead of app title in sidebar */}
            <h2 className={`md:hidden text-xl font-serif font-bold ${colors.textMain}`}>Caminho Espiritual</h2>

            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsHistoryOpen(true)}
                    className={`p-2 ${colors.textMuted} hover:text-indigo-600 hover:bg-slate-100/50 rounded-full transition-colors`}
                    title="Ver Histórico"
                >
                    <History size={20} />
                </button>
                <button
                    onClick={handleExitChat}
                    className={`p-2 ${colors.textMuted} hover:text-red-600 hover:bg-red-50 rounded-full transition-colors`}
                    title="Sair para o Início"
                >
                    <LogOut size={20} />
                </button>

                {/* Mobile Close Button (Inside header to avoid overlap) */}
                <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`md:hidden p-2 rounded-full ${colors.textSecondary} hover:bg-black/5`}
                >
                    <X size={20} />
                </button>
            </div>
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
            <ReligionSelector selected={selectedReligion} onSelect={handleReligionChange} theme={theme} />
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