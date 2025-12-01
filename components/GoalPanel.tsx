import React from 'react';
import { UserGoals, StudyConfig, VoiceName } from '../types';
import { Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface GoalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  goals: UserGoals;
  setGoals: React.Dispatch<React.SetStateAction<UserGoals>>;
  config: StudyConfig;
  setConfig: React.Dispatch<React.SetStateAction<StudyConfig>>;
}

const GoalPanel: React.FC<GoalPanelProps> = ({ 
  isOpen, onClose, goals, setGoals, config, setConfig 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm transition-all" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Cog6ToothIcon className="w-6 h-6 text-indigo-600" />
            Study Configuration
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Audio Settings Section */}
        <section className="mb-8">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 border-b pb-2">Audio Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Voice Persona</label>
              <select
                value={config.voice}
                onChange={(e) => setConfig({ ...config, voice: e.target.value as VoiceName })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {Object.values(VoiceName).map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reading Speed: <span className="text-indigo-600 font-bold">{config.speed}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={config.speed}
                onChange={(e) => setConfig({ ...config, speed: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0.5x</span>
                <span>2.0x</span>
              </div>
            </div>

             <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="autoplay"
                checked={config.autoPlay}
                onChange={(e) => setConfig({...config, autoPlay: e.target.checked})}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="autoplay" className="text-sm text-slate-700 select-none">Auto-play response audio</label>
            </div>
          </div>
        </section>

        {/* Knowledge Base Section */}
        <section>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 border-b pb-2">Knowledge Base & Goals</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Learning Objectives</label>
              <textarea
                value={goals.objectives}
                onChange={(e) => setGoals({ ...goals, objectives: e.target.value })}
                placeholder="E.g., I want to master the basics of organic chemistry..."
                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">These goals help tailor the AI's explanations.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Context / Background Info</label>
              <textarea
                value={goals.knowledgeBase}
                onChange={(e) => setGoals({ ...goals, knowledgeBase: e.target.value })}
                placeholder="E.g., I already know basic algebra, I am a visual learner..."
                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">Provide any context the AI should know about you or the topic.</p>
            </div>
          </div>
        </section>

        <div className="mt-8 pt-4 border-t border-slate-100">
           <button 
             onClick={onClose}
             className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-100"
           >
             Save & Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default GoalPanel;
