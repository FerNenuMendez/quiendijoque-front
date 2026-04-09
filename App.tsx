import './global.css';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-900">
      <Text className="text-3xl font-bold text-white mb-4">
        ¡Quién Dijo Qué! 🎸
      </Text>
      <Text className="text-lg text-green-400">
        Tailwind v4 está funcionando perfecto
      </Text>
    </View>
  );
}
