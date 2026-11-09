import React, { useState } from 'react';
import { ActiveNarration, GuidePersona } from '../types/tour';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Sparkles,
  Eye,
  Lightbulb,
  Activity,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Compass,
} from 'lucide-react';

interface NarrationDockProps {
  narration: ActiveNarration | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentCharIndex: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReplay: () => void;
  onPersonaChange: (persona: GuidePersona) => void;
}

export const NarrationDock: React.FC<NarrationDockProps> = ({
  narration,
  isPlaying,
  isPaused,
  isLoading,
  currentCharIndex,
  onPlay,
  onPause,
  onResume,
  onStop,
  onReplay,
  onPersonaChange,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!narration && !isLoading) return null;

  const getPersonaDetails = (p: GuidePersona) => {
    switch (p) {
      case 'insider':
        return { name: 'Mia', title: 'Local Insider', icon: '🍷' };
      case 'storyteller':
        return { name: 'Elena', title: 'Legend Storyteller', icon: '🎭' };
      case 'adventurer':
        return { name: 'Sam', title: 'City Explorer', icon: '🎒' };
      case 'historian':
      default:
        return { name: 'Lord Reginald', title: 'Master Historian', icon: '🏛️' };
    }
  };

  const personaInfo = narration ? getPersonaDetails(narration.persona) : getPersonaDetails('historian');

  // Compute text highlighting for karaoke effect
  const renderHighlightedStory = () => {
    if (!narration?.story) return null;
    const text = narration.story;
    const spokenIndex = Math.min(currentCharIndex, text.length);

    const spokenPart = text.slice(0, spokenIndex);
    const remainingPart = text.slice(spokenIndex);

    return (
      <p className="text-sm md:text-base leading-relaxed text-slate-200">
        <span className="text-amber-300 font-medium transition-colors duration-150">
          {spokenPart}
        </span>
        <span className="text-slate-400 opacity-90">{remainingPart}</span>
      </p>
    );
  };

  return (
    <>
      {/* Sticky Bottom Dock */}
      <div className="fixed bottom-4 left-3 right-3 md:left-6 md:right-auto md:w-[480px] z-40 transition-all duration-300">
        <div className="glass-panel rounded-2xl shadow-2xl p-3.5 md:p-4 border border-slate-700/60 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center gap-3.5 py-1">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 animate-pulse">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase font-bold tracking-wider text-indigo-400">
                  AI Tour Guide Crafting Story...
                </p>
                <p className="text-sm font-semibold text-slate-200 truncate">
                  Analyzing architecture, era lore & local secrets
                </p>
              </div>
            </div>
          ) : narration ? (
            <div>
              {/* Landmark Header info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 text-white font-bold text-lg shadow-md shrink-0">
                    <span>{personaInfo.icon}</span>
                    {isPlaying && (
                      <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {personaInfo.title}
                      </span>
                      {narration.historicalEra && (
                        <span className="text-[10px] text-slate-400 truncate">
                          {narration.historicalEra}
                        </span>
                      )}
                      {narration.weather && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1 shrink-0"
                          title={`Live weather: ${narration.weather.formattedText}`}
                        >
                          <span>{narration.weather.icon}</span>
                          <span>{narration.weather.temperatureC}°C</span>
                          <span className="hidden sm:inline">({narration.weather.condition})</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-white truncate mt-0.5">
                      {narration.landmark.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                    title={expanded ? 'Collapse Details' : 'Expand Story & Tips'}
                  >
                    {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={onStop}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                    title="Close Audio"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Catchy snippet / subline */}
              {narration.highlightSnippet && !expanded && (
                <p className="mt-2 text-xs italic text-slate-300 line-clamp-1 border-l-2 border-amber-400/70 pl-2">
                  "{narration.highlightSnippet}"
                </p>
              )}

              {/* Equalizer animation when playing */}
              {isPlaying && (
                <div className="mt-2.5 flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="flex items-end gap-1 h-5">
                    <div className="w-1 bg-amber-400 rounded-full animate-wave-1" />
                    <div className="w-1 bg-indigo-400 rounded-full animate-wave-2" />
                    <div className="w-1 bg-sky-400 rounded-full animate-wave-3" />
                    <div className="w-1 bg-emerald-400 rounded-full animate-wave-4" />
                    <div className="w-1 bg-amber-400 rounded-full animate-wave-5" />
                    <div className="w-1 bg-rose-400 rounded-full animate-wave-2" />
                  </div>
                  <span className="text-[11px] font-mono text-amber-300/90 tracking-wide">
                    {personaInfo.name} is narrating...
                  </span>
                  <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                </div>
              )}

              {/* Audio Controls Bar */}
              <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  {isPlaying ? (
                    <button
                      type="button"
                      onClick={onPause}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow transition-colors cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </button>
                  ) : isPaused ? (
                    <button
                      type="button"
                      onClick={onResume}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onPlay}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Listen to Narration</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onReplay}
                    className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Replay from start"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Persona Switcher Buttons */}
                <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-xl border border-slate-800">
                  {(['historian', 'insider', 'storyteller', 'adventurer'] as GuidePersona[]).map((p) => {
                    const info = getPersonaDetails(p);
                    const isActive = narration.persona === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => onPersonaChange(p)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={info.title}
                      >
                        <span className="mr-0.5">{info.icon}</span>
                        <span className="hidden sm:inline">{info.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Expanded Story & Curiosities Modal / Drawer */}
      {expanded && narration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl max-h-[85vh] rounded-3xl p-5 md:p-7 shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/40 border border-indigo-500/50 flex items-center justify-center text-2xl">
                  {personaInfo.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {personaInfo.title}
                    </span>
                    <span className="text-xs text-slate-400">{narration.historicalEra}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold font-serif-title text-white mt-1">
                    {narration.landmark.name}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-5 py-5 pr-1">
              {/* Architectural Look Up Prompt */}
              {narration.suggestedLookAt && (
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
                  <Eye className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-indigo-300">
                      Look Up Right Now
                    </h4>
                    <p className="text-sm font-medium mt-0.5">{narration.suggestedLookAt}</p>
                  </div>
                </div>
              )}

              {/* Live Spoken Story with Karaoke highlight */}
              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>Audio Narration Transcript</span>
                </h4>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  {renderHighlightedStory()}
                </div>
              </div>

              {/* Secrets Grid: Fun Fact & Insider Tip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {narration.funFact && (
                  <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30">
                    <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                      <Sparkles className="w-4 h-4" />
                      <h4 className="text-xs uppercase font-bold tracking-wider">Surprising Trivia</h4>
                    </div>
                    <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                      {narration.funFact}
                    </p>
                  </div>
                )}

                {narration.insiderTip && (
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1.5">
                      <Lightbulb className="w-4 h-4" />
                      <h4 className="text-xs uppercase font-bold tracking-wider">Local Insider Tip</h4>
                    </div>
                    <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                      {narration.insiderTip}
                    </p>
                  </div>
                )}
              </div>

              {/* What's Happening Right Now */}
              {narration.nearbyActivity && (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30">
                  <div className="flex items-center gap-2 text-purple-400 mb-1.5">
                    <Activity className="w-4 h-4" />
                    <h4 className="text-xs uppercase font-bold tracking-wider">
                      Atmosphere & Activity Right Now
                    </h4>
                  </div>
                  <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                    {narration.nearbyActivity}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isPlaying ? (
                  <button
                    type="button"
                    onClick={onPause}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause Audio</span>
                  </button>
                ) : isPaused ? (
                  <button
                    type="button"
                    onClick={onResume}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Resume Audio</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPlay}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Replay Story</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onReplay}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Replay from beginning"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                Close Full Story
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
