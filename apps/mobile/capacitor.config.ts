import { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "com.smartgen.mobile",
  appName: "Smart Gen",
  webDir: "../website/dist",
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
