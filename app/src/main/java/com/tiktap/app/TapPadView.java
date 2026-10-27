package com.tiktap.app;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.SystemClock;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * The in-app test area. It only reacts to touches on itself and to simulated taps
 * triggered by TestActivity; it never sends input to other apps.
 */
public class TapPadView extends View {

    public interface OnTapListener {
        void onTap(boolean automatic);
    }

    private static final long RIPPLE_MS = 450L;
    private static final int MAX_RIPPLES = 40;

    private static final class Ripple {
        final float x;
        final float y;
        final long start;
        final boolean auto;

        Ripple(float x, float y, long start, boolean auto) {
            this.x = x;
            this.y = y;
            this.start = start;
            this.auto = auto;
        }
    }

    private final List<Ripple> ripples = new ArrayList<>();
    private final Paint ripplePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint hintPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF bounds = new RectF();
    private final float density;

    private OnTapListener listener;
    private boolean effectsEnabled = true;
    private boolean running;
    private String hint = "";
    private int colorManual;
    private int colorAuto;

    public TapPadView(Context context) {
        this(context, null);
    }

    public TapPadView(Context context, AttributeSet attrs) {
        super(context, attrs);
        density = getResources().getDisplayMetrics().density;
        colorManual = context.getColor(R.color.primary);
        colorAuto = context.getColor(R.color.accent);

        bgPaint.setColor(context.getColor(R.color.surface));
        borderPaint.setStyle(Paint.Style.STROKE);
        borderPaint.setStrokeWidth(2f * density);
        borderPaint.setColor(context.getColor(R.color.outline));
        ripplePaint.setStyle(Paint.Style.STROKE);
        hintPaint.setColor(context.getColor(R.color.text_secondary));
        hintPaint.setTextAlign(Paint.Align.CENTER);
        hintPaint.setTextSize(16f * density);
        setClickable(true);
        setContentDescription(context.getString(R.string.pad_description));
    }

    public void setOnTapListener(OnTapListener l) { this.listener = l; }

    public void setEffectsEnabled(boolean enabled) {
        effectsEnabled = enabled;
        if (!enabled) ripples.clear();
        invalidate();
    }

    public void setRunning(boolean running) {
        this.running = running;
        borderPaint.setColor(getContext().getColor(running ? R.color.accent : R.color.outline));
        invalidate();
    }

    public void setHint(String hint) {
        this.hint = hint == null ? "" : hint;
        invalidate();
    }

    /** Registers a simulated tap at a position inside this view only. */
    public void simulateTap(float x, float y) {
        if (getWidth() == 0 || getHeight() == 0) return;
        float cx = Math.max(0f, Math.min(x, getWidth()));
        float cy = Math.max(0f, Math.min(y, getHeight()));
        registerTap(cx, cy, true);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (!isEnabled()) return false;
        int action = event.getActionMasked();
        if (action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_POINTER_DOWN) {
            int idx = event.getActionIndex();
            registerTap(event.getX(idx), event.getY(idx), false);
            if (action == MotionEvent.ACTION_DOWN) performClick();
            return true;
        }
        return action == MotionEvent.ACTION_MOVE || action == MotionEvent.ACTION_UP
                || action == MotionEvent.ACTION_POINTER_UP || action == MotionEvent.ACTION_CANCEL;
    }

    @Override
    public boolean performClick() {
        return super.performClick();
    }

    private void registerTap(float x, float y, boolean auto) {
        if (effectsEnabled) {
            if (ripples.size() >= MAX_RIPPLES) ripples.remove(0);
            ripples.add(new Ripple(x, y, SystemClock.uptimeMillis(), auto));
            postInvalidateOnAnimation();
        }
        if (listener != null) listener.onTap(auto);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        float r = 24f * density;
        float inset = borderPaint.getStrokeWidth() / 2f;
        bounds.set(inset, inset, getWidth() - inset, getHeight() - inset);
        canvas.drawRoundRect(bounds, r, r, bgPaint);
        canvas.drawRoundRect(bounds, r, r, borderPaint);

        if (ripples.isEmpty() && !hint.isEmpty()) {
            float y = getHeight() / 2f - (hintPaint.descent() + hintPaint.ascent()) / 2f;
            canvas.drawText(hint, getWidth() / 2f, y, hintPaint);
        }

        long now = SystemClock.uptimeMillis();
        float maxRadius = 56f * density;
        Iterator<Ripple> it = ripples.iterator();
        while (it.hasNext()) {
            Ripple rp = it.next();
            float t = (now - rp.start) / (float) RIPPLE_MS;
            if (t >= 1f) {
                it.remove();
                continue;
            }
            int alpha = (int) (255 * (1f - t));
            ripplePaint.setColor(rp.auto ? colorAuto : colorManual);
            ripplePaint.setAlpha(alpha);
            ripplePaint.setStrokeWidth((1f - t) * 6f * density + density);
            canvas.drawCircle(rp.x, rp.y, 10f * density + t * maxRadius, ripplePaint);
        }
        if (!ripples.isEmpty()) postInvalidateOnAnimation();
    }
}
