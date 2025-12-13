import React from 'react';
import { Quote } from 'lucide-react';
import { Theme } from '../types';

interface DailyReflectionProps {
  text: string;
  isLoading: boolean;
  theme: Theme;
}

const DailyReflection: React.FC<DailyReflectionProps> = ({ text, isLoading, theme }) => {
  const colors = theme.colors;

  return (
    <div className={`bg-gradient-to-br ${colors.reflectionCardFrom} ${colors.reflectionCardTo} p-6 rounded-2xl border ${colors.reflectionCardBorder} relative overflow-hidden shadow-sm`}>
      <Quote className={`absolute top-4 left-4 opacity-50 transform -scale-x-100 ${colors.reflectionIcon}`} size={48} />
      
      <div className="relative z-10">
        <h3 className={`font-serif font-bold mb-2 ${colors.reflectionText}`}>Reflexão do Momento</h3>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className={`h-4 rounded w-3/4 bg-current opacity-20 ${colors.reflectionText}`}></div>
            <div className={`h-4 rounded w-1/2 bg-current opacity-20 ${colors.reflectionText}`}></div>
          </div>
        ) : (
          <p className={`text-sm italic leading-relaxed font-serif ${colors.reflectionText} opacity-90`}>
            "{text}"
          </p>
        )}
      </div>
    </div>
  );
};

export default DailyReflection;