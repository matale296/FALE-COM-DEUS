import React, { useState, useRef, useEffect } from 'react';
import { Message, Theme } from '../types';
import { User, Sparkles, AlertCircle, Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
  theme: Theme;
  isGenerating?: boolean;
}

const AudioPlayer: React.FC<{ message: Message; isUser: boolean; themeColors: any }> = ({ message, isUser, themeColors }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const src = `data:${message.mimeType || 'audio/webm'};base64,${message.audio}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
  };

  const toggleExpand = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
  };

  // Styles based on sender
  const btnClass = isUser 
    ? "bg-white/20 text-white hover:bg-white/30 ring-white/50" 
    : `${themeColors.primary} text-white hover:brightness-110 ring-indigo-200`;
  
  const iconColor = isUser ? "text-white" : "text-indigo-600";
  const barBg = isUser ? "bg-white/20" : "bg-black/10";
  const barFill = isUser ? "bg-white/90" : themeColors.primary.replace('bg-', 'bg-'); // use primary color for fill
  const textColor = isUser ? "text-white/80" : themeColors.textMuted;
  const chevronColor = isUser ? "text-white/70 hover:text-white" : "text-slate-400 hover:text-slate-600";

  return (
    <div className={`flex flex-col mb-3 transition-all rounded-xl border ${isUser ? 'border-transparent bg-black/10' : 'border-slate-100 bg-slate-50'}`}>
      
      {/* Header / Collapsed View */}
      <div className="flex items-center gap-3 p-2">
        {!isExpanded && (
            <button
            onClick={togglePlay}
            className={`p-2 rounded-full flex-shrink-0 transition-all active:scale-95 shadow-sm ${btnClass}`}
            title={isPlaying ? "Pausar" : "Ouvir áudio"}
            >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
        )}

        <div className="flex-1 flex flex-col justify-center gap-1 cursor-pointer min-w-[100px]" onClick={toggleExpand}>
             {!isExpanded && (
                 <>
                    <div className={`h-1.5 w-full ${barBg} rounded-full overflow-hidden`}>
                        <div className={`h-full ${barFill} transition-all duration-300 ${isPlaying ? 'w-full opacity-100 animate-pulse' : 'w-0 opacity-50'}`}></div>
                    </div>
                    <div className="flex justify-between items-center px-0.5">
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${textColor}`}>Áudio</span>
                        {isPlaying && <span className={`text-[10px] ${textColor} animate-pulse`}>Reproduzindo...</span>}
                    </div>
                 </>
             )}
             {isExpanded && <span className={`text-xs font-medium px-1 ${textColor}`}>Reprodutor de Áudio</span>}
        </div>

        <button
            onClick={toggleExpand}
            className={`p-1.5 rounded-full transition-colors ${chevronColor}`}
            title={isExpanded ? "Recolher" : "Expandir"}
        >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded Native Player */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[60px] opacity-100 px-2 pb-2' : 'max-h-0 opacity-0'}`}>
        <audio ref={audioRef} controls className="w-full h-8 block rounded-lg">
          <source src={src} type={message.mimeType || 'audio/webm'} />
          Seu navegador não suporta áudio.
        </audio>
      </div>
    </div>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, theme, isGenerating }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const colors = theme.colors;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          isUser ? `${colors.primary} text-white` : 'bg-amber-100 text-amber-600'
        }`}>
          {isUser ? <User size={16} /> : <Sparkles size={16} />}
        </div>

        {/* Bubble */}
        <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed overflow-hidden transition-all ${
          isGenerating ? 'animate-subtle-pulse' : ''
        } ${
          isError 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : isUser 
              ? `${colors.bubbleUser} ${colors.bubbleUserText} rounded-tr-sm` 
              : `${colors.bubbleModel} border ${colors.border} ${colors.bubbleModelText} rounded-tl-sm`
        }`}>
          {isError && (
             <div className="flex items-center gap-2 mb-1 font-bold text-xs uppercase tracking-wide">
                <AlertCircle size={12} /> Erro
             </div>
          )}
          
          {/* Audio Player Component */}
          {message.audio && (
            <AudioPlayer message={message} isUser={isUser} themeColors={colors} />
          )}

          <div className={`markdown-content ${isUser ? colors.bubbleUserText : colors.bubbleModelText}`}>
            <ReactMarkdown
              components={{
                strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
          <span className={`text-[10px] block mt-2 opacity-70 ${isUser ? 'text-white' : colors.textMuted}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

      </div>
    </div>
  );
};

export default ChatMessage;