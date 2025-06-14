import { useState, useEffect, useCallback, useRef } from "react";
import { Card, StudySession, ReviewQuality } from "@/types/card";
import Link from "next/link";
import { Geist } from "next/font/google";
import { Button, Progress, message } from "antd";
import { IoVolumeHigh } from "react-icons/io5";
import { AiOutlineHome, AiOutlineSound } from "react-icons/ai";
import { getAudioPath } from "@/utils/audioUtils";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const qualityLabels = [
  { value: ReviewQuality.CompleteBlackout, label: "Complete Blackout", description: "I don't remember seeing this at all", color: "#dc2626", shortcut: "1" },
  { value: ReviewQuality.IncorrectButRecognized, label: "Incorrect (Recognized)", description: "Wrong answer, but I recognized it", color: "#ef4444", shortcut: "2" },
  { value: ReviewQuality.IncorrectButEasyRecall, label: "Incorrect (Easy Recall)", description: "Wrong, but I almost had it", color: "#f97316", shortcut: "3" },
  { value: ReviewQuality.CorrectWithDifficulty, label: "Correct (Difficult)", description: "I got it right, but with effort", color: "#eab308", shortcut: "4" },
  { value: ReviewQuality.CorrectWithSomeHesitation, label: "Correct (Hesitation)", description: "I recalled with slight hesitation", color: "#22c55e", shortcut: "5" },
  { value: ReviewQuality.PerfectRecall, label: "Perfect Recall", description: "I knew it instantly", color: "#059669", shortcut: "6" }
];

