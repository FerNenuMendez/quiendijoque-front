import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';

// Las interfaces de lo que nos devuelve tu backend
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

  // Estados del juego
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  // Estados del timer
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Estados visuales de la respuesta
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [correctAuthorId, setCorrectAuthorId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // ====================================================================
  // 1. Traer la ronda de preguntas al entrar
  // ====================================================================
  useEffect(() => {
    const fetchRound = async () => {
      try {
        const response = await apiClient.get(`/game/round/${categoryId}`);
        setQuestions(response.data.questions);
      } catch (error) {
        console.error('Error trayendo la ronda:', error);
        Alert.alert('Error', 'No se pudo generar la ronda.');
        navigation.navigate('CreateGame'); // Volvemos a categorías si falla
      } finally {
        setIsLoading(false);
      }
    };

    fetchRound();
  }, [categoryId]);

  // ====================================================================
  // 2. Lógica del Contador de 10 Segundos (El motor del reloj)
  // ====================================================================
  useEffect(() => {
    // Si la app está cargando, revisando respuesta, o ya terminó, frenamos el reloj
    if (isChecking || isFinished || isLoading || questions.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      // Simplemente restamos 1. Nunca bajamos de 0.
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Cleanup para cuando se desmonta el componente
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isChecking, isFinished, isLoading, questions.length]);

  // ====================================================================
  // 3. El Vigilante del Tiempo (Dispara el evento al llegar a 0)
  // ====================================================================
  useEffect(() => {
    // Si el tiempo es 0 y todavía no estamos chequeando otra respuesta...
    if (timeLeft === 0 && !isChecking && !isFinished) {
      handleTimeOut();
    }
  }, [timeLeft, isChecking, isFinished]);

  // ====================================================================
  // 4. Funciones de acción
  // ====================================================================
  const handleTimeOut = () => {
    // Le pasamos un flag especial para que cuente como error
    handleSelectOption('TIME_OUT');
  };

  const handleSelectOption = async (authorId: string) => {
    if (isChecking) return;
    if (timerRef.current) clearInterval(timerRef.current); // Frenamos el reloj al toque

    setIsChecking(true);
    setSelectedAuthorId(authorId);

    const currentQuestion = questions[currentIndex];

    try {
      // Si el tiempo se acabó, mandamos un MongoID inválido ('0' repetido 24 veces) para forzar el error
      const idToValidate =
        authorId === 'TIME_OUT' ? '000000000000000000000000' : authorId;

      const response = await apiClient.post('/game/answer', {
        quoteId: currentQuestion.quoteId,
        selectedAuthorId: idToValidate,
      });

      const { isCorrect, correctAuthorId: actualCorrectId } = response.data;

      setCorrectAuthorId(actualCorrectId);
      if (isCorrect) setScore((prev) => prev + 10);

      // Esperamos 1.5 segundos para mostrar el feedback visual
      setTimeout(async () => {
        if (currentIndex < questions.length - 1) {
          // Siguiente pregunta
          setCurrentIndex((prev) => prev + 1);
          setSelectedAuthorId(null);
          setCorrectAuthorId(null);
          setTimeLeft(10); // 🔥 Reiniciamos el reloj para la próxima frase
          setIsChecking(false);
        } else {
          // TERMINÓ EL JUEGO: Guardamos y mostramos pantalla final
          setIsLoading(true);
          const finalScore = score + (isCorrect ? 10 : 0);

          try {
            await apiClient.patch('/users/me/score', { points: finalScore });
            setScore(finalScore);
            setIsFinished(true);
          } catch (error) {
            console.error('Error guardando puntos:', error);
            Alert.alert(
              'Aviso',
              'No se pudieron guardar tus puntos por un error de red.',
            );
            setScore(finalScore);
            setIsFinished(true);
          } finally {
            setIsLoading(false);
          }
        }
      }, 1500);
    } catch (error) {
      console.error('Error validando respuesta:', error);
      Alert.alert('Error', 'Hubo un problema de conexión.');
      setIsChecking(false);
      setSelectedAuthorId(null);
    }
  };

  // ====================================================================
  // PANTALLAS DE CARGA Y VICTORIA
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
      <View className="flex-1 bg-slate-900 justify-center items-center px-8">
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
    );
  }

  // ====================================================================
  // PANTALLA DE JUEGO PRINCIPAL
  // ====================================================================
  const currentQuestion = questions[currentIndex];

  return (
    <View className="flex-1 bg-slate-900 px-6 pt-16 pb-8">
      {/* HEADER: Botón salir, Contador Visual y Puntaje */}
      <View className="flex-row justify-between items-center mb-10">
        <TouchableOpacity
          className="bg-slate-800 w-12 h-12 rounded-full items-center justify-center border border-slate-700"
          onPress={() => {
            Alert.alert(
              '¿Salir de la partida?',
              'Si salís ahora, perderás el progreso de esta ronda.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Salir',
                  onPress: () => navigation.navigate('CreateGame'),
                  style: 'destructive',
                },
              ],
            );
          }}
        >
          <Text className="text-white font-bold">X</Text>
        </TouchableOpacity>

        {/* 🔥 TIMER VISUAL en el centro */}
        <View
          className={`w-14 h-14 rounded-full items-center justify-center border-4 ${timeLeft <= 3 ? 'border-red-500 bg-red-500/10' : 'border-fuchsia-500 bg-fuchsia-500/10'}`}
        >
          <Text
            className={`font-black text-xl ${timeLeft <= 3 ? 'text-red-500' : 'text-fuchsia-400'}`}
          >
            {timeLeft}
          </Text>
        </View>

        <View className="bg-yellow-400 px-4 py-2 rounded-full shadow-sm">
          <Text className="text-slate-900 font-extrabold">{score} pts</Text>
        </View>
      </View>

      {/* CONTADOR DE PREGUNTAS (1/10) */}
      <Text className="text-slate-500 font-bold text-center mb-2 text-sm uppercase tracking-widest">
        Pregunta {currentIndex + 1} de {questions.length}
      </Text>

      {/* LA PREGUNTA (LA FRASE) */}
      <View className="flex-1 justify-center mb-8">
        <Text className="text-slate-400 font-medium text-lg text-center mb-4">
          ¿Quién dijo?
        </Text>
        <Text className="text-white text-4xl font-extrabold text-center leading-[50px]">
          "{currentQuestion?.text}"
        </Text>

        {/* Mensajito extra si se acaba el tiempo */}
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

          if (isChecking) {
            if (option.id === correctAuthorId) {
              buttonStyle = 'bg-green-500 border-green-400'; // La correcta siempre se pinta de verde
            } else if (option.id === selectedAuthorId) {
              buttonStyle = 'bg-red-500 border-red-400'; // La incorrecta elegida se pinta de rojo
            } else {
              buttonStyle = 'bg-slate-800/50 border-slate-700/50 opacity-50'; // El resto se apaga
            }
          }

          return (
            <TouchableOpacity
              key={option.id}
              disabled={isChecking}
              onPress={() => handleSelectOption(option.id)}
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
              {isChecking &&
                option.id === selectedAuthorId &&
                option.id !== correctAuthorId && (
                  <Text className="text-2xl">❌</Text>
                )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
