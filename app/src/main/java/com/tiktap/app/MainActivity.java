package com.tiktap.app;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.provider.Settings;
import android.widget.EditText;
import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private int count = 0;
    private boolean running = false;
    private TextView status, counter, speedLabel;
    private EditText coordX, coordY;
    private Button toggle;
    private SeekBar speed;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final int bg = Color.rgb(9,13,24), panel = Color.rgb(22,29,45), blue = Color.rgb(22,139,255);

    private final Runnable demoLoop = new Runnable() {
        @Override public void run() {
            if (!running || isFinishing()) return;
            count++;
            counter.setText("نقرات الاختبار داخل TikTap: " + count);
            handler.postDelayed(this, currentIntervalMs());
        }
    };

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(bg);
        getWindow().setNavigationBarColor(bg);

        ScrollView scroll = new ScrollView(this);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(20), dp(24), dp(20), dp(24));
        root.setBackgroundColor(bg);
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        scroll.addView(root);

        root.addView(text("TikTap", 32, Color.WHITE, true));
        root.addView(text("أداة اختبار النقرات لنظام Android", 16, Color.LTGRAY, false));
        addSpace(root, 20);

        LinearLayout launchCard = card(root);
        launchCard.addView(text("التكامل مع TikTok", 19, Color.WHITE, true));
        addSpace(launchCard, 8);
        launchCard.addView(text("يفتح التطبيق لتختار البث بنفسك. لا ينفّذ هذا الإصدار نقرات أو إعجابات داخل TikTok.", 14, Color.LTGRAY, false));
        addSpace(launchCard, 10);
        Button openTikTok = button("فتح TikTok", blue);
        launchCard.addView(openTikTok, matchHeight(52));
        openTikTok.setOnClickListener(v -> openTikTok());

        addSpace(launchCard, 8);
        Button floating = button("تفعيل الواجهة العائمة", Color.rgb(110,82,210));
        launchCard.addView(floating, matchHeight(52));
        floating.setOnClickListener(v -> enableFloatingPanel());
        addSpace(launchCard, 8);
        Button accessibility = button("إعدادات إمكانية الوصول", Color.rgb(48,62,88));
        launchCard.addView(accessibility, matchHeight(48));
        accessibility.setOnClickListener(v -> {
            try { startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)); }
            catch (Exception e) { Toast.makeText(this, "تعذّر فتح إعدادات إمكانية الوصول", Toast.LENGTH_SHORT).show(); }
        });

        addSpace(root, 18);
        LinearLayout demoCard = card(root);
        demoCard.addView(text("مختبر النقرات الداخلي", 19, Color.WHITE, true));
        addSpace(demoCard, 8);
        demoCard.addView(text("جرّب المؤقّت والسرعة داخل هذا التطبيق فقط.", 14, Color.LTGRAY, false));
        addSpace(demoCard, 8);
        demoCard.addView(text("إحداثيات اختبار داخل شاشة TikTap فقط (بكسل):", 14, Color.LTGRAY, false));
        LinearLayout coords = new LinearLayout(this);
        coords.setOrientation(LinearLayout.HORIZONTAL);
        coordX = new EditText(this);
        coordX.setSingleLine(true);
        coordX.setHint("X");
        coordX.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
        coordX.setText("160");
        coordY = new EditText(this);
        coordY.setSingleLine(true);
        coordY.setHint("Y");
        coordY.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
        coordY.setText("300");
        coords.addView(coordX, new LinearLayout.LayoutParams(0, dp(52), 1));
        coords.addView(coordY, new LinearLayout.LayoutParams(0, dp(52), 1));
        demoCard.addView(coords);
        Button testCoords = button("اختبار الإحداثيات", Color.rgb(48,62,88));
        demoCard.addView(testCoords, matchHeight(48));
        testCoords.setOnClickListener(v -> {
            int x = parseCoord(coordX, 160);
            int y = parseCoord(coordY, 300);
            Toast.makeText(this, "تم حفظ نقطة الاختبار داخل TikTap: X=" + x + "، Y=" + y, Toast.LENGTH_SHORT).show();
        });
        addSpace(demoCard, 10);
        status = text("الحالة: متوقف", 17, Color.WHITE, true);
        demoCard.addView(status);
        addSpace(demoCard, 8);
        toggle = button("بدء الاختبار", blue);
        demoCard.addView(toggle, matchHeight(52));
        toggle.setOnClickListener(v -> setRunning(!running));

        addSpace(root, 18);
        root.addView(text("سرعة الاختبار", 18, Color.WHITE, true));
        speedLabel = text("الفاصل: 500 مللي ثانية", 15, Color.LTGRAY, false);
        root.addView(speedLabel);
        speed = new SeekBar(this);
        speed.setMax(9);
        speed.setProgress(4);
        root.addView(speed);
        speed.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override public void onProgressChanged(SeekBar s, int p, boolean user) {
                speedLabel.setText("الفاصل: " + currentIntervalMs() + " مللي ثانية");
            }
            @Override public void onStartTrackingTouch(SeekBar s) {}
            @Override public void onStopTrackingTouch(SeekBar s) {
                if (running) { handler.removeCallbacks(demoLoop); handler.postDelayed(demoLoop, currentIntervalMs()); }
            }
        });

        addSpace(root, 18);
        counter = text("نقرات الاختبار داخل TikTap: 0", 18, Color.WHITE, true);
        root.addView(counter);
        addSpace(root, 8);
        Button manual = button("تسجيل ضغطة يدوية", Color.rgb(48,62,88));
        root.addView(manual, matchHeight(48));
        manual.setOnClickListener(v -> { count++; updateCounter(); });
        addSpace(root, 8);
        Button reset = button("تصفير العداد", Color.rgb(48,62,88));
        root.addView(reset, matchHeight(48));
        reset.setOnClickListener(v -> { count = 0; updateCounter(); });
        addSpace(root, 18);
        root.addView(text("ملاحظة: العداد آلي للتجربة داخل TikTap فقط. لا تتحكم الأداة بتطبيقات أخرى.", 13, Color.rgb(255,190,90), false));
        addSpace(root, 10);
        root.addView(text("TikTap • إصدار 0.4.0", 12, Color.GRAY, false));
        setContentView(scroll);
    }

    private void enableFloatingPanel() {
        if (!Settings.canDrawOverlays(this)) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));
            startActivity(intent);
            Toast.makeText(this, "فعّل السماح بالظهور فوق التطبيقات، ثم ارجع واضغط الزر مرة ثانية", Toast.LENGTH_LONG).show();
            return;
        }
        startService(new Intent(this, FloatingPanelService.class));
        Toast.makeText(this, "تم تشغيل الواجهة العائمة", Toast.LENGTH_SHORT).show();
    }

    private int parseCoord(EditText field, int fallback) {
        try { return Math.max(0, Integer.parseInt(field.getText().toString().trim())); }
        catch (Exception e) { return fallback; }
    }

    private void openTikTok() {
        String[] packages = {"com.zhiliaoapp.musically", "com.ss.android.ugc.trill"};
        PackageManager pm = getPackageManager();
        for (String pkg : packages) {
            Intent launch = pm.getLaunchIntentForPackage(pkg);
            if (launch != null) {
                try { startActivity(launch); return; }
                catch (Exception ignored) { }
            }
        }
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.tiktok.com/"))); }
        catch (Exception e) { Toast.makeText(this, "تعذّر فتح TikTok أو المتصفح", Toast.LENGTH_LONG).show(); }
    }

    private void setRunning(boolean value) {
        running = value;
        handler.removeCallbacks(demoLoop);
        status.setText(running ? "الحالة: اختبار آلي داخل TikTap" : "الحالة: متوقف");
        toggle.setText(running ? "إيقاف الاختبار" : "بدء الاختبار");
        if (running) handler.postDelayed(demoLoop, currentIntervalMs());
    }
    private int currentIntervalMs() { return 1000 - (speed == null ? 4 : speed.getProgress()) * 90; }
    private void updateCounter() { counter.setText("نقرات الاختبار داخل TikTap: " + count); }
    private LinearLayout card(LinearLayout parent) {
        LinearLayout c = new LinearLayout(this); c.setOrientation(LinearLayout.VERTICAL); c.setPadding(dp(16),dp(16),dp(16),dp(16)); c.setBackgroundColor(panel);
        parent.addView(c, new LinearLayout.LayoutParams(-1,-2)); return c;
    }
    private Button button(String label, int color) {
        Button b = new Button(this); b.setText(label); b.setAllCaps(false); b.setTextColor(Color.WHITE);
        b.setBackgroundTintList(android.content.res.ColorStateList.valueOf(color)); return b;
    }
    private LinearLayout.LayoutParams matchHeight(int h) { return new LinearLayout.LayoutParams(-1, dp(h)); }
    private TextView text(String value, int size, int color, boolean bold) {
        TextView t = new TextView(this); t.setText(value); t.setTextSize(size); t.setTextColor(color); t.setGravity(Gravity.CENTER_VERTICAL);
        if (bold) t.setTypeface(Typeface.DEFAULT, Typeface.BOLD); t.setPadding(0,dp(4),0,dp(4)); return t;
    }
    private void addSpace(LinearLayout l, int h) { View v = new View(this); l.addView(v, new LinearLayout.LayoutParams(1,dp(h))); }
    private int dp(int x) { return (int)(x * getResources().getDisplayMetrics().density + 0.5f); }
    @Override protected void onPause() { super.onPause(); setRunning(false); }
    @Override protected void onDestroy() { handler.removeCallbacksAndMessages(null); super.onDestroy(); }
}
