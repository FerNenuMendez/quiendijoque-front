import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 justify-center items-center px-8 bg-slate-900">
      <Text className="text-4xl font-extrabold text-white text-center mb-4">
        ¡Bienvenido! 🤘
      </Text>
      <Text className="text-slate-400 text-center mb-10 text-lg">
        Acá vamos a poner la lista de partidas, el ranking y tu perfil.
      </Text>

      <TouchableOpacity className="bg-purple-600 py-4 px-8 rounded-xl active:bg-purple-700 w-full">
        <Text className="text-center text-white font-bold text-lg">
          Crear Nueva Partida
        </Text>
      </TouchableOpacity>
    </View>
  );
}
