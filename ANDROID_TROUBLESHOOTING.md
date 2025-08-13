# 🔧 Android Setup Troubleshooting Guide

## Common "npx cap open android" Failures & Solutions

### Issue 1: Android Platform Not Added
**Error:** "Android platform not found"
**Solution:**
```bash
npx cap add android
npx cap sync
npx cap open android
```

### Issue 2: Android Studio Not Installed
**Error:** "Could not find Android Studio"
**Solution:**
1. Download Android Studio from https://developer.android.com/studio
2. Install with default settings
3. Make sure Android Studio is in your PATH
4. Try again: `npx cap open android`

### Issue 3: Java/JDK Issues
**Error:** "JAVA_HOME not set" or "JDK not found"
**Solution:**
1. Install JDK 11 or higher
2. Set JAVA_HOME environment variable
3. Restart terminal and try again

### Issue 4: Build Tools Missing
**Error:** "Android SDK not found"
**Solution:**
1. Open Android Studio
2. Go to Tools → SDK Manager
3. Install Android SDK Build-Tools
4. Install Android SDK Platform-Tools

### Alternative: Manual APK Build
If `npx cap open android` keeps failing, build directly:

1. **Navigate to android folder:**
   ```bash
   cd android
   ```

2. **Build debug APK:**
   ```bash
   ./gradlew assembleDebug
   ```

3. **Find your APK:**
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Quick Fix Commands
```bash
# Reset and rebuild Android platform
npx cap add android --force
npx cap sync
npx cap copy android
npx cap open android
```

### System Requirements
- Windows 10/11, macOS 10.14+, or Linux
- Android Studio 4.1+
- JDK 11+
- Android SDK 30+
- 8GB RAM minimum

### Still Having Issues?
Try the Gradle build method:
1. Install Android Studio
2. Open the `android` folder directly in Android Studio
3. Use Android Studio's build tools to create APK

Your One Route app is ready - just need to get the Android environment set up correctly!