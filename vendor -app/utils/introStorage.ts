import AsyncStorage from '@react-native-async-storage/async-storage';

const INTRO_SEEN_KEY = 'intro_seen';

/**
 * Mark the intro video as seen
 */
export const markIntroAsSeen = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(INTRO_SEEN_KEY, 'true');
  } catch (error) {
    console.error('Error marking intro as seen:', error);
  }
};

/**
 * Check if the intro video has been seen
 */
export const hasSeenIntro = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(INTRO_SEEN_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking intro status:', error);
    return false;
  }
};

/**
 * Reset intro status (useful for testing)
 */
export const resetIntro = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(INTRO_SEEN_KEY);
    console.log('Intro status reset successfully');
  } catch (error) {
    console.error('Error resetting intro status:', error);
  }
};

