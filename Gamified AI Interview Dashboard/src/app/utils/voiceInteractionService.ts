/**
 * Voice Interaction Service
 * Handles speech recognition and synthesis for AI mock interviews
 */

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  isFinal: boolean;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    SpeechSynthesisUtterance: any;
  }
}

export class VoiceInteractionService {
  private recognition: any = null;
  private isListening = false;
  private synthesis = window.speechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.language = 'en-US';
  }

  /**
   * Start listening for user speech
   */
  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void
  ): void {
    if (!this.recognition) {
      onError('Speech Recognition not supported in this browser');
      return;
    }

    try {
      this.isListening = true;

      this.recognition.onstart = () => {
        console.log('Speech recognition started');
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const transcript = finalTranscript || interimTranscript;
        onResult(transcript, event.results[event.results.length - 1].isFinal);
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          onError(`Error: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        console.log('Speech recognition ended');
        this.isListening = false;
      };

      this.recognition.start();
    } catch (error) {
      onError(`Failed to start listening: ${error}`);
    }
  }

  /**
   * Stop listening for user speech
   */
  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }

  /**
   * Speak text using text-to-speech
   */
  public speak(
    text: string,
    onStart: () => void,
    onEnd: () => void,
    onError: (error: string) => void
  ): void {
    try {
      // Cancel any existing speech
      this.stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        onStart();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        onEnd();
      };

      utterance.onerror = (event: SpeechSynthesisEvent) => {
        onError(`Speech synthesis error: ${event.error}`);
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    } catch (error) {
      onError(`Failed to speak: ${error}`);
    }
  }

  /**
   * Stop speaking
   */
  public stopSpeaking(): void {
    try {
      this.synthesis.cancel();
      this.currentUtterance = null;
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  /**
   * Check if currently speaking
   */
  public isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  /**
   * Get available voices
   */
  public getVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  /**
   * Set voice for speech synthesis
   */
  public setVoice(voiceName: string): void {
    if (this.currentUtterance) {
      const voices = this.getVoices();
      const voice = voices.find((v) => v.name === voiceName);
      if (voice) {
        this.currentUtterance.voice = voice;
      }
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopListening();
    this.stopSpeaking();
  }
}

export default VoiceInteractionService;
