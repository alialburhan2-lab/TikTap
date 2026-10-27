package com.tiktap.app;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.widget.Button;
import android.widget.SeekBar;
import android.widget.TextView;

import java.util.ArrayDeque;
import java.util.Locale;
import java.util.Random;

/**
 * In-app tap test screen. Automatic taps are simulated only on the TapPadView inside
 * this activity; nothing is sent to TikTok or any other app.
 */
public class TestActivity extends BaseActivity implements TapPadView.OnTapListener {

    private static final String STATE_TOTAL = "total";
    private static final String STATE_MANUAL = "manual";
    private static final String STATE_AUTO = "auto";

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Random random = new Random();
    private final ArrayDeque<Long> recentTaps = new ArrayDeque<>();

    private TapPadView pad;
    private TextView tvCount;
    private TextView tvManual;
    private TextView tvAuto;
    private TextView tvTps;
    private TextView tvTime;
    private TextView tvSpeed;
    private TextView tvLimit;
    private Button btnToggle;
    private SeekBar seekSpeed;
    private Vibrator vibrator;

    private int total;
    private int manual;
    private int auto;
    private int unsavedTaps;
    private boolean running;
    private long runStartedAt;
    private long elapsedBeforeRun;
    private int intervalMs;
    private int maxTaps;
    private boolean vibrate;
    private boolean randomPositions;

    private final Runnable autoTapRunnable = new Runnable() {
        @Override
        public void run() {
            if (!running) return;
            try {
                float x;
                float y;
                if (randomPositions) {
                    x = pad.getWidth() * (0.1f + 0.8f * random.nextFloat());
                    y = pad.getHeight() * (0.1f + 0.8f * random.nextFloat());
                } else {
                    x = pad.getWidth() / 2f;
                    y = pad.getHeight() / 2f;
                }
                pad.simulateTap(x, y);
            } catch (RuntimeException e) {
                stopRun();
                showError(R.string.error_title, String.valueOf(e.getMessage()));
                return;
            }
            if (running) handler.postDelayed(this, intervalMs);
        }
    };

