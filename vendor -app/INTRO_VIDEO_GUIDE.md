# Intro Video Feature

## Overview
The app now plays an intro video (`intovid.mp4`) when users launch it for the first time. After watching or skipping the video, it won't be shown again on subsequent launches.

## How It Works

### 1. **App Launch Flow**
```
app/index.tsx → Check if intro seen → 
  ├─ If YES → Redirect to login
  └─ If NO  → Show intro video → Mark as seen → Redirect to login
```

### 2. **Files Created/Modified**

#### New Files:
- **`app/intro.tsx`** - The intro video screen component
  - Plays the video fullscreen
  - Shows a "Skip" button in the bottom-right corner
  - Auto-navigates to login when video ends
  - Marks intro as seen using AsyncStorage

- **`utils/introStorage.ts`** - Utility functions for managing intro status
  - `hasSeenIntro()` - Check if user has seen the intro
  - `markIntroAsSeen()` - Mark intro as seen
  - `resetIntro()` - Reset intro status (for testing)

#### Modified Files:
- **`app/index.tsx`** - Updated to check intro status before routing
- **`app/_layout.tsx`** - Added intro screen to navigation stack

### 3. **Video Requirements**
- Location: `project/assets/images/intovid.mp4`
- The video plays automatically
- Covers the entire screen
- Status bar is hidden during playback

### 4. **User Experience**
1. **First Launch**: User sees the intro video
2. **Skip Option**: User can skip at any time by pressing the "Skip" button
3. **Auto-Navigate**: After video ends, automatically goes to login
4. **Subsequent Launches**: Goes directly to login screen

## Testing

### Reset Intro Status (for testing)
To test the intro video again, you can use the `resetIntro()` function:

```typescript
import { resetIntro } from '@/utils/introStorage';

// Call this anywhere to reset
await resetIntro();
```

You could add a button in the profile or settings screen for easy testing:

```typescript
import { resetIntro } from '@/utils/introStorage';
import { router } from 'expo-router';

const handleResetIntro = async () => {
  await resetIntro();
  Alert.alert('Success', 'Intro video will play on next app launch');
  // Or navigate directly:
  // router.replace('/intro');
};
```

## Dependencies
- **expo-av** - For video playback
- **@react-native-async-storage/async-storage** - For storing intro seen status
- **expo-linear-gradient** - For the skip button gradient effect

## Customization

### Change Video
Replace `project/assets/images/intovid.mp4` with your video file.

### Modify Skip Button Style
Edit the styles in `app/intro.tsx`:
```typescript
skipButton: { ... }
skipButtonGradient: { ... }
skipButtonText: { ... }
```

### Change Video Behavior
In `app/intro.tsx`:
- `isLooping={false}` - Set to `true` to loop the video
- `ResizeMode.COVER` - Change to `CONTAIN`, `STRETCH`, etc.
- Remove auto-navigate by commenting out the `setTimeout` in `handleVideoEnd()`

### Skip Always Showing Intro
If you want to always show the intro (disable the "seen" check), modify `app/index.tsx`:
```typescript
// Always show intro
router.replace('/intro');
```

