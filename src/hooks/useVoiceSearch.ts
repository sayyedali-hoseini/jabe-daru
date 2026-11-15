import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResult>;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function useVoiceSearch(
  onResult: (transcript: string) => void,
  onError?: (msg: string) => void
) {
  const [isListening, setIsListening] = useState(false);
  const isSupported = Boolean(getSpeechCtor());
  const recRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        // ignore cleanup error
      }
    };
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechCtor();
    if (!Ctor) {
      onError?.('جستجوی صوتی در این مرورگر پشتیبانی نمی‌شود');
      return;
    }

    if (isListening) {
      stop();
      return;
    }

    try {
      const rec = new Ctor();
      rec.lang = 'fa-IR';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => setIsListening(true);
      rec.onresult = (event) => {
        const text = event.results?.[0]?.[0]?.transcript?.trim();
        if (text) {
          onResult(text);
        }
        setIsListening(false);
      };
      rec.onerror = (err) => {
        setIsListening(false);
        if (err?.error === 'not-allowed') {
          onError?.('دسترسی به میکروفون داده نشد');
        } else if (err?.error !== 'aborted') {
          onError?.('صدایی تشخیص داده نشد؛ لطفاً دوباره تلاش کنید');
        }
      };
      rec.onend = () => setIsListening(false);

      recRef.current = rec;
      rec.start();
    } catch {
      setIsListening(false);
      onError?.('امکان فعال‌سازی میکروفون وجود ندارد');
    }
  }, [isListening, onError, onResult, stop]);

  return { isSupported, isListening, start, stop };
}
