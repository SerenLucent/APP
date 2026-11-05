package com.twoplace.app;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AlertDialog;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean handlingBack = false;
    private AlertDialog exitDialog;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (handlingBack || (exitDialog != null && exitDialog.isShowing())) return;
                if (bridge == null || bridge.getWebView() == null) { confirmExit(); return; }
                handlingBack = true;
                bridge.getWebView().evaluateJavascript(
                    "(function(){if(typeof window.twoPlaceBack==='function')return window.twoPlaceBack();return false;})()",
                    result -> {
                        handlingBack = false;
                        if ("true".equals(result)) return;
                        // Older cached pages still return to the main page before offering exit.
                        String url = bridge.getWebView().getUrl();
                        if (url != null && url.contains("/APP/TwoPlace/") &&
                            !url.matches(".*/APP/TwoPlace/(index\\.html)?([?#].*)?$") &&
                            !url.contains("/demo.html")) {
                            bridge.getWebView().loadUrl("https://serenlucent.github.io/APP/TwoPlace/");
                            return;
                        }
                        confirmExit();
                    }
                );
            }
        });
    }

    private void confirmExit() {
        exitDialog = new AlertDialog.Builder(this)
            .setTitle("TwoPlace")
            .setMessage("종료하시겠습니까?")
            .setNegativeButton("취소", (dialog, which) -> dialog.dismiss())
            .setPositiveButton("종료", (dialog, which) -> finish())
            .create();
        exitDialog.show();
    }
}
