import React from 'react';
import { Religion, ReligionConfig, Theme } from '../types';
import { RELIGIONS } from '../constants';
import * as LucideIcons from 'lucide-react';

interface ReligionSelectorProps {
  selected: Religion;
  onSelect: (religion: Religion) => void;
  theme: Theme;
}

const ReligionSelector: React.FC<ReligionSelectorProps> = ({ selected, onSelect, theme }) => {
  const colors = theme.colors;

  return (
    <div className="space-y-3">
      <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${colors.textMuted}`}>Escolha sua Conexão</h3>
      <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {RELIGIONS.map((rel: ReligionConfig) => {
           // Dynamic Icon rendering
           const IconComponent = (LucideIcons as any)[rel.icon] || LucideIcons.HelpCircle;

           return (
            <button
              key={rel.id}
              onClick={() => onSelect(rel.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                selected === rel.id
                  ? `${colors.selectionHighlight} shadow-sm ring-1`
                  : `${colors.bgApp} ${colors.border} hover:border-slate-300`
              }`}
            >
              <div className={`p-2 rounded-lg ${rel.color}`}>
                <IconComponent size={18} />
              </div>
              <div>
                <span className={`block font-semibold text-sm ${selected === rel.id ? colors.textMain : colors.textSecondary}`}>
                    {rel.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ReligionSelector;