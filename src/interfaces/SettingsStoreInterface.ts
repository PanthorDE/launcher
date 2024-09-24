import type Server from './ServerInterface';

export default interface SettingsStore {
  arma_path: string;
  noSplash: boolean;
  skipIntro: boolean;
  enableHT: boolean;
  setThreadCharacteristics: boolean;
  windowed: boolean;
  noPause: boolean;
  noPauseAudio: boolean;
  hugePages: boolean;
  showScriptErrors: boolean;
  command_line: string;
  first_run: boolean;
  auth_token: string;
  armaServerProfiles: Record<Server['id'], string>;
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
  hugePages: true,
  showScriptErrors: false,
  command_line: '',
  first_run: true,
  auth_token: '',
  armaServerProfiles: {},
};
