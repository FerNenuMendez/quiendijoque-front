import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';

// Definimos cómo luce la categoría que viene de tu MongoDB
interface DBCategory {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  requiresPremium: boolean;
  isLocked: boolean;
}

export default function CreateGameScreen() {
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Buscamos las categorías a tu backend ni bien carga la pantalla
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Asegurate de tener este endpoint en tu NestJS (ej: /categories)
        const response = await apiClient.get('/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error al traer categorías:', error);
        Alert.alert(
          'Error',
          'No pudimos cargar las categorías. Intentá de nuevo.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // 2. Diccionario de Estilos: Le ponemos facha según el 'slug' que venga de Mongo
  const getCategoryStyle = (slug: string) => {
    switch (slug) {
      case 'rock':
        return {
          icon: '🎸',
          color: 'bg-fuchsia-500',
          shadow: 'shadow-fuchsia-900/50',
        };
      case 'cine-y-series':
        return {
          icon: '🍿',
          color: 'bg-blue-500',
          shadow: 'shadow-blue-900/50',
        };
      case 'futbol':
        return {
          icon: '⚽',
          color: 'bg-emerald-500',
          shadow: 'shadow-emerald-900/50',
        };
      case 'series-de-tv':
        return {
          icon: '📺',
          color: 'bg-purple-500',
          shadow: 'shadow-purple-900/50',
        };
      default:
        // Estilo por defecto por si agregás categorías nuevas y te olvidás de ponerles ícono
        return {
          icon: '🎲',
          color: 'bg-slate-600',
          shadow: 'shadow-slate-900/50',
        };
    }
  };

  // 3. Acción al tocar la categoría: Viajamos a la pantalla del juego con el ID
  const handleSelectCategory = (categoryId: string) => {
    // Viajamos a 'GameRound' pasándole el _id de la categoría como parámetro
    navigation.navigate('GameRound', { categoryId: categoryId });
  };

  return (
    <View className="flex-1 bg-slate-900 px-6 pt-16 pb-8">
      {/* HEADER */}
      <View className="flex-row items-center mb-8">
        <TouchableOpacity
          className="w-12 h-12 bg-slate-800 rounded-full items-center justify-center mr-4 active:bg-slate-700 border border-slate-700"
          onPress={() => navigation.navigate('Home')}
        >
          <Text className="text-white text-2xl font-bold">←</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-extrabold text-white flex-1">
          Nueva Partida
        </Text>
      </View>

      {/* TARJETA DE EXPLICACIÓN */}
      <View className="bg-slate-800 p-6 rounded-3xl mb-8 border border-slate-700 shadow-lg shadow-black/40">
        <Text className="text-xl font-bold text-white mb-2">
          ¿Cómo se juega?
        </Text>
        <Text className="text-slate-400 text-base leading-6">
          Elegí un tema. Te vamos a mostrar una frase icónica y tenés que
          adivinar{' '}
          <Text className="text-white font-bold">¿Quién Dijo Qué?</Text>. Sumás
          puntos por cada acierto. ¡Mucha suerte!
        </Text>
      </View>

      <Text className="text-slate-300 text-lg font-bold mb-4 px-1">
        Seleccioná una categoría:
      </Text>

      {/* GRILLA O SPINNER DE CARGA */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#d946ef" />
          <Text className="text-slate-400 mt-4">Cargando categorías...</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-between w-full">
          {categories.map((cat, index) => {
            const style = getCategoryStyle(cat.slug);
            const uniqueId = cat._id || cat.id || index.toString();

            return (
              <TouchableOpacity
                key={uniqueId}
                className={`w-[48%] aspect-square ${style.color} rounded-3xl p-4 mb-4 justify-between items-start shadow-lg ${style.shadow} active:opacity-80`}
                onPress={() => handleSelectCategory(uniqueId)}
              >
                <View className="bg-white/20 p-3 rounded-2xl flex-row justify-between w-full items-center">
                  <Text className="text-4xl">{style.icon}</Text>
                  {/* Si está bloqueado, mostramos el candado */}
                  {cat.isLocked && (
                    <Text className="text-yellow-400 text-lg">🔒</Text>
                  )}
                </View>
                <Text className="text-white font-extrabold text-xl tracking-wide">
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ESPACIO FLEXIBLE */}
      <View className="flex-1" />

      {/* PLACEHOLDER PUBLICIDAD */}
      <View className="bg-slate-800 border border-slate-700 rounded-xl h-24 items-center justify-center border-dashed mt-6">
        <Text className="text-slate-500 font-medium text-center px-4">
          Espacio reservado para Google AdMob
        </Text>
      </View>
    </View>
  );
}
