package com.smartgen.mobile;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeFileOpenerPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @CapacitorPlugin(name = "NativeFileOpener")
    public static class NativeFileOpenerPlugin extends Plugin {

        @PluginMethod
        public void openFile(PluginCall call) {
            String path = call.getString("path");

            if (path == null) {
                call.reject("O caminho do ficheiro é obrigatório");
                return;
            }

            try {
                File file = new File(path.replaceFirst("^file://", ""));
                Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);

                Intent intent = new Intent(Intent.ACTION_VIEW)
                    .setDataAndType(uri, call.getString("mimeType"))
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);

                getContext().startActivity(Intent.createChooser(intent, "Abrir com:"));
                call.resolve();
            } catch (Exception e) {
                call.reject("Erro nativo: " + e.getMessage());
            }
        }
    }
}
