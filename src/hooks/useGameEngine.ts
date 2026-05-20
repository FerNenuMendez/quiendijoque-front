import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { apiClient } from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { useGameAudio } from './useGameAudio';
import { useTimer } from './useTimer';

export interface Option {
  id: string;
  name: string;
  avatar?: string;
}

export interface Question {
  quoteId: string;
  text: string;
  options: Option[];
}

export const useGameEngine = (categoryId: string) => {
  const navigation = useNavigation<any>();
  const { playSound, triggerHaptic, stopTicTacMusic } = useGameAudio();

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(1);
  const TOTAL_QUESTIONS = 10;

  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [correctAuthorId, setCorrectAuthorId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const { timeLeft, isTimeUp, startTimer, stopTimer } = useTimer(
    10,
    isChecking,
    isFinished
  );

  const fetchNextQuestion = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/game/next-question/${categoryId}`);
      setCurrentQuestion(response.data.question);
      setIsChecking(false);
      startTimer(10);
      setSelectedAuthorId(null);
      setCorrectAuthorId(null);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar la pregunta.');
      navigation.navigate('CreateGame');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNextQuestion();
  }, [categoryId]);

  useEffect(() => {
    if (isTimeUp && !isChecking && !isFinished) {
      handleSelectOption('TIME_OUT', null);
    }
  }, [isTimeUp, isChecking, isFinished]);

  const handleSelectOption = async (
    authorId: string,
    triggerShake: (() => void) | null
  ) => {
    if (isChecking) return;
    stopTimer();

    setIsChecking(true);
    setSelectedAuthorId(authorId);

    if (!currentQuestion) return;

    try {
      const idToValidate =
        authorId === 'TIME_OUT' ? '000000000000000000000000' : authorId;
      const response = await apiClient.post('/game/answer', {
        quoteId: currentQuestion.quoteId,
        selectedAuthorId: idToValidate,
      });

      const {
        isCorrect,
        correctAuthorId: actualCorrectId,
        pointsEarned,
        currentStreak: serverStreak,
      } = response.data;
      setCorrectAuthorId(actualCorrectId);
      setStreak(serverStreak);

      if (isCorrect) {
        triggerHaptic('success');

        const activeMultiplier = pointsEarned > 10 ? 2 : 1;
        setMultiplier(activeMultiplier);

        if (activeMultiplier === 2) {
          playSound('level');
        } else {
          playSound('correct');
        }

        scoreRef.current += pointsEarned;
        setScore(scoreRef.current);
      } else {
        triggerHaptic('error');
        playSound('wrong');
        if (triggerShake) triggerShake();
        setMultiplier(1);
      }

      setTimeout(async () => {
        if (questionIndex < TOTAL_QUESTIONS) {
          setQuestionIndex((prev) => prev + 1);
          if (serverStreak < 3) {
            setMultiplier(1);
          }
          fetchNextQuestion();
        } else {
          setIsFinished(true);
        }
      }, 1500);
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema de conexión.');
      setIsChecking(false);
      setSelectedAuthorId(null);
    }
  };

  useEffect(() => {
    if (isFinished) {
      stopTicTacMusic();
      playSound('win');
    }
  }, [isFinished]);

  return {
    currentQuestion,
    questionIndex,
    TOTAL_QUESTIONS,
    score,
    streak,
    multiplier,
    isLoading,
    isFinished,
    timeLeft,
    selectedAuthorId,
    correctAuthorId,
    isChecking,
    handleSelectOption,
  };
};
