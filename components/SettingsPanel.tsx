import React from 'react';
import { VoiceName, StudyConfig } from '../types';
import { SpeakerWaveIcon, BoltIcon } from '@heroicons/react/24/outline';

interface SettingsPanelProps {
  config: StudyConfig;
  setConfig: React.Dispatch<React.SetStateAction<StudyConfig>>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, setConfig }) => {
  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConfig((prev) => ({ ...prev, voice: e.target.value as VoiceName }));
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig((prev) => ({ ...prev, speed: parseFloat(e.target.value) }));
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
      {/* Voice Selector */}
      <div className="flex-1">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
          <SpeakerWaveIcon className="w-4 h-4" />
          Voice Persona
        </label>
        <div className="relative">
          <select
            value={config.voice}
            onChange={handleVoiceChange}
            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 pr-8"
          >
            {Object.values(VoiceName).map((voice) => (
              <option key={voice} value={voice}>
                {voice}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      {/* Speed Slider */}
      <div className="flex-1">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
          <BoltIcon className="w-4 h-4" />
          Reading Pace: <span className="text-indigo-600 font-bold">{config.speed}x</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={config.speed}
          onChange={handleSpeedChange}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Slow</span>
          <span>Fast</span>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
