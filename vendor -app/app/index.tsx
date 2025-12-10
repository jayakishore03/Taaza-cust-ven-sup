import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { hasSeenIntro } from '@/utils/introStorage';

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkIntroStatus();
  }, []);

  const checkIntroStatus = async () => {
    try {
      const introSeen = await hasSeenIntro();
      
      if (introSeen) {
        // User has already seen the intro, go directly to login
        router.replace('/(auth)/login');
      } else {
        // First time user, show intro video
        router.replace('/intro');
      }
    } catch (error) {
      console.error('Error checking intro status:', error);
      // On error, show intro to be safe
      router.replace('/intro');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <ActivityIndicator size="large" color="#fff" />
      </View>
  );
}

