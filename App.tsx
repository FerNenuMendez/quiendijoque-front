import './global.css';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store'; // 🔥 Actualizado a SecureStore

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

// 🔥 Importamos las pantallas nuevas del juego
import CreateGameScreen from './src/screens/CreateGameScreen';
import GameRoundScreen from './src/screens/GameRoundScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    // Revisamos si el celular tiene la sesión guardada
    const checkSession = async () => {
      try {
        // Buscamos con la misma llave exacta que usamos en el LoginScreen
        const userSession = await SecureStore.getItemAsync('user_session');
        if (userSession) {
          setInitialRoute('Home'); // Si hay sesión, salteamos el Login
        }
      } catch (e) {
        console.error('Error leyendo la sesión', e);
      } finally {
        setIsLoading(false); // Sacamos el spinner
      }
    };

    checkSession();
  }, []);

  // Pantalla de carga mientras lee el almacenamiento del celular
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <ActivityIndicator size="large" color="#d946ef" />
        {/* Le puse el color fucsia de tu diseño */}
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />

        {/* 🔥 Registramos las nuevas pantallas en el mapa */}
        <Stack.Screen name="CreateGame" component={CreateGameScreen} />
        <Stack.Screen name="GameRound" component={GameRoundScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
