import React, { useState, useEffect } from 'react';
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
  const { categoryId } = route.params; // Recibimos el ID desde la pantalla anterior

  // Estados del juego
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false); // 🔥 Nuevo estado para el final

  // Estados visuales de la respuesta
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [correctAuthorId, setCorrectAuthorId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Traer la ronda de preguntas al entrar
  useEffect(() => {
    const fetchRound = async () => {
      try {
        const response = await apiClient.get(`/game/round/${categoryId}`);
        setQuestions(response.data.questions);
      } catch (error) {
        console.error('Error trayendo la ronda:', error);
        Alert.alert('Error', 'No se pudo generar la ronda.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    fetchRound();
  }, [categoryId]);

  // Manejar cuando el jugador toca una opción
  const handleSelectOption = async (authorId: string) => {
    // Si ya estamos validando, no dejamos que toque de nuevo
    if (isChecking) return;

    setIsChecking(true);
    setSelectedAuthorId(authorId);

    const currentQuestion = questions[currentIndex];

    try {
      // Le preguntamos a tu backend si es correcta
      const response = await apiClient.post('/game/answer', {
        quoteId: currentQuestion.quoteId,
        selectedAuthorId: authorId,
      });

      const { isCorrect, correctAuthorId: actualCorrectId } = response.data;

      setCorrectAuthorId(actualCorrectId);
      if (isCorrect) setScore((prev) => prev + 10);

      // 🔥 Esperamos 1.5 segundos (ahora es async para poder pegarle a tu API)
      setTimeout(async () => {
        if (currentIndex < questions.length - 1) {
          // Pasamos a la siguiente
          setCurrentIndex((prev) => prev + 1);
          setSelectedAuthorId(null);
          setCorrectAuthorId(null);
          setIsChecking(false);
        } else {
          // TERMINÓ EL JUEGO: Mandamos los puntos al backend
          setIsLoading(true);
          const finalScore = score + (isCorrect ? 10 : 0);

          try {
            await apiClient.patch('/users/me/score', { points: finalScore });
            setScore(finalScore); // Actualizamos el score final localmente
            setIsFinished(true); // Mostramos la pantalla de victoria
          } catch (error) {
            console.error('Error guardando puntos:', error);
            Alert.alert(
              'Aviso',
              'No se pudieron guardar tus puntos por un error de red.',
            );
            setScore(finalScore);
            setIsFinished(true); // Mostramos el final igual para que no se trabe
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

  // Pantalla de carga
  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#d946ef" />
        <Text className="text-slate-400 mt-4 text-lg">Procesando...</Text>
      </View>
    );
  }

  // ====================================================================
  // 🔥 PANTALLA DE VICTORIA (Renderizado Condicional)
  // ====================================================================
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
  // PANTALLA DE JUEGO (Principal)
  // ====================================================================
  const currentQuestion = questions[currentIndex];

  return (
    <View className="flex-1 bg-slate-900 px-6 pt-16 pb-8">
      {/* HEADER: Botón salir, Contador y Puntaje */}
      <View className="flex-row justify-between items-center mb-10">
        <TouchableOpacity
          className="bg-slate-800 p-3 rounded-full border border-slate-700"
          onPress={() => {
            Alert.alert(
              '¿Salir de la partida?',
              'Si salís ahora, perderás el progreso de esta ronda.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Salir',
                  onPress: () => navigation.goBack(),
                  style: 'destructive',
                },
              ],
            );
          }}
        >
          <Text className="text-white font-bold">X</Text>
        </TouchableOpacity>

        <Text className="text-slate-400 font-bold text-lg">
          {currentIndex + 1} / {questions.length}
        </Text>

        <View className="bg-yellow-400 px-4 py-2 rounded-full shadow-sm">
          <Text className="text-slate-900 font-extrabold">{score} pts</Text>
        </View>
      </View>

      {/* LA PREGUNTA (LA FRASE) */}
      <View className="flex-1 justify-center mb-8">
        <Text className="text-fuchsia-400 font-bold text-xl text-center mb-4 uppercase tracking-widest">
          ¿Quién dijo?
        </Text>
        <Text className="text-white text-4xl font-extrabold text-center leading-[50px]">
          "{currentQuestion?.text}"
        </Text>
      </View>

      {/* LAS OPCIONES */}
      <View className="w-full">
        {currentQuestion?.options.map((option) => {
          let buttonStyle = 'bg-slate-800 border-slate-700';

          if (isChecking) {
            if (option.id === correctAuthorId) {
              buttonStyle = 'bg-green-500 border-green-400';
            } else if (option.id === selectedAuthorId) {
              buttonStyle = 'bg-red-500 border-red-400';
            } else {
              buttonStyle = 'bg-slate-800/50 border-slate-700/50 opacity-50';
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
