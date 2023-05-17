export default interface SettingsStore {
  arma_path: string;
  noSplash: boolean;
  skipIntro: boolean;
  enableHT: boolean;
  setThreadCharacteristics: boolean;
  windowed: boolean;
  noPause: boolean;
  noPauseAudio: boolean;
  showScriptErrors: boolean;
  command_line: string;
  first_run: boolean;
  auth_token: string;
}

export const defaultSettings: SettingsStore = {
  arma_path: '',
  noSplash: true,
  skipIntro: true,
  enableHT: true,
  setThreadCharacteristics: true,
  windowed: false,
  noPause: false,
  noPauseAudio: false,
  showScriptErrors: false,
  command_line: '',
  first_run: true,
  auth_token: '',
};
