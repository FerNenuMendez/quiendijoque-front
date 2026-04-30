import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';

class AudioService {
  lobbyMusic: Audio.Sound | null = null;
  tictacMusic: Audio.Sound | null = null;

  // Variables en memoria para acceso ultrarrápido sin demoras
  isSoundEnabled = true;
  isVibrationEnabled = true;

  async init() {
    try {
      // 1. Levantamos la configuración guardada del usuario (si existe)
      const savedSound = await SecureStore.getItemAsync('setting_sound');
      const savedVib = await SecureStore.getItemAsync('setting_vibration');

      // Si es null, por defecto es true. Si no, lo convertimos a booleano.
      this.isSoundEnabled = savedSound === null ? true : savedSound === 'true';
      this.isVibrationEnabled = savedVib === null ? true : savedVib === 'true';

      // 2. Configuramos el motor de audio en el celular
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // 🔥 ESTO ES CLAVE: Apaga o prende TODO el motor de audio de golpe
      await Audio.setIsEnabledAsync(this.isSoundEnabled);

      // 3. Precargamos los sonidos
      if (!this.lobbyMusic) {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/lobby.mp3'),
          { isLooping: true, volume: 0.4 },
        );
        this.lobbyMusic = sound;
      }

      if (!this.tictacMusic) {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/tictac.mp3'),
          { isLooping: true, volume: 0.7 },
        );
        this.tictacMusic = sound;
      }
    } catch (error) {
      console.error('Error inicializando AudioService:', error);
    }
  }

  // ==========================================
  // FUNCIONES PARA LA PANTALLA DE AJUSTES
  // ==========================================
  async toggleSound(enabled: boolean) {
    this.isSoundEnabled = enabled;
    await SecureStore.setItemAsync('setting_sound', String(enabled));

    // Corta o activa el audio a nivel hardware
    await Audio.setIsEnabledAsync(enabled);

    // Si el usuario prende el sonido, forzamos a que el lobby arranque a sonar
    if (enabled && this.lobbyMusic) {
      await this.lobbyMusic.playAsync();
    }
  }

  async toggleVibration(enabled: boolean) {
    this.isVibrationEnabled = enabled;
    await SecureStore.setItemAsync('setting_vibration', String(enabled));
  }

  // ==========================================
  // CONTROLES DE MÚSICA
  // ==========================================
  async playLobby() {
    if (!this.isSoundEnabled) return;
    if (!this.lobbyMusic) await this.init();
    await this.lobbyMusic?.playAsync();
  }

  async stopLobby() {
    await this.lobbyMusic?.pauseAsync();
  }

  async playTicTac() {
    if (!this.isSoundEnabled) return;
    if (!this.tictacMusic) await this.init();
    await this.tictacMusic?.replayAsync();
  }

  async stopTicTac() {
    await this.tictacMusic?.stopAsync();
  }
}

export const audioService = new AudioService();
