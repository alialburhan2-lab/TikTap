package com.tiktap.app;

import android.app.Application;
import android.util.Log;

/** Installs a global crash handler that records the error so it can be shown on next launch. */
public class TikTapApp extends Application {
    private static final String TAG = "TikTap";

    @Override
    public void onCreate() {
        super.onCreate();
        final Thread.UncaughtExceptionHandler previous = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, error) -> {
            try {
                Log.e(TAG, "Uncaught exception", error);
                StringBuilder sb = new StringBuilder();
                sb.append(error.getClass().getSimpleName());
                if (error.getMessage() != null) sb.append(": ").append(error.getMessage());
                StackTraceElement[] st = error.getStackTrace();
                for (int i = 0; i < Math.min(3, st.length); i++) {
                    sb.append("\n  at ").append(st[i].toString());
                }
                new Prefs(this).saveCrash(sb.toString());
            } catch (Throwable ignored) {
                // Never let the crash handler itself crash.
            }
            if (previous != null) previous.uncaughtException(thread, error);
        });
    }
}