export default function Study() {
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);

  useEffect(() => {
    fetchStudySession();
  }, []);

  const fetchStudySession = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/study');
      if (!response.ok) {
        throw new Error('Failed to fetch study session');
      }
      const data = await response.json();
      
      if (data.cards.length === 0) {
        setError('No cards available for studying. Add some cards first!');
        setLoading(false);
        return;
      }
      
      setSession(data);
      setStats({ total: data.cards.length, correct: 0 });
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load study session');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentCard = useCallback((): Card | null => {
    if (!session || session.cards.length === 0) return null;
    return session.cards[session.currentCardIndex];
  }, [session]);

  const playAudio = useCallback(() => {
    const currentCard = getCurrentCard();
    const audioPath = getAudioPath(currentCard!);
    if (!audioPath) {
      return;
    }
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioPath);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onpause = () => setIsPlaying(false);
      audioRef.current.onplay = () => setIsPlaying(true);
    } else {
      audioRef.current.src = audioPath;
    }
    
    audioRef.current.play().catch(error => {
      console.error('Failed to play audio:', error);
    });
  }, [getCurrentCard]);

  const handleReveal = useCallback(() => {
    setShowAnswer(true);
    
    const card = getCurrentCard();
    const audioPath = getAudioPath(card!);
    if (audioPath && ((session?.mode === 'front-to-back') || (session?.mode === 'back-to-front'))) {
      playAudio();
    }
  }, [getCurrentCard, playAudio, session?.mode]);

  const handleAnswer = useCallback(async (quality: ReviewQuality) => {
    if (!session || !getCurrentCard()) return;
    
    const currentCard = getCurrentCard();
    const correct = quality >= ReviewQuality.CorrectWithDifficulty; // 3 or higher is considered correct
    
    try {
      // Record the review result with quality
      await fetch('/api/study/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: currentCard?.id,
          correct,
          quality,
          mode: session.mode
        }),
      });
      
      // Update stats
      if (correct) {
        setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      }
      
      // Move to next card or complete the session
      if (session.currentCardIndex < session.cards.length - 1) {
        setSession({
          ...session,
          currentCardIndex: session.currentCardIndex + 1,
          // Toggle mode for each card to ensure both front-to-back and back-to-front practice
          mode: session.mode === 'front-to-back' ? 'back-to-front' : 'front-to-back'
        });
        setShowAnswer(false);
      } else {
        setCompleted(true);
      }
    } catch (error) {
      console.error('Error recording review:', error);
      setError('Failed to record your answer');
    }
  }, [getCurrentCard, session]);

  const restart = () => {
    setCompleted(false);
    setShowAnswer(false);
    fetchStudySession();
  };

  const currentCard = getCurrentCard();
  const cardFront = session?.mode === 'front-to-back' 
    ? currentCard?.front 
    : currentCard?.back;
  const cardBack = session?.mode === 'front-to-back' 
    ? currentCard?.back 
    : currentCard?.front;

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!showAnswer) {
      // If space is pressed, show answer
      if (event.code === 'Space') {
        handleReveal();
      }
      return;
    }

    // Handle number keys for quality rating
    const key = event.key;
    if (/^[1-6]$/.test(key)) {
      const qualityOption = qualityLabels.find(option => option.shortcut === key);
      if (qualityOption) {
        handleAnswer(qualityOption.value);
      }
    }
  }, [showAnswer, handleAnswer, handleReveal]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const generateAudio = useCallback(async () => {
    const currentCard = getCurrentCard();
    if (!currentCard) {
      return;
    }
    
    try {
      setGeneratingAudio(true);
      
      const response = await fetch(`/api/cards/generate-audio/${currentCard.id}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }
      
      const data = await response.json();
      
      if (data.success && data.audioFileId) {
        const updatedCard = { 
          ...currentCard, 
          audioFileId: data.audioFileId
        };
        
        if (session) {
          const updatedCards = [...session.cards];
          updatedCards[session.currentCardIndex] = updatedCard;
          setSession({
            ...session,
            cards: updatedCards
          });
        }
        
        message.success('Audio generated successfully');
        
        const audioPath = `/api/audio/${data.audioFileId}`;
        if (audioRef.current) {
          audioRef.current.src = audioPath;
          audioRef.current.play()
            .catch(error => console.error('Failed to play audio:', error));
        } else {
          audioRef.current = new Audio(audioPath);
          audioRef.current.onended = () => setIsPlaying(false);
          audioRef.current.onpause = () => setIsPlaying(false);
          audioRef.current.onplay = () => setIsPlaying(true);
          audioRef.current.play()
            .catch(error => console.error('Failed to play audio:', error));
        }
      } else {
        throw new Error(data.error || 'Failed to generate audio');
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      message.error('Failed to generate audio');
    } finally {
      setGeneratingAudio(false);
    }
  }, [getCurrentCard, session]);

  useEffect(() => {
    // Reset audio when card changes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
      }
    };
  }, [session?.currentCardIndex]);

  if (loading) {
    return (
      <div className={`${geist.className} min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center justify-center`}>
        <p className="text-slate-600 text-base sm:text-base">Loading study session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${geist.className} min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col`}>
        <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md w-full">
          <h1 className="text-2xl md:text-2xl font-bold text-slate-800 mb-4">Error</h1>
          <p className="text-slate-600 text-base sm:text-base mb-6">{error}</p>
          <Link href="/">
            <Button type="primary" icon={<AiOutlineHome />}>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className={`${geist.className} min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col`}>
        <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md w-full">
          <h1 className="text-2xl md:text-2xl font-bold text-slate-800 mb-4">Study Completed!</h1>
          <p className="text-slate-600 mb-2">
            You've reviewed all {stats.total} cards.
          </p>
          <p className="text-slate-600 mb-6">
            Your score: {stats.correct} / {stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="primary"
              onClick={restart}
              style={{ backgroundColor: '#059669' }}
            >
              Study Again
            </Button>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${geist.className} min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col`}>
      <div className="max-w-lg mx-auto w-full flex flex-col flex-grow">
        <header className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Study Mode</h1>
            <p className="text-slate-600">
              Card {session?.currentCardIndex! + 1} of {session?.cards.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">
              Mode: {session?.mode === 'front-to-back' ? 'European Portuguese → English' : 'English → European Portuguese'}
            </p>
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              Exit
            </Link>
          </div>
        </header>

        <div className="bg-white p-6 rounded-lg shadow-md mb-4 flex-grow flex flex-col">
          <div className="flex flex-col items-center justify-center flex-grow">
            <div className="mb-8 text-center">
              <p className="text-slate-500 text-sm mb-2">
                {session?.mode === 'front-to-back' ? 'European Portuguese' : 'English'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-medium">{cardFront}</p>
                {(session?.mode === 'front-to-back' || showAnswer) && getCurrentCard()?.audioFileId ? (
                  <Button
                    type={isPlaying ? "primary" : "default"}
                    shape="circle"
                    icon={<IoVolumeHigh />}
                    onClick={playAudio}
                    aria-label="Play pronunciation"
                  />
                ) : (
                  <Button
                    type="default"
                    shape="circle"
                    icon={<AiOutlineSound />}
                    onClick={generateAudio}
                    loading={generatingAudio}
                    aria-label="Generate pronunciation"
                  />
                )}
              </div>
            </div>

            {showAnswer ? (
              <div className="text-center w-full">
                <p className="text-slate-500 text-sm mb-2">
                  {session?.mode === 'front-to-back' ? 'English' : 'European Portuguese'}
                </p>
                <div className="flex items-center justify-center gap-2 mb-8">
                  <p className="text-2xl font-medium">{cardBack}</p>
                  {session?.mode === 'back-to-front' && getCurrentCard()?.audioFileId && (
                    <Button
                      type={isPlaying ? "primary" : "default"}
                      shape="circle"
                      icon={<IoVolumeHigh />}
                      onClick={playAudio}
                      aria-label="Play pronunciation"
                    />
                  )}
                </div>
                
                <p className="text-sm text-slate-600 mb-4">How well did you know this card?</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {qualityLabels.map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className="hover:opacity-90 transition-all"
                      style={{ 
                        color: 'white', 
                        height: 'auto', 
                        padding: '8px 4px', 
                        backgroundColor: option.color,
                        width: '100%'
                      }}
                      title={option.description}
                    >
                      <div className="flex flex-col items-center">
                        <span className="block text-lg font-bold">{option.shortcut}</span>
                        <span className="block text-xs whitespace-normal">{option.label}</span>
                      </div>
                    </Button>
                  ))}
                </div>
                
                <div className="text-xs text-slate-500 mt-4">
                  <p>Press keys 1-6 to rate or Space to reveal answer</p>
                </div>
              </div>
            ) : (
              <Button
                type="primary"
                onClick={handleReveal}
                size="large"
              >
                Show Answer
              </Button>
            )}
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-sm text-slate-500">
            Progress: {Math.round(((session?.currentCardIndex || 0) / (session?.cards.length || 1)) * 100)}%
          </p>
          <Progress 
            percent={Math.round(((session?.currentCardIndex || 0) / (session?.cards.length || 1)) * 100)} 
            showInfo={false} 
            strokeColor="#2563eb"
          />
        </div>
      </div>
    </div>
  );
}