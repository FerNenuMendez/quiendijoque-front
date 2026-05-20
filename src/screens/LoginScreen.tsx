import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../api/client';
// IMPORTS PARA GOOGLE LOGIN
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

// Esto es necesario para que el navegador interno se cierre solo cuando el usuario termina de loguearse
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ====================================================================
  // 1. GENERAMOS LA RUTA SEGURA (EL PUENTE)
  // ====================================================================
  const redirectUri = makeRedirectUri();

  // El chismoso: Imprimimos la ruta exacta en tu consola de Expo
  useEffect(() => {
    console.log(
      '🚨 COPIÁ ESTA RUTA EN GOOGLE CLOUD (URI de redireccionamiento):',
      redirectUri,
    );
  }, [redirectUri]);

  // ====================================================================
  // CONFIGURACIÓN DE GOOGLE EXPO
  // ====================================================================
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:
      '52721536518-4ktpvopi9cv0ramfcgqiu3lllh60oe9p.apps.googleusercontent.com', // Si usas web (Expo Go o navegador)
    iosClientId:
      '52721536518-eu4e9v9lqk5i1bnpmnrhhnjc0gv2lbn3.apps.googleusercontent.com', // Si usas iPhone
    redirectUri: redirectUri, // 🔥 Acá le inyectamos el puente a Google
  });

  // Este useEffect "escucha" cuando el usuario vuelve de la ventanita de Google
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        sendGoogleTokenToBackend(authentication.idToken);
      } else {
        Alert.alert('Error', 'Google no devolvió el token de identidad.');
      }
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'Hubo un problema de comunicación con Google.');
    }
  }, [response]);

  // ====================================================================
  // LÓGICA DE LOGIN
  // ====================================================================
  const sendGoogleTokenToBackend = async (idToken: string) => {
    setIsLoading(true);
    try {
      // Le pegamos al endpoint que armamos en NestJS
      const backendResponse = await apiClient.post('/auth/google/mobile', {
        token: idToken,
      });

      // Guardamos la sesión exactamente igual que en el login clásico
      await SecureStore.setItemAsync(
        'user_session',
        JSON.stringify(backendResponse.data.user),
      );

      // 🔥 GUARDAMOS EL TOKEN
      if (backendResponse.data.token) {
        await SecureStore.setItemAsync('jwt_token', backendResponse.data.token);
      }

      Alert.alert(
        '¡Éxito!',
        `Bienvenido, ${backendResponse.data.user.name} 🎸`,
      );
      navigation.replace('Home');
    } catch (error: any) {
      Alert.alert(
        'Error de Autenticación',
        error.response?.data?.message ||
          'No se pudo validar el usuario con el servidor.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTraditionalLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Completá todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Le pegamos a la NUEVA ruta móvil
      const response = await apiClient.post('/auth/login/mobile', {
        email: email.trim().toLowerCase(),
        password: password,
      });

      // 2. Guardamos los datos del usuario
      await SecureStore.setItemAsync(
        'user_session',
        JSON.stringify(response.data.user),
      );

      // 3. 🔥 GUARDAMOS EL TOKEN
      await SecureStore.setItemAsync('jwt_token', response.data.token);

      Alert.alert(
        '¡Éxito!',
        `Bienvenido de vuelta, ${response.data.user.name} 🎸`,
      );
      navigation.replace('Home');
    } catch (error: any) {
      Alert.alert(
        'Error al iniciar sesión',
        error.response?.data?.message ||
          'Credenciales incorrectas o problema de red.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-8 bg-slate-900">
      <Text className="text-4xl font-extrabold text-white text-center mb-2">
        ¡Bienvenido! 🤘
      </Text>
      <Text className="text-slate-400 text-center mb-10 text-lg">
        Ingresá para seguir jugando
      </Text>

      {/* INPUTS DE EMAIL Y CONTRASEÑA */}
      <TextInput
        className="bg-slate-800 text-white px-4 py-4 rounded-xl border border-slate-700 mb-4"
        placeholder="Tu email"
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        className="bg-slate-800 text-white px-4 py-4 rounded-xl border border-slate-700 mb-6"
        placeholder="Tu contraseña"
        placeholderTextColor="#94a3b8"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* BOTÓN DE LOGIN NORMAL */}
      <TouchableOpacity
        className={`py-4 rounded-xl items-center ${isLoading ? 'bg-green-800' : 'bg-green-500 active:bg-green-600'}`}
        onPress={handleTraditionalLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#0f172a" />
        ) : (
          <Text className="text-slate-900 font-bold text-lg">
            Entrar al Juego
          </Text>
        )}
      </TouchableOpacity>

      {/* SEPARADOR VISUAL */}
      <View className="flex-row items-center my-6">
        <View className="flex-1 h-[1px] bg-slate-700" />
        <Text className="text-slate-500 mx-4 font-semibold">O</Text>
        <View className="flex-1 h-[1px] bg-slate-700" />
      </View>

      {/* BOTÓN DE LOGIN CON GOOGLE */}
      <TouchableOpacity
        className={`bg-white py-4 rounded-xl items-center flex-row justify-center active:bg-slate-200 mb-6 shadow-sm ${!request ? 'opacity-50' : ''}`}
        disabled={!request || isLoading}
        onPress={() => {
          //promptAsync();
          Alert.alert('Próximamente', 'Disponible en la versión final');
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          <>
            <Text className="font-extrabold text-xl mr-3 text-blue-600">G</Text>
            <Text className="text-slate-900 font-extrabold text-lg">
              Continuar con Google
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* ENLACES AL REGISTRO Y RECUPERAR CLAVE */}
      <View className="mt-4 flex-row justify-center">
        <Text className="text-slate-400 text-base">¿No tenés cuenta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text className="text-green-400 font-bold text-base">Registrate</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="mt-6"
        onPress={() => navigation.navigate('ForgotPassword')}
      >
        <Text className="text-center text-slate-500 underline text-base">
          Olvidé mi contraseña
        </Text>
      </TouchableOpacity>
    </View>
  );
}
