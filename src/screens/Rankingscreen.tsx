import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Share, // 🔥 Importamos el motor nativo de compartir
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';

interface Player {
  _id?: string;
  id?: string;
  username: string;
  avatar: string | null;
  totalPoints: number;
}

export default function RankingScreen() {
  const navigation = useNavigation<any>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [userPoints, setUserPoints] = useState(0); // 🔥 Guardamos los puntos del jugador
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔥 Traemos el ranking y los datos del usuario al mismo tiempo para no hacerlo esperar
        const [rankingResponse, userResponse] = await Promise.all([
          apiClient.get('/users/ranking'),
          apiClient.get('/users/me'),
        ]);

        setPlayers(rankingResponse.data);
        setUserPoints(userResponse.data.user?.totalPoints || 0);
      } catch (error) {
        console.error('Error al cargar datos del ranking:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🔥 Función mágica para compartir en WhatsApp/Instagram
  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Ya sumé ${userPoints} puntos en el Top Global de ¿Quién Dijo Qué?! 🏆 ¿Podés superarme? Descargate la app y demostralo.`,
      });
    } catch (error) {
      console.error('Error al compartir', error);
    }
  };

  const renderPlayer = ({ item, index }: { item: Player; index: number }) => {
    let positionStyle = 'text-slate-400';
    let borderStyle = 'border-slate-700 bg-slate-800';
    let medal = `${index + 1}`;

    if (index === 0) {
      positionStyle = 'text-yellow-400 font-black';
      borderStyle = 'border-yellow-500/50 bg-yellow-500/10';
      medal = '🥇';
    } else if (index === 1) {
      positionStyle = 'text-slate-300 font-black';
      borderStyle = 'border-slate-300/50 bg-slate-300/10';
      medal = '🥈';
    } else if (index === 2) {
      positionStyle = 'text-orange-400 font-black';
      borderStyle = 'border-orange-400/50 bg-orange-400/10';
      medal = '🥉';
    }

    return (
      <View
        className={`flex-row items-center p-4 mb-3 rounded-2xl border ${borderStyle}`}
      >
        <View className="w-10 items-center justify-center mr-2">
          <Text className={`text-xl font-bold ${positionStyle}`}>{medal}</Text>
        </View>

        {item.avatar ? (
          <Image
            source={{ uri: item.avatar }}
            className="w-12 h-12 rounded-full border-2 border-slate-600 mr-4"
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-slate-700 items-center justify-center mr-4 border-2 border-slate-600">
            <Text className="text-white font-bold text-lg">
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <Text className="text-white font-bold text-lg" numberOfLines={1}>
            {item.username}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-fuchsia-400 font-black text-xl">
            {item.totalPoints}
          </Text>
          <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            PTS
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-900 pt-16">
      <View className="flex-1 px-6">
        {/* HEADER */}
        <View className="flex-row items-center mb-8">
          <TouchableOpacity
            className="w-12 h-12 bg-slate-800 rounded-full items-center justify-center mr-4 active:bg-slate-700 border border-slate-700"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white text-2xl font-bold">←</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-extrabold text-white flex-1">
            Top Global 🏆
          </Text>
        </View>

        {/* LISTA DEL RANKING */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#d946ef" />
          </View>
        ) : (
          <FlatList
            data={players}
            keyExtractor={(item, index) => {
              const id = item._id || item.id;
              return id ? id.toString() : index.toString();
            }}
            renderItem={renderPlayer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <Text className="text-slate-400 text-center mt-10">
                Aún no hay jugadores en el ranking.
              </Text>
            }
          />
        )}
      </View>

      {/* 🔥 FOOTER FIJO: COMPARTIR Y PUBLICIDAD */}
      <View className="px-6 pb-8 pt-4 bg-slate-900 border-t border-slate-800/50">
        <TouchableOpacity
          className="bg-fuchsia-600 py-4 w-full rounded-2xl flex-row justify-center items-center active:bg-fuchsia-700 shadow-lg shadow-fuchsia-900/50 mb-4"
          onPress={handleShare}
        >
          <Text className="text-white font-extrabold text-lg mr-2">
            📲 Compartir mi puntaje
          </Text>
        </TouchableOpacity>

        <View className="w-full bg-slate-800 border border-slate-700 rounded-xl h-24 items-center justify-center border-dashed">
          <Text className="text-slate-500 font-medium text-center px-4">
            Espacio reservado para Google AdMob
          </Text>
        </View>
      </View>
    </View>
  );
}
