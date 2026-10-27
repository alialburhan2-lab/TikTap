package com.tiktap.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

/** Common behaviour: forced RTL layout, safe helpers for messages. */
public abstract class BaseActivity extends Activity {

    protected Prefs prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = new Prefs(this);
        getWindow().getDecorView().setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
    }

    protected void toast(int resId) {
        Toast.makeText(this, resId, Toast.LENGTH_SHORT).show();
    }

    protected void showError(int titleRes, String details) {
        if (isFinishing()) return;
        new AlertDialog.Builder(this)
                .setTitle(titleRes)
                .setMessage(details)
                .setPositiveButton(R.string.ok, null)
                .show();
    }

    protected void setupBack(int viewId) {
        View back = findViewById(viewId);
        if (back != null) back.setOnClickListener(v -> finish());
    }
}
