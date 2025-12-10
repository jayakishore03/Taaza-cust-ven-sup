import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { markIntroAsSeen } from '@/utils/introStorage';

const videoSource = require('../assets/images/intovid.mp4');

export default function IntroScreen() {
  const router = useRouter();
  const hasNavigated = useRef(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);
  
  const { width, height } = dimensions;
  
  // Calculate smaller video size (70% of screen)
  const videoWidth = width * 0.7;
  const videoHeight = height * 0.7;
  
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.muted = false;
    player.playbackRate = 1.2; // Slightly increase playback speed (20% faster)
    player.play();
  });

  const navigateToLogin = useCallback(async () => {
    if (!hasNavigated.current) {
      hasNavigated.current = true;
      console.log('Navigating to login...');
      
      // Clear interval
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      
      await markIntroAsSeen();
      router.replace('/(auth)/login');
    }
  }, [router]);

  useEffect(() => {
    // Method 1: Status change listener
    const statusSubscription = player.addListener('statusChange', (status, oldStatus) => {
      console.log('Status changed:', oldStatus, '->', status);
      if (status === 'idle' && player.currentTime > 0) {
        console.log('Video ended (status change)');
        navigateToLogin();
      }
    });

    // Method 2: Playing change listener
    const playingSubscription = player.addListener('playingChange', (isPlaying) => {
      console.log('Playing changed:', isPlaying, 'currentTime:', player.currentTime, 'duration:', player.duration);
      if (!isPlaying && player.currentTime > 0 && player.duration > 0) {
        if (player.currentTime >= player.duration - 0.5) {
          console.log('Video ended (playing change)');
          navigateToLogin();
        }
      }
    });

    // Method 3: Polling as failsafe - check every 500ms
    checkIntervalRef.current = setInterval(() => {
      if (player.duration > 0 && player.currentTime > 0) {
        const timeRemaining = player.duration - player.currentTime;
        console.log('Time remaining:', timeRemaining);
        
        if (timeRemaining <= 0.5) {
          console.log('Video ended (polling)');
          navigateToLogin();
        }
      }
    }, 500);

    return () => {
      statusSubscription.remove();
      playingSubscription.remove();
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [player, navigateToLogin]);

  useFocusEffect(
    useCallback(() => {
      hasNavigated.current = false;
      
      // Safely start playing
      try {
        player.play();
      } catch (error) {
        console.log('Error starting video:', error);
      }

      return () => {
        // Only clean up the interval, don't touch the player
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      };
    }, [player])
  );

  return (
    <View style={[styles.container, { width, height }]}>
      <StatusBar hidden />
      <View style={styles.videoContainer}>
        <VideoView
          style={[styles.video, { width: videoWidth, height: videoHeight }]}
          player={player}
          allowsPictureInPicture={false}
          nativeControls={false}
          contentFit="contain"
          allowsFullscreen={false}
        />
      </View>
      {/* Invisible touchable overlay for debugging - tap to skip */}
      <TouchableOpacity 
        style={styles.debugOverlay}
        onPress={navigateToLogin}
        activeOpacity={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#58656E',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#58656E',
  },
  video: {
    backgroundColor: '#58656E',
    borderRadius: 8,
  },
  debugOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
});

