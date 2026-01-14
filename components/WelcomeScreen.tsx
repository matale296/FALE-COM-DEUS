import React from 'react';
import { Religion, ReligionConfig, Theme } from '../types';
import { RELIGIONS } from '../constants';
import * as LucideIcons from 'lucide-react';
import { Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onSelect: (religion: Religion) => void;
  theme: Theme;
  initialSelected?: Religion;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelect, theme, initialSelected }) => {
  const colors = theme.colors;

  return (
    <div className={`h-screen w-full overflow-y-auto custom-scrollbar flex flex-col items-center p-4 ${colors.bgApp} transition-colors duration-500`}>
      {/* my-auto ensures vertical centering when space permits, but allows scrolling when content overflows */}
      <div className="max-w-7xl w-full flex flex-col items-center my-auto animate-fade-in-up py-4">
        
        {/* Header - Compact */}
        <div className="text-center mb-6 space-y-2 flex-shrink-0">
          <div className={`inline-flex items-center justify-center p-2 rounded-full ${colors.primary} text-white shadow-md mb-1`}>
             <Sparkles size={20} />
          </div>
          <h1 className={`text-2xl md:text-3xl font-serif font-bold ${colors.textMain}`}>Fale com Deus</h1>
          <p className={`text-sm md:text-base max-w-xl mx-auto ${colors.textSecondary} font-light leading-relaxed`}>
            Escolha seu caminho espiritual para iniciar o diálogo.
          </p>
        </div>

        {/* Grid - Responsive for 12 items: 2 cols (mobile), 3 cols (small tablet), 4 cols (tablet), 6 cols (desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 w-full mb-6">
          {RELIGIONS.map((rel: ReligionConfig) => {
            const IconComponent = (LucideIcons as any)[rel.icon] || LucideIcons.HelpCircle;
            const isPreferred = rel.id === initialSelected;

            return (
              <button
                key={rel.id}
                onClick={() => onSelect(rel.id)}
                className={`
                  group relative flex flex-col items-start p-3 rounded-xl border transition-all duration-200 h-full text-left
                  ${colors.bgSidebar} ${colors.border} hover:shadow-lg hover:-translate-y-0.5
                  ${isPreferred ? `ring-2 ring-offset-1 ${theme.id === 'nocturnal' ? 'ring-violet-500' : 'ring-indigo-400'}` : ''}
                `}
              >
                <div className={`p-2 rounded-lg mb-2 ${rel.color} bg-opacity-15 group-hover:bg-opacity-25 transition-colors`}>
                  <IconComponent size={18} />
                </div>
                <h3 className={`font-serif font-bold text-xs md:text-sm mb-1 leading-tight ${colors.textMain}`}>
                  {rel.name}
                </h3>
                <p className={`text-[10px] md:text-xs ${colors.textMuted} leading-tight line-clamp-2`}>
                  {rel.description}
                </p>
              </button>
            );
          })}
        </div>

        <p className={`text-[10px] ${colors.textMuted} text-center opacity-70 flex-shrink-0`}>
          O amor é universal.
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;