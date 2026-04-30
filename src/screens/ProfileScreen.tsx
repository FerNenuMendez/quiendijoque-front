import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [userRes, catRes] = await Promise.all([
        apiClient.get('/users/me'),
        apiClient.get('/categories'),
      ]);

      setUser(userRes.data.user);
      setNewName(userRes.data.user.username || userRes.data.user.name);
      setCategories(catRes.data);
    } catch (error) {
      Alert.alert('Error', 'No pudimos cargar tu perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (newName.trim().length < 3) {
      Alert.alert('Ey', 'El nombre debe tener al menos 3 letras.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedName = newName.trim();

      await apiClient.patch('/users/me/username', { username: updatedName });
      setUser({ ...user, username: updatedName });

      const sessionString = await SecureStore.getItemAsync('user_session');
      if (sessionString) {
        const sessionUser = JSON.parse(sessionString);
        sessionUser.username = updatedName;
        await SecureStore.setItemAsync(
          'user_session',
          JSON.stringify(sessionUser),
        );
      }

      setIsEditingName(false);
      Alert.alert('¡Genial!', 'Tu nombre fue actualizado.');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al guardar el nombre';
      Alert.alert('Ups', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        'Permiso denegado',
        'Necesitamos acceso a tus fotos para cambiar el avatar.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      uploadAvatar(base64Image);
    }
  };

  const uploadAvatar = async (base64String: string) => {
    setIsUploadingAvatar(true);
    try {
      await apiClient.patch('/users/me/avatar', { avatar: base64String });

      setUser((prev: any) => ({ ...prev, avatar: base64String }));

      const sessionString = await SecureStore.getItemAsync('user_session');
      if (sessionString) {
        const sessionUser = JSON.parse(sessionString);
        sessionUser.avatar = base64String;
        await SecureStore.setItemAsync(
          'user_session',
          JSON.stringify(sessionUser),
        );
      }

      Alert.alert('¡Éxito!', 'Foto de perfil actualizada.');
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al subir la imagen.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'rock':
        return '🎸';
      case 'cine-y-series':
        return '🍿';
      case 'futbol':
        return '⚽';
      case 'series-de-tv':
        return '📺';
      default:
        return '🎲';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#d946ef" />
      </View>
    );
  }

  const unlockedCategoriesList = categories.filter((cat) =>
    user?.unlockedCategories?.includes(cat._id || cat.id),
  );

  return (
    // 🔥 1. CAMBIAMOS EL CONTENEDOR PRINCIPAL A VIEW
    <View className="flex-1 bg-slate-900 pt-16">
      {/* 🔥 2. DEJAMOS EL SCROLLVIEW SOLO PARA EL CONTENIDO */}
      <ScrollView className="flex-1 px-6">
        {/* HEADER */}
        <View className="flex-row items-center mb-10">
          <TouchableOpacity
            className="w-12 h-12 bg-slate-800 rounded-full items-center justify-center mr-4 active:bg-slate-700 border border-slate-700"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white text-2xl font-bold">←</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-extrabold text-white">Mi Perfil</Text>
        </View>

        {/* AVATAR Y NOMBRE */}
        <View className="items-center mb-10">
          <TouchableOpacity
            onPress={handlePickAvatar}
            disabled={isUploadingAvatar}
            className="relative w-32 h-32 bg-slate-700 rounded-full items-center justify-center border-4 border-slate-600 shadow-xl shadow-black mb-6 overflow-hidden active:opacity-80"
          >
            {isUploadingAvatar ? (
              <ActivityIndicator size="large" color="#d946ef" />
            ) : user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Text className="text-6xl text-white font-bold">
                {(user?.username || user?.name || 'J').charAt(0).toUpperCase()}
              </Text>
            )}

            {!isUploadingAvatar && (
              <View className="absolute bottom-0 w-full bg-black/50 py-1 items-center">
                <Text className="text-xs text-white">📷</Text>
              </View>
            )}
          </TouchableOpacity>

          {isEditingName ? (
            <View className="w-full flex-row items-center bg-slate-800 rounded-2xl px-4 py-2 border border-fuchsia-500">
              <TextInput
                value={newName}
                onChangeText={setNewName}
                className="flex-1 text-white text-xl font-bold py-2"
                placeholderTextColor="#94a3b8"
                autoFocus
              />
              <TouchableOpacity
                onPress={handleSaveName}
                disabled={isSaving}
                className="bg-fuchsia-600 px-4 py-2 rounded-xl ml-2"
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white font-bold">Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-center justify-center">
              <Text className="text-4xl font-extrabold text-white mr-3">
                {user?.username || user?.name || 'Jugador'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditingName(true)}
                className="bg-slate-800 p-2 rounded-full border border-slate-700"
              >
                <Text className="text-lg">✏️</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text className="text-slate-500 mt-2">{user?.email}</Text>
        </View>

        {/* ESTADÍSTICAS */}
        <View className="bg-slate-800 rounded-3xl p-6 mb-8 border border-slate-700 flex-row justify-between items-center shadow-lg">
          <View>
            <Text className="text-slate-400 font-bold mb-1">Puntaje Total</Text>
            <Text className="text-4xl font-black text-yellow-400">
              {user?.totalPoints || 0}
            </Text>
          </View>
          <Text className="text-6xl">🏆</Text>
        </View>

        {/* CATEGORÍAS DESBLOQUEADAS */}
        <Text className="text-white text-xl font-bold mb-4">
          Mis Categorías Premium
        </Text>

        {unlockedCategoriesList.length === 0 ? (
          <View className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 border-dashed items-center mb-6">
            <Text className="text-4xl mb-2">🛒</Text>
            <Text className="text-slate-400 text-center">
              Todavía no compraste ninguna categoría. ¡Jugá para sumar puntos y
              desbloquear contenido exclusivo!
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between w-full mb-6">
            {unlockedCategoriesList.map((cat) => (
              <View
                key={cat._id || cat.id}
                className="w-[48%] bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700 items-center shadow-md"
              >
                <Text className="text-4xl mb-2">
                  {getCategoryIcon(cat.slug)}
                </Text>
                <Text className="text-white font-bold text-center">
                  {cat.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Espaciador al final del scroll para que no quede pegado al banner */}
        <View className="h-6" />
      </ScrollView>

      {/* 🔥 3. PONEMOS EL BANNER DE ADMOB AFUERA DEL SCROLLVIEW, PEGADO AL FONDO */}
      <View className="px-6 pb-8 pt-4 bg-slate-900 border-t border-slate-800/50">
        <View className="w-full bg-slate-800 border border-slate-700 rounded-xl h-24 items-center justify-center border-dashed">
          <Text className="text-slate-500 font-medium text-center px-4">
            Espacio reservado para Google AdMob
          </Text>
        </View>
      </View>
    </View>
  );
}
