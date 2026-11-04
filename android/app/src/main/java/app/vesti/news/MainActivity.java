package app.vesti.news;

import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        // The text size is chosen inside the app (A- / A+). Without this the phone's own font size
        // would be multiplied on top of it and headlines could become unreadably large.
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebSettings ws = getBridge().getWebView().getSettings();
            ws.setTextZoom(100);
        }
    }
}
