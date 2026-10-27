# TikTap

An Android app (Java) with an Arabic RTL interface for testing tap speed inside a dedicated pad **within the app only**.

## Features
- Test screen: a large tap counter, manual vs. automatic taps, taps per second, and a timer.
- Start/stop automatic tapping with a speed slider (50–2000 ms between taps).
- Settings: speed, maximum tap count, vibration, visual effects, random positions. Saved with `SharedPreferences`.
- Error handling: input validation, protection against corrupted saved values, and a crash handler that shows the details on the next launch.
- An adaptive app icon (vector).
- No external libraries; the app depends only on the Android framework.

> Automatic tapping only works on the pad inside the test screen. The app does not use Accessibility Service or touch injection and does not interact with TikTok or any other app.

## Download
Every push to `main` builds the APK automatically via GitHub Actions and publishes it at:

https://github.com/alialburhan2-lab/TikTap/releases/download/latest/TikTap.apk

## Local build
Requirements: JDK 17 and the Android SDK (API 35).

```bash
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

## Structure
```
app/src/main/java/com/tiktap/app/
  TikTapApp.java       # crash handler
  BaseActivity.java    # forced RTL + shared helpers
  MainActivity.java    # home screen and stats
  TestActivity.java    # test screen, counter, auto-tap
  TapPadView.java      # tap pad (custom drawing)
  SettingsActivity.java
  Prefs.java           # saved settings with validation
```
