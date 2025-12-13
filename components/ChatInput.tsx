import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Mic, Square, AudioLines, X } from 'lucide-react';
import { Theme } from '../types';

interface ChatInputProps {
  onSend: (text: string, audio?: { data: string; mimeType: string }) => void;
  isLoading: boolean;
  theme: Theme;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, theme, placeholder }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  const colors = theme.colors;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!text.trim() && !isRecording) || isLoading) return;
    onSend(text);
    setText('');
    resetHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
          const base64Data = base64String.split(',')[1];
          onSend("", { data: base64Data, mimeType: 'audio/webm' });
        };
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Stop but don't process
      mediaRecorderRef.current.onstop = null; // Remove handler
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative w-full max-w-3xl mx-auto flex items-end gap-2 p-2 rounded-3xl border shadow-lg transition-all duration-300 ${isRecording ? 'bg-red-50 border-red-200' : `${colors.inputBg} ${colors.border}`}`}>
      
      {isRecording ? (
        <div className="flex-1 flex items-center justify-between px-4 py-3 h-[50px]">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-3 h-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </div>
            <span className="text-red-600 font-mono font-medium">{formatTime(recordingTime)}</span>
            <span className="text-red-400 text-sm hidden sm:inline">Gravando mensagem...</span>
          </div>
          <button 
             onClick={cancelRecording}
             className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
             title="Cancelar"
          >
             <X size={20} />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 flex items-end">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Escreva ou grave sua mensagem..."}
            className={`w-full bg-transparent border-0 focus:ring-0 placeholder-slate-400 resize-none py-3 px-4 max-h-[120px] overflow-y-auto ${colors.inputText}`}
            rows={1}
            disabled={isLoading}
          />
        </form>
      )}

      {/* Action Button (Mic or Send or Stop) */}
      <div className="flex-shrink-0">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-md transform hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Square size={20} fill="currentColor" />
          </button>
        ) : text.trim() ? (
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading}
            className={`p-3 rounded-full flex-shrink-0 transition-all duration-200 ${
              isLoading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : `${colors.primary} text-white ${colors.primaryHover} shadow-md transform hover:scale-105 active:scale-95`
            }`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={isLoading}
            className={`p-3 rounded-full flex-shrink-0 transition-all duration-200 ${colors.textSecondary} hover:bg-slate-100`}
            title="Gravar áudio"
          >
            <Mic size={22} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;