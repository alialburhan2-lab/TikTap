package com.tiktap.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;

public class MainActivity extends BaseActivity {

    private TextView statLifetime;
    private TextView statBest;
    private TextView statSpeed;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        statLifetime = findViewById(R.id.stat_lifetime);
        statBest = findViewById(R.id.stat_best);
        statSpeed = findViewById(R.id.stat_speed);

        findViewById(R.id.btn_open_test).setOnClickListener(v -> open(TestActivity.class));
        findViewById(R.id.btn_open_settings).setOnClickListener(v -> open(SettingsActivity.class));

        String crash = prefs.takeLastCrash();
        if (crash != null) {
            showError(R.string.crash_title, getString(R.string.crash_message, crash));
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        statLifetime.setText(String.valueOf(prefs.getLifetimeTaps()));
        statBest.setText(String.valueOf(prefs.getBestTps()));
        statSpeed.setText(getString(R.string.ms_value, prefs.getInterval()));
    }

    private void open(Class<?> cls) {
        try {
            startActivity(new Intent(this, cls));
        } catch (RuntimeException e) {
            showError(R.string.error_title, String.valueOf(e.getMessage()));
        }
    }
}
