import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();

  // Separamos nombre real y apodo para cumplir con el DTO exacto
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // Validamos los 4 campos
    if (!name || !username || !email || !password) {
      Alert.alert('Error', 'Completá todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      // Mandamos la pieza de Tetris perfecta
      await apiClient.post('/auth/register', {
        name,
        username,
        email: email.trim().toLowerCase(),
        password,
      });

      // Alerta a prueba de crasheos (espera el OK para cambiar de pantalla)
      Alert.alert('¡Cuenta creada!', 'Ya podés iniciar sesión con tus datos.', [
        {
          text: 'Excelente',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;

      const alertText = Array.isArray(backendMessage)
        ? backendMessage.join('\n')
        : backendMessage || 'Hubo un problema, intentá de nuevo.';

      Alert.alert('Aviso', alertText);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-8 bg-slate-900">
      <Text className="text-3xl font-extrabold text-white text-center mb-2">
        Crear Cuenta 🎸
      </Text>
      <Text className="text-slate-400 text-center mb-8 text-lg">
        Sumate a Quién Dijo Qué
      </Text>

      {/* INPUT 1: Nombre Completo */}
      <TextInput
        className="bg-slate-800 text-white px-4 py-4 rounded-xl border border-slate-700 mb-4"
        placeholder="Tu nombre real"
        placeholderTextColor="#94a3b8"
        value={name}
        onChangeText={setName}
      />

      {/* INPUT 2: Username (Apodo) */}
      <TextInput
        className="bg-slate-800 text-white px-4 py-4 rounded-xl border border-slate-700 mb-4"
        placeholder="Tu apodo (ej. Nenu_99)"
        placeholderTextColor="#94a3b8"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      {/* INPUT 3: Email */}
      <TextInput
        className="bg-slate-800 text-white px-4 py-4 rounded-xl border border-slate-700 mb-4"
        placeholder="Tu email"
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {/* INPUT 4: Contraseña */}
      <TextInput
        className="bg-slate-800 text-white px-4 py-4 rounded-xl border border-slate-700 mb-8"
        placeholder="Tu contraseña (mínimo 6 letras)"
        placeholderTextColor="#94a3b8"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        className={`py-4 rounded-xl items-center mb-6 ${isLoading ? 'bg-green-800' : 'bg-green-500 active:bg-green-600'}`}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#0f172a" />
        ) : (
          <Text className="text-slate-900 font-bold text-lg">Registrarme</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text className="text-center text-slate-400">
          ¿Ya tenés cuenta?{' '}
          <Text className="text-green-400 font-bold">Iniciá sesión</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
