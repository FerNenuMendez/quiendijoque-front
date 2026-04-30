import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { audioService } from '../services/AudioService';

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

interface Option {
  id: string;
  name: string;
  avatar?: string;
}

interface Question {
  quoteId: string;
  text: string;
  options: Option[];
}

export default function GameRoundScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { categoryId } = route.params;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [correctAuthorId, setCorrectAuthorId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // ====================================================================
  // MOTORES DE ANIMACIÓN
  // ====================================================================
  const scoreScale = useRef(new Animated.Value(1)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (score > 0) {
      Animated.sequence([
        Animated.timing(scoreScale, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scoreScale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [score]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // 🔥 Motor de Sonido
  const playSound = async (type: 'correct' | 'wrong' | 'win' | 'level') => {
    // 🛑 VÁLVULA DE CORTE: Si el sonido está desactivado en ajustes, no hace nada
    if (!audioService.isSoundEnabled) return;

    try {
      let soundSource;
      if (type === 'correct')
        soundSource = require('../../assets/sounds/correcto.mp3');
      else if (type === 'wrong')
        soundSource = require('../../assets/sounds/error.mp3');
      else if (type === 'win')
        soundSource = require('../../assets/sounds/aplausos.mp3');
      else if (type === 'level')
        soundSource = require('../../assets/sounds/levelUp.mp3');

      const { sound: newSound } = await Audio.Sound.createAsync(soundSource);
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.log('Error reproduciendo sonido:', error);
    }
  };

  // 🔥 Motor de Vibración (Haptics)
  const triggerHaptic = (type: 'success' | 'error') => {
    // 🛑 VÁLVULA DE CORTE: Si la vibración está desactivada en ajustes, no hace nada
    if (!audioService.isVibrationEnabled) return;

    if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  useEffect(() => {
    if (questions.length > 0) {
      Animated.timing(progressWidth, {
        toValue: (currentIndex + 1) / questions.length,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [currentIndex, questions.length]);

  // GESTOR DE MÚSICA DE FONDO
  useEffect(() => {
    // 1. Al entrar a la ronda: Apagamos Lobby, prendemos Tic-Tac
    audioService.stopLobby();
    audioService.playTicTac();

    // 2. Al "desmontar" la pantalla (cuando toca la X o se va para atrás):
    return () => {
      audioService.stopTicTac();
      audioService.playLobby();
    };
  }, []);

  const widthPercent = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ====================================================================
  // FETCH DE PREGUNTAS
  // ====================================================================
  useEffect(() => {
    const fetchRound = async () => {
      try {
        const response = await apiClient.get(`/game/round/${categoryId}`);
        setQuestions(response.data.questions);
      } catch (error) {
        Alert.alert('Error', 'No se pudo generar la ronda.');
        navigation.navigate('CreateGame');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRound();
  }, [categoryId]);

  // ====================================================================
  // LÓGICA DEL CONTADOR
  // ====================================================================
  useEffect(() => {
    if (isChecking || isFinished || isLoading || questions.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isChecking, isFinished, isLoading, questions.length]);

  useEffect(() => {
    if (timeLeft === 0 && !isChecking && !isFinished) {
      handleTimeOut();
    }
  }, [timeLeft, isChecking, isFinished]);

  const handleTimeOut = () => {
    handleSelectOption('TIME_OUT');
  };

  // ====================================================================
  // VALIDACIÓN DE RESPUESTA & LÓGICA DE RACHA
  // ====================================================================
  const handleSelectOption = async (authorId: string) => {
    if (isChecking) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsChecking(true);
    setSelectedAuthorId(authorId);

    const currentQuestion = questions[currentIndex];

    try {
      const idToValidate =
        authorId === 'TIME_OUT' ? '000000000000000000000000' : authorId;
      const response = await apiClient.post('/game/answer', {
        quoteId: currentQuestion.quoteId,
        selectedAuthorId: idToValidate,
      });

      const { isCorrect, correctAuthorId: actualCorrectId } = response.data;
      setCorrectAuthorId(actualCorrectId);

      let currentStreak = streak;

      if (isCorrect) {
        triggerHaptic('success');
        currentStreak += 1;
        setStreak(currentStreak);

        // LÓGICA DEL MULTIPLICADOR
        const isSpeedBonus = timeLeft >= 8;
        let activeMultiplier = 1;

        if (currentStreak >= 3 || isSpeedBonus) {
          activeMultiplier = 2;
          playSound('level');
        } else {
          playSound('correct');
        }

        setMultiplier(activeMultiplier);

        const earnedPoints = 10 * activeMultiplier;
        scoreRef.current += earnedPoints;
        setScore(scoreRef.current);
      } else {
        triggerHaptic('error');
        playSound('wrong');
        triggerShake();
        setStreak(0);
        setMultiplier(1);
      }

      setTimeout(async () => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setSelectedAuthorId(null);
          setCorrectAuthorId(null);
          setTimeLeft(10);
          setIsChecking(false);

          // Si no tiene racha consolidada, limpiamos el multiplicador visual para la próxima
          if (currentStreak < 3) {
            setMultiplier(1);
          }
        } else {
          setIsLoading(true);
          try {
            await apiClient.patch('/users/me/score', {
              points: scoreRef.current,
            });

            setIsFinished(true);
          } catch (error) {
            setIsFinished(true);
          } finally {
            setIsLoading(false);
          }
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
      audioService.stopTicTac();
      playSound('win');
    }
  }, [isFinished]);

  // ====================================================================
  // PANTALLAS (CARGA Y VICTORIA)
  // ====================================================================
  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#d946ef" />
        <Text className="text-slate-400 mt-4 text-lg">Procesando...</Text>
      </View>
    );
  }

  if (isFinished) {
    return (
      <View className="flex-1 bg-slate-900 px-6 pt-16 pb-8">
        <LottieView
          source={require('../../assets/animations/confetti.json')}
          autoPlay
          loop={false}
          resizeMode="cover"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        <View className="flex-1 items-center justify-center z-10 w-full">
          <Text className="text-6xl mb-6">🏆</Text>
          <Text className="text-white text-3xl font-extrabold text-center mb-2">
            ¡Ronda Terminada!
          </Text>
          <Text className="text-slate-400 text-xl text-center mb-10">
            Sumaste <Text className="text-yellow-400 font-black">{score}</Text>{' '}
            puntos
          </Text>

          <TouchableOpacity
            className="bg-fuchsia-600 py-4 w-full rounded-2xl mb-4 shadow-lg shadow-fuchsia-900/50 active:bg-fuchsia-700"
            onPress={() => navigation.replace('GameRound', { categoryId })}
          >
            <Text className="text-white text-center font-bold text-lg">
              Jugar de nuevo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-slate-800 py-4 w-full rounded-2xl border border-slate-700 active:bg-slate-700"
            onPress={() => navigation.navigate('CreateGame')}
          >
            <Text className="text-slate-300 text-center font-bold text-lg">
              Volver a Categorías
            </Text>
          </TouchableOpacity>
        </View>

        <View className="w-full bg-slate-800 border border-slate-700 rounded-xl h-24 items-center justify-center border-dashed mt-6 z-10">
          <Text className="text-slate-500 font-medium text-center px-4">
            Espacio reservado para Google AdMob
          </Text>
        </View>
      </View>
    );
  }

  // ====================================================================
  // PANTALLA DE JUEGO PRINCIPAL
  // ====================================================================
  const currentQuestion = questions[currentIndex];

  return (
    <View className="flex-1 bg-slate-900 px-6 pt-16 pb-6">
      {/* HEADER */}
      <View className="relative flex-row justify-between items-center mb-8 h-14">
        <TouchableOpacity
          className="bg-slate-800 w-12 h-12 rounded-full items-center justify-center border border-slate-700 z-10"
          onPress={() => {
            Alert.alert('¿Salir de la partida?', 'Perderás el progreso.', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Salir',
                onPress: () => navigation.navigate('CreateGame'),
                style: 'destructive',
              },
            ]);
          }}
        >
          <Text className="text-white font-bold">X</Text>
        </TouchableOpacity>

        <View className="absolute left-0 right-0 items-center pointer-events-none">
          <View
            className={`w-14 h-14 rounded-full items-center justify-center border-4 ${timeLeft <= 3 ? 'border-red-500 bg-red-500/10' : 'border-fuchsia-500 bg-fuchsia-500/10'}`}
          >
            <Text
              className={`font-black text-xl ${timeLeft <= 3 ? 'text-red-500' : 'text-fuchsia-400'}`}
            >
              {timeLeft}
            </Text>
          </View>
        </View>

        {/* PUNTAJE ANIMADO CON ETIQUETA DE MULTIPLICADOR */}
        <View className="items-center z-10 relative">
          <Animated.View
            style={{ transform: [{ scale: scoreScale }] }}
            className="bg-yellow-400 px-4 py-2 rounded-full shadow-sm min-w-[75px] items-center"
          >
            <Text className="text-slate-900 font-extrabold">{score} pts</Text>
          </Animated.View>

          {/* Etiqueta de combo activo (Se muestra si el multiplicador es > 1) */}
          {multiplier > 1 && (
            <View className="absolute -bottom-4 bg-orange-500 px-2 py-0.5 rounded-md border border-orange-400 shadow-sm">
              <Text className="text-white font-black text-xs">
                🔥 x{multiplier}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* BARRA DE PROGRESO ANIMADA */}
      <View className="w-full h-2 bg-slate-800 rounded-full mb-2 overflow-hidden">
        <Animated.View
          style={{
            width: widthPercent,
            height: '100%',
            backgroundColor: '#d946ef',
          }}
        />
      </View>
      <View className="flex-row justify-between mb-8">
        <Text className="text-slate-500 font-bold text-xs uppercase tracking-widest">
          Pregunta {currentIndex + 1} de {questions.length}
        </Text>
        {/* Indicador de Racha */}
        {streak >= 3 && (
          <Text className="text-orange-400 font-bold text-xs uppercase tracking-widest">
            Racha: {streak} 🔥
          </Text>
        )}
      </View>

      {/* LA PREGUNTA */}
      <View className="justify-center mb-8">
        <Text className="text-slate-400 font-medium text-lg text-center mb-4">
          ¿Quién dijo?
        </Text>
        <Text className="text-white text-4xl font-extrabold text-center leading-[50px]">
          "{currentQuestion?.text}"
        </Text>

        {isChecking && selectedAuthorId === 'TIME_OUT' && (
          <Text className="text-red-500 text-center font-bold mt-6 text-lg">
            ¡Se acabó el tiempo! ⏳
          </Text>
        )}
      </View>

      {/* LAS OPCIONES */}
      <View className="w-full">
        {currentQuestion?.options.map((option) => {
          let buttonStyle = 'bg-slate-800 border-slate-700';
          let isSelectedAndWrong = false;

          if (isChecking) {
            if (option.id === correctAuthorId) {
              buttonStyle = 'bg-green-500 border-green-400';
            } else if (option.id === selectedAuthorId) {
              buttonStyle = 'bg-red-500 border-red-400';
              isSelectedAndWrong = true;
            } else {
              buttonStyle = 'bg-slate-800/50 border-slate-700/50 opacity-50';
            }
          }

          return (
            <AnimatedTouchableOpacity
              key={option.id}
              disabled={isChecking}
              onPress={() => handleSelectOption(option.id)}
              style={{
                transform: [{ translateX: isSelectedAndWrong ? shakeAnim : 0 }],
              }}
              className={`w-full py-5 px-6 rounded-2xl border-2 mb-4 flex-row items-center justify-between shadow-lg shadow-black/20 ${buttonStyle}`}
            >
              <Text
                className={`text-xl font-bold ${isChecking && (option.id === correctAuthorId || option.id === selectedAuthorId) ? 'text-slate-900' : 'text-white'}`}
              >
                {option.name}
              </Text>

              {isChecking && option.id === correctAuthorId && (
                <Text className="text-2xl">✅</Text>
              )}
              {isChecking && isSelectedAndWrong && (
                <Text className="text-2xl">❌</Text>
              )}
            </AnimatedTouchableOpacity>
          );
        })}
      </View>

      <View className="flex-1" />
      <View className="w-full h-16 bg-slate-800/50 border border-slate-700 border-dashed rounded-xl items-center justify-center mt-4">
        <Text className="text-slate-500 font-medium">Espacio AdMob Banner</Text>
      </View>
    </View>
  );
}
