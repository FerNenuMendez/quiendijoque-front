import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { audioService } from '../services/AudioService';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();

  // Estados de Ajustes
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);

  // Estados para Modal de Contraseña
  const [isPassModalVisible, setIsPassModalVisible] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '' });
  const [isSavingPass, setIsSavingPass] = useState(false);

  // Estado para Modal de Términos
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);

  // 🔥 1. Sincronizamos los switches con el estado real del servicio al abrir la pantalla
  useEffect(() => {
    setIsSoundEnabled(audioService.isSoundEnabled);
    setIsVibrationEnabled(audioService.isVibrationEnabled);
  }, []);

  // 🔥 2. Funciones que controlan la UI y le avisan al servicio global
  const handleToggleSound = async (value: boolean) => {
    setIsSoundEnabled(value); // Movemos el switch visualmente al instante
    await audioService.toggleSound(value); // El cerebro global apaga/prende el audio y lo guarda
  };

  const handleToggleVibration = async (value: boolean) => {
    setIsVibrationEnabled(value); // Movemos el switch
    await audioService.toggleVibration(value); // El cerebro global guarda la preferencia
  };

  const handleChangePassword = async () => {
    if (passwords.new.length < 6) {
      Alert.alert(
        'Error',
        'La nueva contraseña debe tener al menos 6 caracteres.',
      );
      return;
    }
    setIsSavingPass(true);
    try {
      await apiClient.patch('/users/me/password', {
        oldPassword: passwords.old,
        newPassword: passwords.new,
      });
      Alert.alert('¡Éxito!', 'Contraseña cambiada correctamente.');
      setIsPassModalVisible(false);
      setPasswords({ old: '', new: '' });
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo cambiar la contraseña',
      );
    } finally {
      setIsSavingPass(false);
    }
  };

  const SettingRow = ({
    label,
    icon,
    value,
    onValueChange,
    type = 'switch',
    onPress,
  }: any) => (
    <View className="flex-row items-center justify-between bg-slate-800 p-4 rounded-2xl mb-3 border border-slate-700">
      <View className="flex-row items-center">
        <Text className="text-xl mr-3">{icon}</Text>
        <Text className="text-white text-lg font-medium">{label}</Text>
      </View>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#334155', true: '#d946ef' }}
          thumbColor="#f8fafc"
        />
      ) : (
        <TouchableOpacity onPress={onPress}>
          <Text className="text-fuchsia-500 font-bold">Configurar ›</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-slate-900 pt-16">
      <ScrollView className="flex-1 px-6">
        {/* HEADER */}
        <View className="flex-row items-center mb-8">
          <TouchableOpacity
            className="w-12 h-12 bg-slate-800 rounded-full items-center justify-center mr-4 active:bg-slate-700 border border-slate-700"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white text-2xl font-bold">←</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-extrabold text-white">Ajustes</Text>
        </View>

        {/* SECCIÓN JUEGO */}
        <Text className="text-slate-500 font-bold uppercase tracking-widest mb-3 ml-1">
          Sonido y Sensaciones
        </Text>
        <SettingRow
          label="Efectos de Sonido"
          icon="🔊"
          value={isSoundEnabled}
          onValueChange={handleToggleSound} // 🔥 Conectado al nuevo handler
        />
        <SettingRow
          label="Vibración Háptica"
          icon="📳"
          value={isVibrationEnabled}
          onValueChange={handleToggleVibration} // 🔥 Conectado al nuevo handler
        />

        {/* SECCIÓN CUENTA */}
        <Text className="text-slate-500 font-bold uppercase tracking-widest mt-6 mb-3 ml-1">
          Seguridad
        </Text>
        <SettingRow
          label="Cambiar Contraseña"
          icon="🔐"
          type="button"
          onPress={() => setIsPassModalVisible(true)}
        />

        {/* SECCIÓN SOPORTE */}
        <Text className="text-slate-500 font-bold uppercase tracking-widest mt-6 mb-3 ml-1">
          Acerca de
        </Text>

        <TouchableOpacity
          className="bg-slate-800 p-4 rounded-2xl mb-3 border border-slate-700"
          onPress={() => setIsTermsModalVisible(true)}
        >
          <Text className="text-white text-lg">📄 Términos y Condiciones</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-red-500/10 p-4 rounded-2xl mb-3 border border-red-500/50"
          onPress={() =>
            Alert.alert(
              'Eliminar Cuenta',
              'Esta acción es irreversible. ¿Estás seguro?',
              [
                { text: 'Cancelar' },
                { text: 'Eliminar', style: 'destructive' },
              ],
            )
          }
        >
          <Text className="text-red-400 text-lg font-bold">
            🗑️ Eliminar mi cuenta
          </Text>
        </TouchableOpacity>

        <Text className="text-center text-slate-600 mt-4 mb-10">
          Versión 1.0.0-beta
        </Text>
      </ScrollView>

      {/* BANNER FIJO ABAJO */}
      <View className="px-6 pb-8 pt-4 bg-slate-900 border-t border-slate-800/50">
        <View className="w-full bg-slate-800 border border-slate-700 rounded-xl h-24 items-center justify-center border-dashed">
          <Text className="text-slate-500 font-medium text-center px-4">
            Espacio reservado para Google AdMob
          </Text>
        </View>
      </View>

      {/* =========================================
          MODAL CAMBIO CONTRASEÑA
          ========================================= */}
      <Modal visible={isPassModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center px-6">
          <View className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
            <Text className="text-white text-2xl font-bold mb-6">
              Cambiar Contraseña
            </Text>

            <TextInput
              secureTextEntry
              placeholder="Contraseña actual"
              placeholderTextColor="#64748b"
              className="bg-slate-900 text-white p-4 rounded-xl mb-4 border border-slate-700"
              value={passwords.old}
              onChangeText={(t) => setPasswords({ ...passwords, old: t })}
            />
            <TextInput
              secureTextEntry
              placeholder="Nueva contraseña"
              placeholderTextColor="#64748b"
              className="bg-slate-900 text-white p-4 rounded-xl mb-6 border border-slate-700"
              value={passwords.new}
              onChangeText={(t) => setPasswords({ ...passwords, new: t })}
            />

            <TouchableOpacity
              className="bg-fuchsia-600 py-4 rounded-xl mb-3"
              onPress={handleChangePassword}
              disabled={isSavingPass}
            >
              <Text className="text-white text-center font-bold">
                {isSavingPass ? 'Guardando...' : 'Actualizar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsPassModalVisible(false)}>
              <Text className="text-slate-400 text-center py-2">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =========================================
          🔥 MODAL DE TÉRMINOS Y CONDICIONES
          ========================================= */}
      <Modal
        visible={isTermsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsTermsModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-slate-800 h-[80%] rounded-t-3xl border-t border-slate-700 p-6 shadow-2xl">
            <View className="w-12 h-1.5 bg-slate-600 rounded-full self-center mb-6" />
            <Text className="text-2xl font-extrabold text-white mb-4">
              Términos y Condiciones
            </Text>

            <ScrollView
              className="flex-1 mb-6"
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-slate-300 text-base leading-6 mb-4">
                <Text className="font-bold text-white">
                  1. Aceptación de los Términos
                </Text>
                {'\n'}
                Al descargar, instalar o utilizar esta aplicación de trivia,
                aceptas estar sujeto a estos Términos y Condiciones. Si no estás
                de acuerdo, te pedimos que no utilices la plataforma.
              </Text>

              <Text className="text-slate-300 text-base leading-6 mb-4">
                <Text className="font-bold text-white">
                  2. Cuentas de Usuario
                </Text>
                {'\n'}
                Para guardar tu progreso y puntos, necesitás crear una cuenta.
                Sos responsable de mantener la confidencialidad de tu contraseña
                y de todas las actividades que ocurran bajo tu cuenta.
              </Text>

              <Text className="text-slate-300 text-base leading-6 mb-4">
                <Text className="font-bold text-white">
                  3. Puntos y Categorías Premium
                </Text>
                {'\n'}
                El juego otorga "puntos" virtuales por respuestas correctas.
                Estos puntos pueden canjearse por "Categorías Premium". Estos
                puntos no tienen valor monetario real, no son transferibles y no
                pueden canjearse por dinero en efectivo.
              </Text>

              <Text className="text-slate-300 text-base leading-6 mb-4">
                <Text className="font-bold text-white">
                  4. Propiedad Intelectual
                </Text>
                {'\n'}
                Todo el contenido, diseño, logotipos y código de la aplicación
                son propiedad intelectual exclusiva de los desarrolladores. Las
                frases y citas utilizadas en las trivias pertenecen a sus
                respectivos autores.
              </Text>

              <Text className="text-slate-300 text-base leading-6 mb-4">
                <Text className="font-bold text-white">
                  5. Privacidad y Datos
                </Text>
                {'\n'}
                Recopilamos información básica (como correo electrónico y nombre
                de usuario) exclusivamente para el funcionamiento de tu cuenta.
                No vendemos tus datos a terceros.
              </Text>

              <Text className="text-slate-300 text-base leading-6 mb-8">
                <Text className="font-bold text-white">6. Modificaciones</Text>
                {'\n'}
                Nos reservamos el derecho de modificar estos términos en
                cualquier momento. El uso continuado de la aplicación implica la
                aceptación de dichos cambios.
              </Text>
            </ScrollView>

            <TouchableOpacity
              className="bg-fuchsia-600 py-4 rounded-xl items-center shadow-lg active:bg-fuchsia-700"
              onPress={() => setIsTermsModalVisible(false)}
            >
              <Text className="text-white font-extrabold text-lg">
                Entendido y Aceptado
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
