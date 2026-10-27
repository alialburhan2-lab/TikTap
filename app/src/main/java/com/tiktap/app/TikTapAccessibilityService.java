package com.tiktap.app;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;
import android.widget.Toast;

/**
 * Optional accessibility status helper. It does not inject gestures or click
 * controls in other apps. Use Android settings to enable/disable it.
 */
public class TikTapAccessibilityService extends AccessibilityService {
    @Override public void onAccessibilityEvent(AccessibilityEvent event) {
        // Intentionally observe-only. No clicks, gestures, or UI manipulation.
    }
    @Override public void onInterrupt() { }
}
