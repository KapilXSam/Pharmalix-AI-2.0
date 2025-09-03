import { useState, useEffect, useRef, useCallback } from 'react';

// These interfaces describe the shape of the experimental SpeechRecognition API.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onstart: () => void;
  onend: () => void;
}

interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}


// Explicitly type the SpeechRecognition API to handle vendor prefixes
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

interface VoiceRecognitionOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}

export const useVoiceRecognition = ({ onStart, onEnd, onResult, onError }: VoiceRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const hasSupport = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!hasSupport) {
      onError?.("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true; // Keep listening even after a pause
    recognition.interimResults = false; // We only care about the final result of a phrase
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      onStart?.();
    };
    
    recognition.onend = () => {
      setIsListening(false);
      onEnd?.();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onError?.(event.error);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResult(finalTranscript + ' '); // Add a space for continuous dictation
      }
    };
    
    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.abort();
    };
  // The dependencies are functions from props, they should be stable.
  // If they are not wrapped in useCallback in the parent, this could re-run.
  // For this app's structure, this is acceptable.
  }, [hasSupport, onStart, onEnd, onResult, onError]);

  const toggleListening = useCallback(() => {
    if (recognitionRef.current) {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    }
  }, [isListening]);

  return { isListening, toggleListening, hasSupport };
};