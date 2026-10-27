package com.tiktap.app;

import android.content.Context;
import android.content.SharedPreferences;

/** Central, validated access to persisted settings. */
public final class Prefs {
    private static final String FILE = "tiktap_prefs";

    public static final String KEY_INTERVAL = "interval_ms";
    public static final String KEY_MAX_TAPS = "max_taps";
    public static final String KEY_VIBRATE = "vibrate";
    public static final String KEY_EFFECTS = "effects";
    public static final String KEY_RANDOM = "random_positions";
    public static final String KEY_LIFETIME = "lifetime_taps";
    public static final String KEY_BEST_TPS = "best_tps";
    public static final String KEY_LAST_CRASH = "last_crash";

    public static final int MIN_INTERVAL = 50;
    public static final int MAX_INTERVAL = 2000;
    public static final int DEFAULT_INTERVAL = 250;
    public static final int MAX_TAPS_LIMIT = 100000;

    private final SharedPreferences sp;

    public Prefs(Context context) {
        sp = context.getApplicationContext().getSharedPreferences(FILE, Context.MODE_PRIVATE);
    }

    public static int clampInterval(int value) {
        if (value < MIN_INTERVAL) return MIN_INTERVAL;
        if (value > MAX_INTERVAL) return MAX_INTERVAL;
        return value;
    }

    public int getInterval() {
        try {
            return clampInterval(sp.getInt(KEY_INTERVAL, DEFAULT_INTERVAL));
        } catch (ClassCastException e) {
            sp.edit().remove(KEY_INTERVAL).apply();
            return DEFAULT_INTERVAL;
        }
    }

    public void setInterval(int ms) {
        sp.edit().putInt(KEY_INTERVAL, clampInterval(ms)).apply();
    }

    public int getMaxTaps() {
        try {
            int v = sp.getInt(KEY_MAX_TAPS, 0);
            return (v < 0 || v > MAX_TAPS_LIMIT) ? 0 : v;
        } catch (ClassCastException e) {
            sp.edit().remove(KEY_MAX_TAPS).apply();
            return 0;
        }
    }

    public void setMaxTaps(int max) {
        if (max < 0 || max > MAX_TAPS_LIMIT) {
            throw new IllegalArgumentException("max taps out of range: " + max);
        }
        sp.edit().putInt(KEY_MAX_TAPS, max).apply();
    }

    public boolean isVibrate() { return getBool(KEY_VIBRATE, true); }
    public void setVibrate(boolean v) { sp.edit().putBoolean(KEY_VIBRATE, v).apply(); }

    public boolean isEffects() { return getBool(KEY_EFFECTS, true); }
    public void setEffects(boolean v) { sp.edit().putBoolean(KEY_EFFECTS, v).apply(); }

    public boolean isRandom() { return getBool(KEY_RANDOM, true); }
    public void setRandom(boolean v) { sp.edit().putBoolean(KEY_RANDOM, v).apply(); }

    public long getLifetimeTaps() {
        try {
            return Math.max(0L, sp.getLong(KEY_LIFETIME, 0L));
        } catch (ClassCastException e) {
            return 0L;
        }
    }

    public void addLifetimeTaps(long n) {
        if (n <= 0) return;
        sp.edit().putLong(KEY_LIFETIME, getLifetimeTaps() + n).apply();
    }

    public int getBestTps() {
        try {
            return Math.max(0, sp.getInt(KEY_BEST_TPS, 0));
        } catch (ClassCastException e) {
            return 0;
        }
    }

    public boolean offerBestTps(int tps) {
        if (tps > getBestTps()) {
            sp.edit().putInt(KEY_BEST_TPS, tps).apply();
            return true;
        }
        return false;
    }

    public void resetStats() {
        sp.edit().remove(KEY_LIFETIME).remove(KEY_BEST_TPS).apply();
    }

    public void resetSettings() {
        sp.edit()
                .remove(KEY_INTERVAL)
                .remove(KEY_MAX_TAPS)
                .remove(KEY_VIBRATE)
                .remove(KEY_EFFECTS)
                .remove(KEY_RANDOM)
                .apply();
    }

    /** Uses commit() because it is called from the crash handler right before the process dies. */
    public void saveCrash(String summary) {
        sp.edit().putString(KEY_LAST_CRASH, summary).commit();
    }

    public String takeLastCrash() {
        String s = sp.getString(KEY_LAST_CRASH, null);
        if (s != null) sp.edit().remove(KEY_LAST_CRASH).apply();
        return s;
    }

    private boolean getBool(String key, boolean def) {
        try {
            return sp.getBoolean(key, def);
        } catch (ClassCastException e) {
            sp.edit().remove(key).apply();
            return def;
        }
    }
}
