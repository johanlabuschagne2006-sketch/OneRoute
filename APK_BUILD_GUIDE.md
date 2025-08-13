# 📱 One Route APK Build Guide

## Quick APK Generation

Your One Route app is ready to build as an APK. Follow these simple steps:

### Method 1: Android Studio (Recommended)
1. **Install Android Studio** (if not already installed)
   - Download from: https://developer.android.com/studio
   - Install with default settings

2. **Open Project in Android Studio**
   ```bash
   npx cap open android
   ```
   This opens your One Route project in Android Studio

3. **Build APK**
   - In Android Studio: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - Wait for build to complete
   - Click "locate" to find your APK file

### Method 2: Command Line (Advanced)
```bash
# Navigate to android folder
cd android

# Build debug APK
./gradlew assembleDebug

# Build release APK (requires signing)
./gradlew assembleRelease
```

### APK Location
After building, your APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## App Details
- **App Name**: One Route
- **Package**: com.oneroute.app
- **Version**: 1.0.0
- **Target**: Android 14 (API 34)
- **Min SDK**: Android 7.0 (API 24)

## Features Included
✅ User Authentication & OTP Verification
✅ Ride Creation & Booking System
✅ Real-time Chat & WebSocket Communication
✅ GPS Tracking & Location Sharing
✅ PayPal Payment Processing
✅ Admin Panel (Mobile Responsive)
✅ Profile Pictures & File Upload
✅ Emergency SOS Features
✅ ID Verification System
✅ Push Notifications
✅ Camera Access

## Permissions Configured
- Internet & Network Access
- GPS & Location Services (foreground/background)
- Camera for ID verification
- File System Access
- Phone State for OTP
- Push Notifications
- Wake Lock & Vibration

## Testing Your APK
1. Enable "Unknown Sources" in Android settings
2. Install the APK on your Android device
3. Test all features including GPS, camera, and notifications

## Publishing to Google Play Store
1. Create signed release APK in Android Studio
2. Create Google Play Console account
3. Upload APK and fill store listing
4. Submit for review

Your One Route car-sharing app is production-ready for deployment!