    private final Runnable ticker = new Runnable() {
        @Override
        public void run() {
            updateStats();
            handler.postDelayed(this, 200);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_test);
        setupBack(R.id.btn_back);

        pad = findViewById(R.id.tap_pad);
        tvCount = findViewById(R.id.tv_count);
        tvManual = findViewById(R.id.tv_manual);
        tvAuto = findViewById(R.id.tv_auto);
        tvTps = findViewById(R.id.tv_tps);
        tvTime = findViewById(R.id.tv_time);
        tvSpeed = findViewById(R.id.tv_speed_value);
        tvLimit = findViewById(R.id.tv_limit);
        btnToggle = findViewById(R.id.btn_toggle);
        seekSpeed = findViewById(R.id.seek_speed);

        Object service = getSystemService(Context.VIBRATOR_SERVICE);
        vibrator = service instanceof Vibrator ? (Vibrator) service : null;

        if (savedInstanceState != null) {
            total = savedInstanceState.getInt(STATE_TOTAL, 0);
            manual = savedInstanceState.getInt(STATE_MANUAL, 0);
            auto = savedInstanceState.getInt(STATE_AUTO, 0);
        }

        pad.setOnTapListener(this);
        btnToggle.setOnClickListener(v -> {
            if (running) stopRun(); else startRun();
        });
        findViewById(R.id.btn_reset).setOnClickListener(v -> resetCounters());

        seekSpeed.setMax(Prefs.MAX_INTERVAL - Prefs.MIN_INTERVAL);
        seekSpeed.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                intervalMs = Prefs.clampInterval(progress + Prefs.MIN_INTERVAL);
                showSpeed();
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) { }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
                prefs.setInterval(intervalMs);
                if (running) {
                    handler.removeCallbacks(autoTapRunnable);
                    handler.postDelayed(autoTapRunnable, intervalMs);
                }
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        intervalMs = prefs.getInterval();
        maxTaps = prefs.getMaxTaps();
        vibrate = prefs.isVibrate();
        randomPositions = prefs.isRandom();
        pad.setEffectsEnabled(prefs.isEffects());
        seekSpeed.setProgress(intervalMs - Prefs.MIN_INTERVAL);
        showSpeed();
        tvLimit.setText(maxTaps > 0
                ? getString(R.string.limit_value, maxTaps)
                : getString(R.string.limit_none));
        renderRunState();
        updateCounters();
        handler.post(ticker);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (running) stopRun();
        handler.removeCallbacks(ticker);
        flushLifetime();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putInt(STATE_TOTAL, total);
        outState.putInt(STATE_MANUAL, manual);
        outState.putInt(STATE_AUTO, auto);
    }

    @Override
    public void onTap(boolean automatic) {
        if (maxTaps > 0 && total >= maxTaps) {
            if (running) stopRun();
            toast(R.string.limit_reached);
            return;
        }
        total++;
        unsavedTaps++;
        if (automatic) auto++; else manual++;
        recentTaps.addLast(SystemClock.uptimeMillis());
        if (vibrate && !automatic) buzz();
        updateCounters();
        if (unsavedTaps >= 50) flushLifetime();
        if (maxTaps > 0 && total >= maxTaps) {
            if (running) stopRun();
            toast(R.string.limit_reached);
        }
    }

    private void startRun() {
        if (maxTaps > 0 && total >= maxTaps) {
            toast(R.string.limit_reached);
            return;
        }
        if (pad.getWidth() == 0 || pad.getHeight() == 0) {
            toast(R.string.pad_not_ready);
            return;
        }
        running = true;
        runStartedAt = SystemClock.uptimeMillis();
        handler.removeCallbacks(autoTapRunnable);
        handler.post(autoTapRunnable);
        renderRunState();
    }

    private void stopRun() {
        if (running) elapsedBeforeRun += SystemClock.uptimeMillis() - runStartedAt;
        running = false;
        handler.removeCallbacks(autoTapRunnable);
        renderRunState();
        updateStats();
    }

    private void resetCounters() {
        stopRun();
        flushLifetime();
        total = 0;
        manual = 0;
        auto = 0;
        elapsedBeforeRun = 0;
        recentTaps.clear();
        updateCounters();
        updateStats();
        toast(R.string.counter_reset);
    }

    private void renderRunState() {
        btnToggle.setText(running ? R.string.stop : R.string.start);
        btnToggle.setBackgroundResource(running ? R.drawable.bg_button_stop : R.drawable.bg_button_primary);
        pad.setRunning(running);
        pad.setHint(getString(running ? R.string.pad_hint_running : R.string.pad_hint));
    }

    private void updateCounters() {
        tvCount.setText(String.valueOf(total));
        tvManual.setText(String.valueOf(manual));
        tvAuto.setText(String.valueOf(auto));
    }

    private void updateStats() {
        long now = SystemClock.uptimeMillis();
        while (!recentTaps.isEmpty() && now - recentTaps.peekFirst() > 1000L) {
            recentTaps.pollFirst();
        }
        int tps = recentTaps.size();
        tvTps.setText(String.valueOf(tps));
        if (tps > 0) prefs.offerBestTps(tps);

        long elapsed = elapsedBeforeRun + (running ? now - runStartedAt : 0L);
        long secs = elapsed / 1000L;
        tvTime.setText(String.format(Locale.US, "%02d:%02d", secs / 60, secs % 60));
    }

    private void showSpeed() {
        float perSecond = 1000f / intervalMs;
        tvSpeed.setText(getString(R.string.speed_value, intervalMs,
                String.format(Locale.US, "%.1f", perSecond)));
    }

    private void buzz() {
        if (vibrator == null) return;
        try {
            if (vibrator.hasVibrator()) {
                vibrator.vibrate(VibrationEffect.createOneShot(15, VibrationEffect.DEFAULT_AMPLITUDE));
            }
        } catch (RuntimeException e) {
            // Some devices throw on vibrate (e.g. restricted). Disable for this session.
            vibrate = false;
        }
    }

    private void flushLifetime() {
        if (unsavedTaps > 0) {
            prefs.addLifetimeTaps(unsavedTaps);
            unsavedTaps = 0;
        }
    }
}
