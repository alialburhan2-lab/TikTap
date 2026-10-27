package com.tiktap.app;

import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.IBinder;
import android.provider.Settings;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.SeekBar;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Movable floating control panel. Controls are manual and do not inject taps
 * into third-party apps.
 */
public class FloatingPanelService extends Service {
    private WindowManager wm;
    private View panel;
    private WindowManager.LayoutParams params;
    private TextView countView;
    private int manualCount = 0;
    private boolean running = false;
    private int intervalMs = 500;
    private android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
    private final Runnable demoCounter = new Runnable() { public void run() { if (!running) return; manualCount++; if (countView != null) countView.setText("عداد جلسة الاختبار: " + manualCount); handler.postDelayed(this, intervalMs); } };
    private float downX, downY;
    private int startX, startY;

    @Override public void onCreate() {
        super.onCreate();
        if (!Settings.canDrawOverlays(this)) {
            stopSelf();
            return;
        }
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        buildPanel();
    }

    private void buildPanel() {
        int dp = (int)(getResources().getDisplayMetrics().density + 0.5f);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(12*dp, 10*dp, 12*dp, 10*dp);
        box.setBackground(round(Color.rgb(18, 25, 42), 18*dp));
        box.setElevation(10*dp);

        TextView header = new TextView(this);
        header.setText("TikTap  ⋮⋮  اسحب للتحريك");
        header.setTextColor(Color.WHITE);
        header.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        header.setTextSize(14);
        header.setPadding(4*dp, 2*dp, 4*dp, 8*dp);
        box.addView(header);
        header.setOnTouchListener((v, event) -> {
            switch (event.getAction()) {
                case MotionEvent.ACTION_DOWN:
                    downX = event.getRawX(); downY = event.getRawY();
                    startX = params.x; startY = params.y; return true;
                case MotionEvent.ACTION_MOVE:
                    params.x = startX + (int)(event.getRawX()-downX);
                    params.y = startY + (int)(event.getRawY()-downY);
                    try { wm.updateViewLayout(panel, params); } catch (Exception ignored) {}
                    return true;
                default: return true;
            }
        });

        countView = new TextView(this);
        countView.setText("الضغطات اليدوية: 0");
        countView.setTextColor(Color.LTGRAY);
        countView.setTextSize(13);
        box.addView(countView);
        addSpace(box, 6*dp);

        Button open = button("فتح TikTok", Color.rgb(22,139,255));
        box.addView(open);
        open.setOnClickListener(v -> openTikTok());

        SeekBar speed = new SeekBar(this);
        speed.setMax(9);
        speed.setProgress(4);
        box.addView(speed);
        speed.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                intervalMs = 1000 - progress * 90;
                if (running) { handler.removeCallbacks(demoCounter); handler.postDelayed(demoCounter, intervalMs); }
            }
            public void onStartTrackingTouch(SeekBar seekBar) {}
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });

        Button startStop = button("بدء جلسة الاختبار", Color.rgb(110,82,210));
        box.addView(startStop);
        startStop.setOnClickListener(v -> {
            running = !running;
            startStop.setText(running ? "إيقاف الجلسة" : "بدء جلسة الاختبار");
            handler.removeCallbacks(demoCounter);
            if (running) handler.postDelayed(demoCounter, intervalMs);
        });

        Button manual = button("تسجيل ضغطة يدوية", Color.rgb(48,62,88));
        box.addView(manual);
        manual.setOnClickListener(v -> {
            manualCount++;
            countView.setText("عداد جلسة الاختبار: " + manualCount);
        });

        Button close = button("إخفاء الواجهة", Color.rgb(176,55,65));
        box.addView(close);
        close.setOnClickListener(v -> stopSelf());

        panel = box;
        int type = android.os.Build.VERSION.SDK_INT >= 26
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;
        params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT);
        params.gravity = Gravity.TOP | Gravity.END;
        params.x = 16*dp;
        params.y = 120*dp;
        wm.addView(panel, params);
    }

    private Button button(String label, int color) {
        Button b = new Button(this);
        b.setText(label); b.setAllCaps(false); b.setTextColor(Color.WHITE); b.setTextSize(12);
        b.setBackground(round(color, 10));
        return b;
    }
    private GradientDrawable round(int color, int radius) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color); d.setCornerRadius(radius); return d;
    }
    private void addSpace(LinearLayout l, int h) {
        View v = new View(this); l.addView(v, new LinearLayout.LayoutParams(1,h));
    }
    private void openTikTok() {
        String[] packages = {"com.zhiliaoapp.musically", "com.ss.android.ugc.trill"};
        PackageManager pm = getPackageManager();
        for (String pkg : packages) {
            Intent launch = pm.getLaunchIntentForPackage(pkg);
            if (launch != null) {
                launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try { startActivity(launch); return; } catch (Exception ignored) {}
            }
        }
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.tiktok.com/"))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); }
        catch (Exception e) { Toast.makeText(this, "تعذّر فتح TikTok", Toast.LENGTH_SHORT).show(); }
    }

    @Override public void onDestroy() {
        running = false;
        handler.removeCallbacksAndMessages(null);
        if (wm != null && panel != null) {
            try { wm.removeView(panel); } catch (Exception ignored) {}
        }
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent) { return null; }
}
