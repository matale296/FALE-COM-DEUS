import React from 'react';
import { Message, Theme } from '../types';
import { User, Sparkles, AlertCircle, Play, Pause } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
  theme: Theme;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, theme }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const colors = theme.colors;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          isUser ? `${colors.primary} text-white` : 'bg-amber-100 text-amber-600'
        }`}>
          {isUser ? <User size={16} /> : <Sparkles size={16} />}
        </div>

        {/* Bubble */}
        <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed overflow-hidden ${
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
          
          {/* Audio Player */}
          {message.audio && (
            <div className="mb-2">
              <audio controls className="w-full h-8 max-w-[240px]">
                <source src={`data:${message.mimeType || 'audio/webm'};base64,${message.audio}`} type={message.mimeType || 'audio/webm'} />
                Seu navegador não suporta áudio.
              </audio>
            </div>
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