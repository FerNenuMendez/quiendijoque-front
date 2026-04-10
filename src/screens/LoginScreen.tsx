import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { apiClient } from '../api/client'; // Importamos nuestro cliente
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Para mostrar un spinner mientras carga

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, completá todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      // Le pegamos al endpoint que armaste en NestJS
      const response = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password: password,
      });

      Alert.alert(
        '¡Éxito!',
        `Bienvenido de vuelta, ${response.data.user.name} 🎸`,
      );
      navigation.replace('Home');
    } catch (error: any) {
      console.log('Error de login:', error.response?.data || error.message);
      Alert.alert(
        'Error al iniciar sesión',
        error.response?.data?.message ||
          'Revisá tus credenciales o tu conexión.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-8 bg-slate-900">
      <Text className="text-4xl font-extrabold text-white text-center mb-2">
        ¿Quién Dijo Qué? 🎸
      </Text>
      <Text className="text-slate-400 text-center mb-10 text-lg">
        Ingresá para jugar
      </Text>

      <View>
        <TextInput
          className="bg-slate-800 text-white px-4 py-4 rounded-xl border border-slate-700 mb-4 text-base"
          placeholder="Tu email (ej. fer@test.com)"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          className="bg-slate-800 text-white px-4 py-4 rounded-xl border border-slate-700 mb-6 text-base"
          placeholder="Tu contraseña"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          className={`py-4 rounded-xl items-center ${isLoading ? 'bg-green-800' : 'bg-green-500 active:bg-green-600'}`}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#0f172a" /> // Spinner nativo de carga
          ) : (
            <Text className="text-slate-900 font-bold text-lg">
              Entrar al Juego
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
