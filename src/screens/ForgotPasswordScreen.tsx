import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');

  const handleReset = () => {
    // TODO: Conectar con el backend en el futuro
    Alert.alert(
      '¡En desarrollo!',
      `Pronto te enviaremos un link a ${email} para recuperar tu clave.`,
    );
    navigation.navigate('Login');
  };

  return (
    <View className="flex-1 justify-center px-8 bg-slate-900">
      <Text className="text-3xl font-extrabold text-white text-center mb-2">
        Recuperar Clave 🔐
      </Text>
      <Text className="text-slate-400 text-center mb-8 text-base">
        Ingresá tu email y te mandamos las instrucciones.
      </Text>

      <TextInput
        className="bg-slate-800 text-white px-4 py-4 rounded-xl border border-slate-700 mb-6"
        placeholder="Tu email"
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity
        className="bg-blue-500 py-4 rounded-xl items-center active:bg-blue-600 mb-6"
        onPress={handleReset}
      >
        <Text className="text-white font-bold text-lg">
          Enviar link de recuperación
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text className="text-center text-slate-400">Volver al Login</Text>
      </TouchableOpacity>
    </View>
  );
}
