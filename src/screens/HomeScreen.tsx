import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../api/client'; // 🔥 Importamos el cliente para pegarle al backend

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [userName, setUserName] = useState('Jugador');
  const [points, setPoints] = useState(0); // 🔥 Estado para los puntos reales
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // useFocusEffect se ejecuta cada vez que la pantalla vuelve a estar "en foco"
  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          // 1. Cargamos el nombre rápido desde la memoria para que la interfaz no parpadee
          const sessionString = await SecureStore.getItemAsync('user_session');
          if (sessionString) {
            const user = JSON.parse(sessionString);
            setUserName(user.username || user.name || 'Jugador');
          }

          // 2. Buscamos los puntos frescos en el backend
          const response = await apiClient.get('/users/me');

          // Actualizamos los puntos con lo que diga MongoDB
          if (
            response.data &&
            response.data.user &&
            response.data.user.totalPoints !== undefined
          ) {
            setPoints(response.data.user.totalPoints);
          }
        } catch (error) {
          console.error('Error refrescando datos en el Home:', error);
        }
      };

      fetchUserData();
    }, []),
  );

  // Función para cerrar sesión real
  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('user_session'); // Borramos los datos del usuario
      await SecureStore.deleteItemAsync('access_token'); // 🔥 Borramos también el token de seguridad
      setIsMenuVisible(false);
      navigation.replace('Login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <View className="flex-1 bg-slate-900 px-6 pb-8 pt-16">
      {/* BOTÓN DE AYUDA (Flotando anclado arriba a la derecha) */}
      <TouchableOpacity className="absolute top-16 right-6 w-10 h-10 bg-slate-800 rounded-full items-center justify-center z-10 active:bg-slate-700">
        <Text className="text-slate-400 font-bold text-lg">?</Text>
      </TouchableOpacity>

      {/* CONTENEDOR PRINCIPAL */}
      <View className="flex-1 justify-center items-center w-full">
        {/* AVATAR + PUNTAJE */}
        <TouchableOpacity
          className="relative mb-8"
          onPress={() => setIsMenuVisible(true)}
          activeOpacity={0.8}
        >
          <View className="w-32 h-32 bg-slate-700 rounded-full items-center justify-center border-4 border-slate-600 shadow-xl shadow-black">
            <Text className="text-6xl text-white font-bold">
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* 🔥 EL CÍRCULO DE PUNTOS DINÁMICO */}
          <View className="absolute bottom-0 right-0 bg-yellow-400 min-w-[40px] h-10 px-2 rounded-full items-center justify-center border-4 border-slate-900">
            <Text className="text-slate-900 font-extrabold text-sm">
              {points}
            </Text>
          </View>
        </TouchableOpacity>

        {/* MENSAJE DE BIENVENIDA */}
        <View className="mb-12 items-center">
          <Text className="text-slate-400 text-xl mb-1 text-center">
            ¡Hola de nuevo!
          </Text>
          <Text className="text-5xl font-extrabold text-white text-center">
            {userName} 🤘
          </Text>
        </View>

        {/* BOTÓN PRINCIPAL */}
        <TouchableOpacity
          className="bg-fuchsia-600 py-5 px-8 w-full rounded-2xl active:bg-fuchsia-700 shadow-lg shadow-fuchsia-900/50"
          onPress={() => navigation.navigate('CreateGame')}
        >
          <Text className="text-center text-white font-extrabold text-xl tracking-wide">
            Crear Nueva Partida
          </Text>
        </TouchableOpacity>
      </View>

      {/* PLACEHOLDER PUBLICIDAD */}
      <View className="bg-slate-800 border border-slate-700 rounded-xl h-24 items-center justify-center border-dashed mt-6">
        <Text className="text-slate-500 font-medium text-center px-4">
          Espacio reservado para Google AdMob
        </Text>
      </View>

      {/* =========================================
          MODAL DEL MENÚ DE PERFIL
          ========================================= */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/80 justify-center items-center px-8"
          onPress={() => setIsMenuVisible(false)}
        >
          <Pressable className="bg-slate-800 w-full p-6 rounded-3xl items-center border border-slate-700">
            <Text className="text-2xl font-bold text-white mb-8 border-b border-slate-700 pb-4 w-full text-center">
              Menú de Jugador
            </Text>

            <TouchableOpacity
              className="w-full bg-slate-700 py-4 rounded-xl mb-4 items-center active:bg-slate-600"
              onPress={() => {
                setIsMenuVisible(false);
                // navigation.navigate('Profile');
              }}
            >
              <Text className="text-white font-bold text-lg">
                👤 Ver Perfil
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full bg-slate-700 py-4 rounded-xl mb-8 items-center active:bg-slate-600"
              onPress={() => {
                setIsMenuVisible(false);
                // navigation.navigate('Settings');
              }}
            >
              <Text className="text-white font-bold text-lg">⚙️ Ajustes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full bg-red-500/10 py-4 rounded-xl items-center border border-red-500/50 active:bg-red-500/20"
              onPress={handleLogout}
            >
              <Text className="text-red-400 font-bold text-lg">
                🚪 Cerrar Sesión
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
