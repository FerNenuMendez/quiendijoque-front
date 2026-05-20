import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { audioService } from '../services/AudioService';

export const useGameAudio = () => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playSound = async (type: 'correct' | 'wrong' | 'win' | 'level') => {
    if (!audioService.isSoundEnabled) return;

    try {
      let soundSource;
      if (type === 'correct')
        soundSource = require('../../assets/sounds/correcto.mp3');
      else if (type === 'wrong')
        soundSource = require('../../assets/sounds/error.mp3');
      else if (type === 'win')
        soundSource = require('../../assets/sounds/aplausos.mp3');
      else if (type === 'level')
        soundSource = require('../../assets/sounds/levelUp.mp3');

      const { sound: newSound } = await Audio.Sound.createAsync(soundSource);
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.log('Error reproduciendo sonido:', error);
    }
  };

  const triggerHaptic = (type: 'success' | 'error') => {
    if (!audioService.isVibrationEnabled) return;

    if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const playLobbyMusic = () => {
    audioService.stopTicTac();
    audioService.playLobby();
  };

  const playTicTacMusic = () => {
    audioService.stopLobby();
    audioService.playTicTac();
  };

  const stopTicTacMusic = () => {
    audioService.stopTicTac();
  };

  return {
    playSound,
    triggerHaptic,
    playLobbyMusic,
    playTicTacMusic,
    stopTicTacMusic,
  };
};
