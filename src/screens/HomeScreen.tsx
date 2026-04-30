import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../api/client';

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState('Jugador');
  const [points, setPoints] = useState(0);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);

  const breatheAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [breatheAnim]);

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          const sessionString = await SecureStore.getItemAsync('user_session');
          if (sessionString) {
            const user = JSON.parse(sessionString);
            setUserAvatar(user.avatar || null);
            setUserName(user.username || user.name || 'Jugador');
          }

          const response = await apiClient.get('/users/me');
          if (response.data && response.data.user) {
            const freshUser = response.data.user;
            if (freshUser.totalPoints !== undefined)
              setPoints(freshUser.totalPoints);
            setUserAvatar(freshUser.avatar || null);
            setUserName(freshUser.username || freshUser.name || 'Jugador');
          }
        } catch (error) {
          console.error('Error refrescando datos en el Home:', error);
        }
      };
      fetchUserData();
    }, []),
  );

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('user_session');
      await SecureStore.deleteItemAsync('access_token');
      setIsMenuVisible(false);
      navigation.replace('Login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <View className="flex-1 bg-slate-900 px-6 pb-8 pt-16">
      {/* BOTÓN DE AYUDA */}
      <TouchableOpacity
        className="absolute top-16 right-6 w-10 h-10 bg-slate-800 rounded-full items-center justify-center z-10 active:bg-slate-700 border border-slate-700 shadow-lg"
        onPress={() => setIsHelpModalVisible(true)}
      >
        <Text className="text-slate-400 font-extrabold text-lg">?</Text>
      </TouchableOpacity>

      {/* CONTENEDOR PRINCIPAL */}
      <View className="flex-1 justify-center items-center w-full">
        <TouchableOpacity
          className="relative mb-8"
          onPress={() => setIsMenuVisible(true)}
          activeOpacity={0.8}
        >
          <View className="w-32 h-32 bg-slate-700 rounded-full items-center justify-center border-4 border-slate-600 shadow-xl shadow-black overflow-hidden">
            {userAvatar ? (
              <Image
                source={{ uri: userAvatar }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Text className="text-6xl text-white font-bold">
                {userName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View className="absolute bottom-0 right-0 bg-yellow-400 min-w-[40px] h-10 px-2 rounded-full items-center justify-center border-4 border-slate-900">
            <Text className="text-slate-900 font-extrabold text-sm">
              {points}
            </Text>
          </View>
        </TouchableOpacity>

        <View className="mb-12 items-center">
          <Text className="text-slate-400 text-xl mb-1 text-center">
            ¡Hola de nuevo!
          </Text>
          <Text className="text-5xl font-extrabold text-white text-center">
            {userName} 🤘
          </Text>
        </View>

        <AnimatedTouchableOpacity
          style={{ transform: [{ scale: breatheAnim }] }}
          className="bg-fuchsia-600 py-5 px-8 w-full rounded-2xl active:bg-fuchsia-700 shadow-lg shadow-fuchsia-900/50"
          onPress={() => navigation.navigate('CreateGame')}
        >
          <Text className="text-center text-white font-extrabold text-xl tracking-wide">
            Crear Nueva Partida
          </Text>
        </AnimatedTouchableOpacity>
      </View>

      <View className="bg-slate-800 border border-slate-700 rounded-xl h-24 items-center justify-center border-dashed mt-6">
        <Text className="text-slate-500 font-medium text-center px-4">
          Espacio reservado para Google AdMob
        </Text>
      </View>

      {/* MODAL DEL MENÚ DE PERFIL */}
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
                navigation.navigate('Profile');
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
                navigation.navigate('Settings');
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

      {/* MODAL DE AYUDA (CÓMO JUGAR) */}
      <Modal
        visible={isHelpModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsHelpModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center px-6">
          {/* 🔥 FIX: Le agregamos flex-shrink a la tarjeta principal */}
          <View className="bg-slate-800 w-full p-6 rounded-3xl border border-slate-700 max-h-[85%] shrink">
            <View className="items-center mb-6">
              <Text className="text-5xl mb-2">📖</Text>
              <Text className="text-2xl font-extrabold text-white text-center">
                Guía del Juego
              </Text>
            </View>

            {/* 🔥 FIX: Le sacamos el flex-1 y le pusimos shrink para que no colapse */}
            <ScrollView
              className="mb-6 w-full shrink"
              showsVerticalScrollIndicator={false}
            >
              <View className="mb-6 bg-slate-700/50 p-4 rounded-2xl border border-slate-600/50">
                <Text className="text-white font-bold text-lg mb-2">
                  🤔 ¿De qué se trata?
                </Text>
                <Text className="text-slate-300 leading-6">
                  Te mostramos una frase histórica, un diálogo de película, una
                  letra épica de rock o una cita famosa del fútbol. Tu objetivo
                  es adivinar{' '}
                  <Text className="font-bold text-white">¿Quién Dijo Qué?</Text>{' '}
                  eligiendo al autor correcto entre varias opciones.
                </Text>
              </View>

              <View className="mb-6 bg-yellow-500/10 p-4 rounded-2xl border border-yellow-500/30">
                <Text className="text-yellow-400 font-bold text-lg mb-2">
                  🏆 Sistema de Puntos
                </Text>
                <Text className="text-slate-300 leading-6">
                  Por cada respuesta correcta que metas, vas a sumar puntos
                  directos a tu cuenta. No hay penalización por equivocarse,
                  ¡así que mandate a adivinar si no la sabés!
                </Text>
              </View>

              <View className="mb-6 bg-fuchsia-500/10 p-4 rounded-2xl border border-fuchsia-500/30">
                <Text className="text-fuchsia-400 font-bold text-lg mb-2">
                  🔓 Categorías Premium
                </Text>
                <Text className="text-slate-300 leading-6">
                  Vas a notar que algunas categorías tienen un candado (🔒). Son
                  exclusivas. Podés usar los puntos que ganás jugando para
                  comprarlas y desbloquearlas para siempre en tu Perfil.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              className="bg-fuchsia-600 py-4 w-full rounded-xl items-center active:bg-fuchsia-700 shadow-lg"
              onPress={() => setIsHelpModalVisible(false)}
            >
              <Text className="text-white font-extrabold text-lg">
                ¡A jugar!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
