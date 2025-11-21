import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const VoiceSaathiAI = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis;

    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN'; // Indian English, supports Hindi-English mix

      recognitionRef.current.onstart = () => {
        console.log("Voice recognition started");
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);

        if (event.results[current].isFinal) {
          handleVoiceInput(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          toast({
            title: "No speech detected",
            description: "Please try speaking again",
            variant: "destructive",
          });
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support voice recognition",
        variant: "destructive",
      });
    }

    // Greeting on mount
    setTimeout(() => {
      speak("Namaste! I am Saathi AI, your agricultural voice assistant. How can I help you today?");
    }, 500);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = (text: string) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find an Indian English voice
    const voices = synthRef.current.getVoices();
    const indianVoice = voices.find(voice => 
      voice.lang.includes('en-IN') || voice.lang.includes('hi-IN')
    );
    const englishVoice = voices.find(voice => voice.lang.includes('en'));
    
    utterance.voice = indianVoice || englishVoice || voices[0];
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
    };

    synthRef.current.speak(utterance);
  };

  const handleVoiceInput = async (userMessage: string) => {
    setTranscript("");
    setIsProcessing(true);

    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);

    try {
      const { data, error } = await supabase.functions.invoke("saathi-ai", {
        body: { message: userMessage, conversationHistory: messages },
      });

      if (error) throw error;

      const assistantMessage = { role: "assistant" as const, content: data.response };
      setMessages([...newMessages, assistantMessage]);

      // Speak the response
      speak(data.response);

    } catch (error: any) {
      console.error("Saathi AI error:", error);
      const errorMessage = "I apologize, but I encountered an error. Please try again.";
      speak(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get response from Saathi AI",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support voice recognition",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Stop any ongoing speech before listening
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setTranscript("");
      recognitionRef.current.start();
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Card className="p-6 bg-card shadow-2xl border-2 border-primary/20 min-w-[300px]">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <h3 className="font-bold text-lg flex items-center gap-2 justify-center">
              <Volume2 className="w-5 h-5 text-primary" />
              Saathi AI Voice
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Your agriculture voice assistant
            </p>
          </div>

          {/* Status Display */}
          <div className="w-full min-h-[60px] bg-muted/50 rounded-lg p-3 text-center">
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            ) : isListening ? (
              <div className="space-y-2">
                <div className="flex justify-center gap-1">
                  <div className="w-1 h-8 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-10 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-6 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  <div className="w-1 h-12 bg-primary rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                </div>
                <p className="text-sm font-medium text-primary">
                  {transcript || "Listening..."}
                </p>
              </div>
            ) : isSpeaking ? (
              <div className="space-y-2">
                <div className="flex justify-center gap-1">
                  <div className="w-1 h-8 bg-green-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-10 bg-green-600 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                  <div className="w-1 h-6 bg-green-600 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                </div>
                <p className="text-sm text-green-600">Speaking...</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tap microphone to speak
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <Button
              size="lg"
              variant={isListening ? "destructive" : "default"}
              className="rounded-full h-16 w-16"
              onClick={toggleListening}
              disabled={isProcessing || isSpeaking}
            >
              {isListening ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>

            {isSpeaking && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full h-16 w-16"
                onClick={stopSpeaking}
              >
                <Volume2 className="w-6 h-6" />
              </Button>
            )}
          </div>

          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>🎤 Ask about weather, schemes, crops</p>
            <p>🌾 Available in Hindi & English</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
