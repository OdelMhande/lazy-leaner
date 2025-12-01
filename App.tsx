import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PaperAirplaneIcon, 
  AdjustmentsHorizontalIcon, 
  SparklesIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { StudyConfig, VoiceName, UserGoals, Message, MessageRole, AudioState } from './types';
import GoalPanel from './components/GoalPanel';
import ChatMessage from './components/ChatMessage';
import { generateResponse, generateSpeechFromText } from './services/geminiService';
import { decodePCMData, getAudioContext } from './utils/audioUtils';

const App: React.FC = () => {
  // --- State ---
  
  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState<StudyConfig>({
    voice: VoiceName.Puck,
    speed: 1.0,
    autoPlay: true,
  });
  const [goals, setGoals] = useState<UserGoals>({
    objectives: '',
    knowledgeBase: '',
  });

  // Chat Data
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Audio Playback State
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentMessageId: null,
    currentTime: 0,
    duration: 0,
  });

  // Generating Audio State (to show spinner on specific buttons)
  const [generatingAudioForId, setGeneratingAudioForId] = useState<string | null>(null);

  // --- Refs ---
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const startOffsetRef = useRef<number>(0);

  // --- Effects ---

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle speed change dynamically
  useEffect(() => {
    if (audioSourceRef.current && audioState.isPlaying) {
      // For simplicity in this complex state, we just restart playback at current time
      playAudio(audioState.currentMessageId!, audioState.currentTime);
    }
  }, [config.speed]);

  // Audio Progress Loop
  useEffect(() => {
    let rafId: number;
    const updateProgress = () => {
      if (audioState.isPlaying && audioContextRef.current && audioState.duration > 0) {
        const ctx = audioContextRef.current;
        const elapsed = (ctx.currentTime - startTimeRef.current) * config.speed;
        const current = startOffsetRef.current + elapsed;
        
        if (current >= audioState.duration) {
          stopAudio();
          // Reset progress for that message
          setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
        } else {
          setAudioState(prev => ({ ...prev, currentTime: current }));
          rafId = requestAnimationFrame(updateProgress);
        }
      }
    };

    if (audioState.isPlaying) {
      rafId = requestAnimationFrame(updateProgress);
    }
    return () => cancelAnimationFrame(rafId);
  }, [audioState.isPlaying, config.speed, audioState.duration]);


  // --- Logic ---

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e) {}
      audioSourceRef.current = null;
    }
    setAudioState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const playAudio = useCallback((messageId: string, offset: number = 0) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.audioData) return;

    // Stop current if any
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e) {}
    }

    const ctx = getAudioContext();
    audioContextRef.current = ctx;
    const source = ctx.createBufferSource();
    source.buffer = message.audioData.buffer;
    source.playbackRate.value = config.speed;
    source.connect(ctx.destination);

    const safeOffset = Math.min(offset, message.audioData.duration);
    source.start(0, safeOffset);

    // Update Refs
    audioSourceRef.current = source;
    startTimeRef.current = ctx.currentTime;
    startOffsetRef.current = safeOffset;

    setAudioState({
      isPlaying: true,
      currentMessageId: messageId,
      currentTime: safeOffset,
      duration: message.audioData.duration
    });

    source.onended = () => {
       // Handled by requestAnimationFrame loop mostly, but cleanup here just in case
    };
  }, [messages, config.speed]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: inputText,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    // 2. Add Placeholder Assistant Message
    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: botMsgId,
      role: MessageRole.ASSISTANT,
      content: '',
      timestamp: Date.now(),
      isTyping: true
    }]);

    try {
      // 3. Generate Text Response
      const textResponse = await generateResponse(userMsg.content, goals);
      
      // Update bot message with text
      setMessages(prev => prev.map(m => 
        m.id === botMsgId 
          ? { ...m, content: textResponse, isTyping: false } 
          : m
      ));

      // 4. Generate Audio (if autoplay or just pre-fetch)
      // We always pre-fetch audio for the chatbot experience to be smooth, 
      // or at least fetch it now.
      setGeneratingAudioForId(botMsgId);
      const base64Audio = await generateSpeechFromText(textResponse, config.voice);
      const ctx = getAudioContext();
      const buffer = await decodePCMData(base64Audio, ctx);
      
      setMessages(prev => prev.map(m => 
        m.id === botMsgId 
          ? { ...m, audioData: { buffer, duration: buffer.duration } } 
          : m
      ));

      setGeneratingAudioForId(null);

      // 5. Autoplay if enabled
      if (config.autoPlay) {
         // Need to find the message again or just use the buffer we just created
         // Using setTimeout to ensure state update has processed if relying on state
         // But playAudio relies on 'messages' state finding the ID.
         // Let's call playAudio after a tick.
         setTimeout(() => playAudio(botMsgId, 0), 100);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(m => 
        m.id === botMsgId 
          ? { ...m, content: "Sorry, I encountered an error processing your request.", isTyping: false } 
          : m
      ));
    } finally {
      setIsProcessing(false);
      setGeneratingAudioForId(null);
    }
  };

  const handleManualRead = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    if (message.audioData) {
      playAudio(messageId, 0);
      return;
    }

    // If no audio exists, generate it
    setGeneratingAudioForId(messageId);
    try {
      const base64Audio = await generateSpeechFromText(message.content, config.voice);
      const ctx = getAudioContext();
      const buffer = await decodePCMData(base64Audio, ctx);

      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, audioData: { buffer, duration: buffer.duration } } 
          : m
      ));

      setTimeout(() => playAudio(messageId, 0), 100);
    } catch (e) {
      console.error(e);
      alert("Failed to generate audio.");
    } finally {
      setGeneratingAudioForId(null);
    }
  };

  const clearChat = () => {
    stopAudio();
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden relative font-sans">
      <GoalPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        goals={goals} 
        setGoals={setGoals}
        config={config}
        setConfig={setConfig}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-white shadow-2xl md:my-4 md:rounded-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-100 p-4 flex justify-between items-center z-10 sticky top-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">Gemini Tutor</h1>
              <p className="text-xs text-slate-500 font-medium">AI Study Companion</p>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button 
              onClick={clearChat}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear Chat"
            >
              <TrashIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Settings & Goals"
            >
              <AdjustmentsHorizontalIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 bg-slate-50/50 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
              <SparklesIcon className="w-16 h-16 text-indigo-300 mb-4" />
              <h2 className="text-xl font-bold text-slate-700 mb-2">Ready to learn?</h2>
              <p className="text-slate-500 max-w-sm">
                Ask me about a topic, paste text you want me to read, or set your learning goals in the settings.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isPlaying={audioState.isPlaying && audioState.currentMessageId === msg.id}
                currentProgress={
                  audioState.currentMessageId === msg.id && audioState.duration > 0
                  ? audioState.currentTime / audioState.duration
                  : 0
                }
                onPlay={() => handleManualRead(msg.id)}
                onStop={stopAudio}
                isGeneratingAudio={generatingAudioForId === msg.id}
              />
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 border-t border-slate-100">
          <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask a question or paste text to read..."
              className="w-full max-h-40 min-h-[56px] py-3.5 pl-4 pr-12 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none outline-none shadow-sm"
              style={{ height: '56px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isProcessing || !inputText.trim()}
              className={`absolute right-2 bottom-2 p-2 rounded-xl text-white transition-all duration-200 ${
                isProcessing || !inputText.trim()
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg'
              }`}
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="text-center mt-2">
             <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Gemini 2.5 Flash</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
