// Audio narration manager wrapping Web Speech API & Web Audio API chime generator

export interface VoiceOption {
  name: string;
  lang: string;
  default: boolean;
}

class AudioNarratorService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioCtx: AudioContext | null = null;
  private onBoundaryCallback: ((charIndex: number, textLength: number) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onStartCallback: (() => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  // Play a gentle two-tone acoustic museum chime using Web Audio API
  public playArrivalChime(): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioContextClass();
      }

      const now = this.audioCtx.currentTime;
      
      // Tone 1: E5 (659.25 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.65);

      // Tone 2: B5 (987.77 Hz) slightly delayed
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.001, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.95);
    } catch (e) {
      console.warn('Could not play arrival chime:', e);
    }
  }

  public getAvailableVoices(): VoiceOption[] {
    if (!this.synth) return [];
    const voices = this.synth.getVoices();
    return voices.map(v => ({
      name: v.name,
      lang: v.lang,
      default: v.default,
    }));
  }

  public speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      voiceName?: string;
      language?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onBoundary?: (charIndex: number, textLength: number) => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      options.onError?.(new Error('SpeechSynthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = options.language || 'en';
    utterance.lang = targetLang;
    utterance.rate = Math.max(0.6, Math.min(1.8, options.rate ?? 1.0));
    utterance.pitch = Math.max(0.6, Math.min(1.4, options.pitch ?? 1.0));

    // Choose voice matching user preference and language
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      if (options.voiceName) {
        const found = voices.find(v => v.name === options.voiceName);
        if (found) utterance.voice = found;
      }
      if (!utterance.voice) {
        // Find natural voice matching target language
        const langVoice = voices.find(
          v =>
            v.lang.toLowerCase().startsWith(targetLang.toLowerCase()) &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Daniel') ||
              v.name.includes('Samantha') ||
              v.name.includes('Monica') ||
              v.name.includes('Thomas') ||
              v.name.includes('Alice'))
        ) || voices.find(v => v.lang.toLowerCase().startsWith(targetLang.toLowerCase()));

        if (langVoice) utterance.voice = langVoice;
      }
    }

    this.onStartCallback = options.onStart || null;
    this.onEndCallback = options.onEnd || null;
    this.onBoundaryCallback = options.onBoundary || null;
    this.onErrorCallback = options.onError || null;

    utterance.onstart = () => {
      this.onStartCallback?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      this.onEndCallback?.();
    };

    utterance.onerror = (event) => {
      // Don't report error if canceled by user
      if (event.error === 'canceled' || event.error === 'interrupted') return;
      console.warn('Speech error event:', event);
      this.onErrorCallback?.(event);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word' || event.name === 'sentence') {
        this.onBoundaryCallback?.(event.charIndex, event.charLength || 10);
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause(): void {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  public resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking && !this.synth.paused);
  }

  public isPaused(): boolean {
    return !!(this.synth && this.synth.paused);
  }
}

export const audioNarrator = new AudioNarratorService();
