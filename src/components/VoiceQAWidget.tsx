import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Landmark, UserPosition, GuidePersona, RealTimeWeather } from '../types/tour';
import { audioNarrator } from '../utils/audioNarrator';
import {
  Mic,
  MicOff,
  Send,
  MessageSquare,
  Volume2,
  Sparkles,
  X,
  MapPin,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Bot,
  CloudSun,
  Wind,
} from 'lucide-react';

interface VoiceQAWidgetProps {
  userLocation: UserPosition;
  cityName: string;
  landmarks: Landmark[];
  persona: GuidePersona;
  onTeleportToLandmark?: (landmark: Landmark) => void;
  hasActiveNarration?: boolean;
  isDark?: boolean;
  initialWeather?: RealTimeWeather | null;
}

export const VoiceQAWidget: React.FC<VoiceQAWidgetProps> = ({
  userLocation,
  cityName,
  landmarks,
  persona,
  onTeleportToLandmark,
  hasActiveNarration = false,
  isDark = true,
  initialWeather = null,
}) => {
  // Whether the AI chat bubble is expanded into full chat window or shrunk to bubble
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [weather, setWeather] = useState<RealTimeWeather | null>(initialWeather);
  const [qaHistory, setQaHistory] = useState<
    Array<{
      question: string;
      answer: string;
      suggestedNextStop?: string;
    }>
  >([]);

  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const lastFetchedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Fetch real-time weather whenever location coordinates update
  const fetchWeather = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/tour/weather?lat=${lat}&lng=${lng}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && typeof data.temperatureC === 'number') {
        setWeather(data);
      }
    } catch (err) {
      console.warn('Could not fetch real-time weather for VoiceQAWidget:', err);
    }
  }, []);

  useEffect(() => {
    // Only fetch if coordinates have changed by > 0.01 degrees (~1 km) or initial load
    const prev = lastFetchedCoordsRef.current;
    if (
      !prev ||
      Math.abs(prev.lat - userLocation.lat) > 0.01 ||
      Math.abs(prev.lng - userLocation.lng) > 0.01
    ) {
      lastFetchedCoordsRef.current = { lat: userLocation.lat, lng: userLocation.lng };
      fetchWeather(userLocation.lat, userLocation.lng);
    }
  }, [userLocation.lat, userLocation.lng, fetchWeather]);

  // Sync if initialWeather prop is provided/updated
  useEffect(() => {
    if (initialWeather) {
      setWeather(initialWeather);
    }
  }, [initialWeather]);

  // Initialize SpeechRecognition if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInputText(transcript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Auto-scroll chat history when answers arrive
  useEffect(() => {
    if (isExpanded) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [qaHistory, isLoading, isExpanded]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type your question!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setInputText('');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    }
  };

  const handleAskQuestion = async (queryText?: string) => {
    const questionToAsk = (queryText || inputText).trim();
    if (!questionToAsk) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsLoading(true);
    setInputText('');

    try {
      const nearbyList = landmarks.slice(0, 5).map((l) => ({
        name: l.name,
        category: l.category,
      }));

      const res = await fetch('/api/tour/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionToAsk,
          lat: userLocation.lat,
          lng: userLocation.lng,
          city: cityName,
          nearbyLandmarks: nearbyList,
          persona,
        }),
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      setQaHistory((prev) => [
        ...prev,
        {
          question: questionToAsk,
          answer: data.answer,
          suggestedNextStop: data.suggestedNextStop,
        },
      ]);

      // Update weather if returned by ask service
      if (data.weather) {
        setWeather(data.weather);
      }

      // Speak answer aloud
      if (data.answer) {
        audioNarrator.speak(data.answer);
      }
    } catch (err) {
      console.error('Failed to ask question:', err);
      setQaHistory((prev) => [
        ...prev,
        {
          question: questionToAsk,
          answer: `I am currently discovering details for ${cityName}! Feel free to ask about nearby monuments, architecture styles, or local stories.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPersonaInfo = (p: GuidePersona) => {
    switch (p) {
      case 'insider':
        return { name: 'Mia', role: 'Local Insider', icon: '🍷' };
      case 'storyteller':
        return { name: 'Elena', role: 'Legend Storyteller', icon: '🎭' };
      case 'adventurer':
        return { name: 'Sam', role: 'City Explorer', icon: '🎒' };
      case 'historian':
      default:
        return { name: 'Lord Reginald', role: 'Master Historian', icon: '🏛️' };
    }
  };

  const personaDetails = getPersonaInfo(persona);

  // Position class: Always above footer bar, just below the map
  const containerPositionClass = hasActiveNarration
    ? 'bottom-[138px] md:bottom-4 right-3 md:right-6'
    : 'bottom-3 md:bottom-4 right-3 md:right-6';

  return (
    <div
      className={`fixed ${containerPositionClass} z-40 transition-all duration-300 ease-out flex flex-col items-end pointer-events-auto`}
    >
      {/* EXPANDED STATE: Full Conversational AI Chat Window */}
      {isExpanded ? (
        <div
          className={`w-[92vw] sm:w-[420px] max-h-[530px] h-[510px] glass-panel rounded-3xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 ${
            isDark ? 'border-slate-700/80 bg-slate-950/95' : 'border-slate-300/90 bg-white/95'
          }`}
        >
          {/* Chat Window Header */}
          <div className="flex items-center justify-between p-3 md:p-3.5 border-b border-slate-800/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow">
                <span className="text-base">{personaDetails.icon}</span>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs md:text-sm font-bold text-white">AI Tour Guide Chat</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                    {personaDetails.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>Answering questions for {cityName}</span>
                </p>
              </div>
            </div>

            {/* Shrink / Close Button */}
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-1 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Shrink to bubble"
            >
              <Minimize2 className="w-4 h-4" />
              <span className="text-[11px] font-semibold hidden sm:inline">Shrink</span>
            </button>
          </div>

          {/* Real-time Weather Banner */}
          {weather && (
            <div className="px-3.5 py-2 bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-transparent border-b border-slate-800/60 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg animate-pulse">{weather.icon}</span>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-100 text-xs">
                    <span className="text-amber-300 font-extrabold">{weather.temperatureC}°C</span>
                    <span className="opacity-75 font-normal">({weather.temperatureF}°F)</span>
                    <span className="text-amber-400">•</span>
                    <span className="text-slate-200">{weather.condition}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Live at {cityName} • Wind {weather.windSpeedKmH} km/h
                  </p>
                </div>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Live Weather
              </span>
            </div>
          )}

          {/* Chat Message Scrollable Stream */}
          <div className="flex-1 overflow-y-auto space-y-3.5 p-3.5 md:p-4 pr-2">
            {qaHistory.length === 0 ? (
              <div className="text-center py-5 text-slate-400">
                <div className="w-11 h-11 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl mb-2">
                  {personaDetails.icon}
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Ask me anything about {cityName}!
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {weather ? (
                    <span>It is currently {weather.temperatureC}°C and {weather.condition.toLowerCase()} outside. Ask for sightseeing tips, stories, or cozy cafes!</span>
                  ) : (
                    <span>Ask by voice or text. I know the history, architecture, legends, and great coffee spots around here.</span>
                  )}
                </p>

                {/* Quick prompt suggestions */}
                <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
                  {[
                    'What is special about this spot?',
                    'Who designed this architecture?',
                    'Any hidden legends here?',
                    'Great espresso or gelato nearby?',
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleAskQuestion(q)}
                      className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700/80 transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              qaHistory.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  {/* User Question */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-br-none bg-indigo-600 text-white text-xs md:text-sm font-medium shadow">
                      {item.question}
                    </div>
                  </div>

                  {/* AI Answer */}
                  <div className="flex justify-start">
                    <div className="max-w-[92%] p-3.5 rounded-2xl rounded-bl-none bg-slate-900/90 border border-slate-800 text-slate-200 text-xs md:text-sm shadow-md">
                      <div className="flex items-center justify-between gap-2 mb-1.5 text-amber-400 font-bold text-xs">
                        <span className="flex items-center gap-1.5">
                          <span>{personaDetails.icon}</span>
                          <span>{personaDetails.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => audioNarrator.speak(item.answer)}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-semibold transition-colors cursor-pointer"
                          title="Listen to answer again"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Listen</span>
                        </button>
                      </div>
                      <p className="leading-relaxed">{item.answer}</p>

                      {/* Suggested next stop if available */}
                      {item.suggestedNextStop && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-300">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate">Next stop: {item.suggestedNextStop}</span>
                          </span>
                          {onTeleportToLandmark && (
                            <button
                              type="button"
                              onClick={() => {
                                const target = landmarks.find(
                                  (l) => l.name === item.suggestedNextStop
                                );
                                if (target) {
                                  onTeleportToLandmark(target);
                                  setIsExpanded(false);
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 font-semibold cursor-pointer shrink-0 ml-2"
                            >
                              Walk There
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-indigo-400 text-xs p-3 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                <span>{personaDetails.name} is gathering local insights...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Interactive Input Dock */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg ring-2 ring-red-400'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
                }`}
                title={isListening ? 'Stop recording voice' : 'Ask using your voice'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskQuestion();
                }}
                placeholder={
                  isListening
                    ? 'Listening to your voice...'
                    : `Ask ${personaDetails.name} anything about ${cityName}...`
                }
                className={`flex-1 px-3.5 py-2 rounded-xl text-xs md:text-sm outline-none transition-colors border ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500'
                }`}
              />

              <button
                type="button"
                onClick={() => handleAskQuestion()}
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow transition-colors cursor-pointer"
                title="Send question"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SHRUNK STATE: Always-Visible Bubble anchored right below the map */
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className={`group flex items-center gap-2 px-3 py-2 md:px-3.5 md:py-2.5 rounded-full glass-panel shadow-2xl border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
            isDark
              ? 'border-indigo-500/40 bg-slate-900/90 text-white hover:border-indigo-400 shadow-indigo-950/50'
              : 'border-indigo-300/80 bg-white/95 text-slate-900 hover:border-indigo-400 shadow-slate-300/60'
          }`}
          title="Open AI Tour Guide Chat"
        >
          {/* Animated Glowing AI Icon with Persona Avatar */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 text-white shadow-md shrink-0">
            <span className="text-sm">{personaDetails.icon}</span>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
          </div>

          {/* Bubble Text */}
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight">AI Tour Chat</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">
                {personaDetails.name}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors">
              Ask about sights in {cityName}
            </p>
          </div>

          {/* Live Temperature & Condition Badge right on the bubble */}
          {weather && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold shrink-0 ml-1"
              title={`Live weather: ${weather.formattedText}`}
            >
              <span className="text-xs">{weather.icon}</span>
              <span>{weather.temperatureC}°C</span>
              <span className="hidden sm:inline font-normal opacity-90">• {weather.condition}</span>
            </div>
          )}

          {/* Expand Chevron Icon */}
          <div className="p-1 rounded-full bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all ml-0.5">
            <ChevronUp className="w-3.5 h-3.5" />
          </div>
        </button>
      )}
    </div>
  );
};
