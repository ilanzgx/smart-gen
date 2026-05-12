import { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "com.smartgen.mobile",
  appName: "Smart Gen",
  webDir: "../website/dist",
  /*
  Live Reload no mobile (apenas desenvolvimento)
  server: {
    url: "http://192.168.1.109:5173",
    cleartext: true,
    },*/
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Native,
      resizeOnFullScreen: true,
    },
    CapacitorUpdater: {
      autoUpdate: false,
    },
  },
};

export default config;
