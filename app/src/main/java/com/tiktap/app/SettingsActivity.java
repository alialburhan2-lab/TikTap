package com.tiktap.app;

import android.app.AlertDialog;
import android.os.Bundle;
import android.text.TextUtils;
import android.widget.EditText;
import android.widget.SeekBar;
import android.widget.Switch;
import android.widget.TextView;

import java.util.Locale;

public class SettingsActivity extends BaseActivity {

    private SeekBar seekInterval;
    private TextView tvInterval;
    private EditText etMaxTaps;
    private Switch swVibrate;
    private Switch swEffects;
    private Switch swRandom;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);
        setupBack(R.id.btn_back);

        seekInterval = findViewById(R.id.seek_interval);
        tvInterval = findViewById(R.id.tv_interval_value);
        etMaxTaps = findViewById(R.id.et_max_taps);
        swVibrate = findViewById(R.id.sw_vibrate);
        swEffects = findViewById(R.id.sw_effects);
        swRandom = findViewById(R.id.sw_random);

        seekInterval.setMax(Prefs.MAX_INTERVAL - Prefs.MIN_INTERVAL);
        seekInterval.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                showInterval(progress + Prefs.MIN_INTERVAL);
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) { }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) { }
        });

        findViewById(R.id.btn_save).setOnClickListener(v -> save());
        findViewById(R.id.btn_defaults).setOnClickListener(v -> confirmDefaults());
        findViewById(R.id.btn_reset_stats).setOnClickListener(v -> confirmResetStats());

        bind();
    }

    private void bind() {
        int interval = prefs.getInterval();
        seekInterval.setProgress(interval - Prefs.MIN_INTERVAL);
        showInterval(interval);
        int max = prefs.getMaxTaps();
        etMaxTaps.setText(max > 0 ? String.valueOf(max) : "");
        etMaxTaps.setError(null);
        swVibrate.setChecked(prefs.isVibrate());
        swEffects.setChecked(prefs.isEffects());
        swRandom.setChecked(prefs.isRandom());
    }

    private void showInterval(int ms) {
        int clamped = Prefs.clampInterval(ms);
        tvInterval.setText(getString(R.string.speed_value, clamped,
                String.format(Locale.US, "%.1f", 1000f / clamped)));
    }

    private void save() {
        String raw = etMaxTaps.getText() == null ? "" : etMaxTaps.getText().toString().trim();
        int max = 0;
        if (!TextUtils.isEmpty(raw)) {
            try {
                max = Integer.parseInt(raw);
            } catch (NumberFormatException e) {
                etMaxTaps.setError(getString(R.string.error_max_taps, Prefs.MAX_TAPS_LIMIT));
                etMaxTaps.requestFocus();
                return;
            }
            if (max < 0 || max > Prefs.MAX_TAPS_LIMIT) {
                etMaxTaps.setError(getString(R.string.error_max_taps, Prefs.MAX_TAPS_LIMIT));
                etMaxTaps.requestFocus();
                return;
            }
        }
        try {
            prefs.setInterval(seekInterval.getProgress() + Prefs.MIN_INTERVAL);
            prefs.setMaxTaps(max);
            prefs.setVibrate(swVibrate.isChecked());
            prefs.setEffects(swEffects.isChecked());
            prefs.setRandom(swRandom.isChecked());
            toast(R.string.saved);
            finish();
        } catch (RuntimeException e) {
            showError(R.string.error_title, String.valueOf(e.getMessage()));
        }
    }

    private void confirmDefaults() {
        new AlertDialog.Builder(this)
                .setTitle(R.string.restore_defaults)
                .setMessage(R.string.restore_defaults_confirm)
                .setPositiveButton(R.string.confirm, (d, w) -> {
                    prefs.resetSettings();
                    bind();
                    toast(R.string.defaults_restored);
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private void confirmResetStats() {
        new AlertDialog.Builder(this)
                .setTitle(R.string.reset_stats)
                .setMessage(R.string.reset_stats_confirm)
                .setPositiveButton(R.string.confirm, (d, w) -> {
                    prefs.resetStats();
                    toast(R.string.stats_reset);
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }
}
