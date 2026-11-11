package com.twoplace.app;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AlertDialog;
import com.getcapacitor.BridgeActivity;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {
    private static final String HOME_URL = "https://serenlucent.github.io/APP/TwoPlace/";
    private boolean handlingBack = false;
    private AlertDialog exitDialog;
    private String backScript;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        backScript = readBackScript();
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (handlingBack || (exitDialog != null && exitDialog.isShowing())) return;
                // A loading or temporarily unavailable bridge must never close the app.
                if (bridge == null || bridge.getWebView() == null) return;
                handlingBack = true;
                bridge.getWebView().evaluateJavascript(backScript, result -> {
                    handlingBack = false;
                    if (isFinishing() || isDestroyed()) return;
                    String url = bridge.getWebView().getUrl();
                    BackNavigationPolicy.Action action = BackNavigationPolicy.resolve(url, result);
                    if (action == BackNavigationPolicy.Action.IGNORE) return;
                    if (action == BackNavigationPolicy.Action.EXIT_PROMPT) {
                        confirmExit();
                    } else {
                        // Cached games and pages without a back hook return home first.
                        // Never fall through to WebView history or Activity.finish().
                        bridge.getWebView().loadUrl(HOME_URL);
                    }
                });
            }
        });
    }

    private String readBackScript() {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                getResources().openRawResource(R.raw.twoplace_back), StandardCharsets.UTF_8))) {
            StringBuilder script = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) script.append(line).append('\n');
            return script.toString();
        } catch (Exception error) {
            return "'fallback'";
        }
    }

    private void confirmExit() {
        if (exitDialog != null && exitDialog.isShowing()) return;
        View content = getLayoutInflater().inflate(R.layout.dialog_exit, null);
        exitDialog = new AlertDialog.Builder(this).setView(content).create();
        exitDialog.setOnDismissListener(dialog -> exitDialog = null);
        content.findViewById(R.id.exit_no).setOnClickListener(view -> exitDialog.dismiss());
        // This is the only app-exit path, and requires an explicit tap on Yes.
        content.findViewById(R.id.exit_yes).setOnClickListener(view -> {
            exitDialog.dismiss();
            finishAndRemoveTask();
        });
        exitDialog.show();
        Window window = exitDialog.getWindow();
        if (window != null) {
            window.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            int width = Math.min((int)(360 * getResources().getDisplayMetrics().density),
                getResources().getDisplayMetrics().widthPixels - (int)(40 * getResources().getDisplayMetrics().density));
            window.setLayout(width, WindowManager.LayoutParams.WRAP_CONTENT);
            WindowManager.LayoutParams attrs = window.getAttributes();
            attrs.dimAmount = 0.36f;
            window.setAttributes(attrs);
            window.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
        }
    }
}
