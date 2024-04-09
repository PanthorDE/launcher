<template>
  <v-app id="panthor-launcher">
    <v-app-bar class="px-3" color="black" flat density="comfortable" v-if="!first_run_dialog">
      <img src="@/assets/Panthor_Header_Logo_Line.png" class="image-left pt-1 pb-1" />

      <v-spacer></v-spacer>

      <v-tabs centered color="red" v-model="tab">
        <v-tab v-for="(link, index) in links" :key="link" :value="index">
          {{ link }}
        </v-tab>
      </v-tabs>

      <v-spacer></v-spacer>

      <v-chip color="white" v-if="requesting_login || logged_in">
        <span class="me-2"><span v-if="requesting_login && !logged_in"><v-progress-linear indeterminate
              style="width: 60px"></v-progress-linear></span><span v-else>{{ user.name }}</span></span>
        <v-avatar class="hidden-sm-and-down" color="primary" size="32" v-if="user.player">
          <v-img alt="Avatar" :src="user.player.avatar_medium"></v-img>
          <v-icon v-if="requesting_login && !logged_in" icon="mdi-login-variant"></v-icon></v-avatar>
        <v-avatar class="hidden-sm-and-down" v-if="requesting_login && !logged_in" color="primary" size="32"><v-icon
            icon="mdi-help-circle-outline"></v-icon></v-avatar>
      </v-chip>
      <v-btn :loading="loading_api_data" @click="loadAPIDataUI" icon :disabled="!reloadAllowed">
        <v-avatar class="hidden-sm-and-down" color="primary" size="32"><v-tooltip text="Aktualisieren" location="bottom"
            activator="parent"></v-tooltip><v-icon icon="mdi-refresh"></v-icon></v-avatar>
        <template v-slot:loader>
          <v-progress-circular indeterminate></v-progress-circular>
        </template>
      </v-btn>
      <v-btn :loading="requesting_login" icon @click="loginOrOut" v-if="!logged_in"><v-avatar class="hidden-sm-and-down"
          color="primary" size="32"><v-tooltip text="Login" location="bottom" activator="parent"></v-tooltip><v-icon
            icon="mdi-login"></v-icon></v-avatar>
        <template v-slot:loader>
          <v-progress-circular indeterminate></v-progress-circular>
        </template>
      </v-btn>
      <v-btn :loading="requesting_login" icon @click="loginOrOut" v-if="logged_in"><v-avatar class="hidden-sm-and-down"
          color="primary" size="32"><v-tooltip text="Logout" location="bottom" activator="parent"></v-tooltip><v-icon
            icon="mdi-logout"></v-icon></v-avatar>
        <template v-slot:loader>
          <v-progress-circular indeterminate></v-progress-circular>
        </template>
      </v-btn>
    </v-app-bar>
    <v-main>
      <v-container :fluid="true" v-if="!first_run_dialog">
        <v-row>
          <v-col cols="3">
            <v-card flat v-for="(server, i) in api_data.servers" @click="openServer(i)" class="mb-3">
              <v-card-title>
                {{ server.name }}
                <v-progress-circular :model-value="(server.players.length / notZero(server.slots)) * 100"
                  color="primary" :size="70" :width="8" class="float-right">{{ Math.round((server.players.length /
                    notZero(server.slots)) * 100) }}%</v-progress-circular><br /><span class="text-h5"
                  style="font-size: 18px !important">Online: {{ server.players.length }} / {{ server.slots
                  }}</span></v-card-title>
            </v-card>
            <v-card flat v-for="teamspeak in api_data.teamspeaks"
              @click="openURL(`ts3server://${teamspeak.ip}?port=${teamspeak.port}`)">
              <v-card-title>
                Teamspeak
                <v-progress-circular :model-value="(teamspeak.users.length / notZero(teamspeak.slots)) * 100"
                  color="primary" :size="70" :width="8" class="float-right">{{ Math.round((teamspeak.users.length /
                    notZero(teamspeak.slots)) * 100) }}%</v-progress-circular><br /><span class="text-h5"
                  style="font-size: 18px !important">Online: {{ teamspeak.users.length }} / {{ teamspeak.slots
                  }}</span></v-card-title>
            </v-card>
            <div v-for="mod in api_data.mods">
              <v-card flat min-height="100" class="mt-3"
                v-if="mod.worker_status && mod.worker_status.status != 0 && mod.worker_status.status != 1 && mod.worker_status.status != 6"
                @click="tab = 1">
                <v-card-title><v-icon icon="mdi-download-network-outline" size="small" class="float-right"
                    :color="mod.worker_status.color"></v-icon>
                  {{ mod.name }}</v-card-title>
                <v-row class="mt-0 mx-auto ps-5 pe-5 mb-2">
                  <v-card-text class="text-center"><v-icon :icon="mod.worker_status.icon" class="me-2"
                      :color="mod.worker_status.color"></v-icon> {{ mod.worker_status.message }}</v-card-text>
                  <v-progress-linear rounded striped v-model="mod.worker_status.fileop_progress"
                    :color="mod.worker_status.color" :height="16" :stream="mod.worker_status.fileop_progress != 0"
                    :indeterminate="mod.worker_status.fileop_progress == 0"
                    v-if="mod.worker_status.status === 2 || mod.worker_status.status === 4">
                    <strong v-if="mod.worker_status.fileop_progress > 0">{{ Math.ceil(mod.worker_status.fileop_progress)
                      }}%</strong>
                  </v-progress-linear>
                </v-row>
                <Transition name="fade">
                  <v-row class="text-center justify-center mb-0 pt-3"
                    v-if="mod.worker_status.status === 3 || mod.worker_status.status === 5">
                    <v-col cols="auto" class="pt-0">
                      <v-chip class="ma-2" color="warning" variant="outlined">
                        <v-icon start icon="mdi-file-alert"></v-icon>
                        {{ mod.worker_status.fileop_files_broken }}
                      </v-chip>
                      <v-chip class="ma-2" color="warning" variant="outlined">
                        <v-icon start icon="mdi-file-download"></v-icon>
                        {{ humanFileSize(mod.worker_status.fileop_files_broken_size) }}
                      </v-chip>
                    </v-col>
                  </v-row>
                </Transition>
                <Transition name="fade">
                  <v-row class="text-center justify-center mb-0 mt-2 pt-3" v-if="mod.worker_status.fileop_speed > 0">
                    <v-col cols="auto" v-if="mod.worker_status.fileop_speed > 0" class="pt-0">
                      <v-chip class="ma-2" color="success" variant="outlined">
                        <v-icon start icon="mdi-speedometer-slow"></v-icon>
                        {{ humanFileSize(mod.worker_status.fileop_speed, true, 2, true) }}
                      </v-chip>
                    </v-col>
                    <v-col cols="auto" v-if="mod.worker_status.fileop_time_remaining > 0" class="pt-0">
                      <v-chip class="ma-2" color="success" variant="outlined">
                        <v-icon start icon="mdi-clock-end"></v-icon>
                        {{ formatTime(Math.ceil(mod.worker_status.fileop_time_remaining)) }}
                      </v-chip>
                    </v-col>
                  </v-row>
                </Transition>
                <Transition name="fade">
                  <v-row class="text-center justify-center mb-0 pt-0 mt-0"
                    v-if="mod.worker_status.fileop_size_remaining > 0 && mod.worker_status.fileop_size_done > 0">
                    <v-col cols="auto" v-if="mod.worker_status.fileop_files_remaining > 0" class="pt-0">
                      <v-chip class="ma-2" color="success" variant="outlined">
                        <v-icon start icon="mdi-file-multiple"></v-icon>
                        {{ mod.worker_status.fileop_files_done }} / {{ mod.worker_status.fileop_files_remaining +
                          mod.worker_status.fileop_files_done }}
                      </v-chip>
                    </v-col>
                    <v-col cols="auto"
                      v-if="mod.worker_status.fileop_size_remaining > 0 && mod.worker_status.fileop_size_done > 0"
                      class="pt-0">
                      <v-chip class="ma-2" color="success" variant="outlined">
                        <v-icon start icon="mdi-harddisk"></v-icon>
                        {{ humanFileSize(mod.worker_status.fileop_size_done, true, 1) }} /
                        {{ humanFileSize(mod.worker_status.fileop_size_total,
                          true,
                          1) }}
                      </v-chip>
                    </v-col>
                  </v-row>
                </Transition>
              </v-card>
            </div>
            <v-divider class="border-opacity-75 mt-3 mb-3" color="primary"></v-divider>
            <div>
              <v-card flat v-show="tab == 0">
                <v-card-title>
                  Panthor unterstützen <v-icon icon="mdi-heart" size="x-large" color="red" class="float-right"></v-icon>
                </v-card-title>
                <v-card-text>
                  Pathor wird durch Panthor+ und Panthor Pro Abos finanziert. Das Abo kann jederzeit beendet werden. 
                  Es besteht natürlich keine Verpflichtung uns bei der Finanzierung zu unterstützen.
                  <br>
                  <v-btn color="primary" variant="outlined" class="mt-3" block prepend-icon="mdi-launch"
                    @click="openURL('https://info.panthor.de/shop')">Zum Shop</v-btn>
                </v-card-text>
              </v-card flat>
              <v-card @click="openURL('https://www.twitch.tv/panthorde')" class="mt-2 w-100" v-show="tab != 0"
                ref="twitch2">
                <iframe class="mt-2 shadow-lg rounded-lg" style="border: none;"
                  src="https://api.panthor.de/v2/twitch_embed" width="100%" :height="width * 0.5625"></iframe>
              </v-card>
            </div>
          </v-col>
          <v-col cols="9">
            <v-window v-model="tab" class="h-100">
              <!-- Home -->
              <v-window-item :value="0">
                <home-window :changelogs="api_data.changelogs" :news="news" @switch-tab="switchTab(3)"></home-window>
              </v-window-item>
              <!-- Mods -->
              <v-window-item :value="1">
                <mod-window :mods="api_data.mods" :arma_path="settings.arma_path" @choose-armapath="chooseArmaPath"
                  @launch-game="launchGame" @open-server="openServer()"></mod-window>
              </v-window-item>

              <!-- Servers -->
              <v-window-item :value="2">
                <server-window :servers="api_data.servers" @load-api-data="loadAPIDataUI" @switch-tab="switchTab(1)"
                  :reload_allowed="reloadAllowed" :default_tab="server_window_default_tab" @launch-game="launchGame"
                  ref="serverWindowRef"></server-window>
              </v-window-item>

              <!-- Changelogs -->
              <v-window-item :value="3">
                <changelog-window :changelogs="api_data.changelogs"></changelog-window>
              </v-window-item>

              <!-- Tfar -->
              <v-window-item :value="4">
                <tfar-window></tfar-window>
              </v-window-item>

              <!-- Settings -->
              <v-window-item :value="5">
                <v-row>
                  <v-col cols="12">
                    <v-card>
                      <v-card-title>Launcher Einstellungen</v-card-title>
                      <v-card-text class="pb-0">
                        <v-row>
                          <v-col cols="10">
                            <v-text-field label="Arma 3 Pfad" prepend-inner-icon="mdi-folder-sync" variant="solo-filled"
                              v-model="settings.arma_path" readonly placeholder="Leer" density="comfortable" block
                              flat></v-text-field>
                          </v-col>
                          <v-col cols="2">
                            <v-btn @click="chooseArmaPath" icon="mdi-folder-open" color="red" block rounded="sm">
                              <v-icon icon="mdi-folder-open"></v-icon>
                              <v-tooltip activator="parent" location="top">Arma 3 Pfad auswählen</v-tooltip>
                            </v-btn>
                          </v-col>
                        </v-row>
                      </v-card-text>
                      <v-card-text>
                        <v-btn prepend-icon="mdi-upload" disabled color="success"> Letzten RPT hochladen </v-btn>
                        <v-btn prepend-icon="mdi-folder-open" color="success" class="ms-2" @click="openMissionCache">
                          MPMission Cache öffnen
                        </v-btn>
                        <v-btn prepend-icon="mdi-steam" color="success" class="ms-2" @click="validateA3">
                          Arma 3 via Steam überprüfen
                        </v-btn>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12">
                    <v-card>
                      <v-card-title>Arma Einstellungen</v-card-title>
                      <v-card-text class="pb-0">
                        <v-row>
                          <v-col cols="6">
                            <v-card-subtitle class="ps-0">Start beschleunigen</v-card-subtitle>
                            <v-card-text class="px-0 py-0">
                              <v-switch v-model="settings.noSplash" hide-details inset label="Splashscreen überspringen"
                                color="primary"></v-switch>
                              <v-switch v-model="settings.skipIntro" hide-details inset label="Intro überspringen"
                                color="primary"></v-switch>
                            </v-card-text>

                            <v-card-subtitle class="ps-0">Performance</v-card-subtitle>
                            <v-card-text class="px-0 py-0">
                              <v-switch v-model="settings.enableHT" hide-details inset label="Hyperthreading aktivieren"
                                color="primary"></v-switch>
                              <v-switch v-model="settings.setThreadCharacteristics" hide-details inset
                                label="Windows Gaming Optimierung" color="primary"></v-switch>
                            </v-card-text>
                          </v-col>
                          <v-col cols="6">
                            <v-card-subtitle class="ps-0">Verschiedenes</v-card-subtitle>
                            <v-card-text class="px-0 py-0">
                              <v-switch v-model="settings.windowed" hide-details inset label="Fenstermodus"
                                color="primary"></v-switch>
                              <v-switch v-model="settings.noPause" hide-details inset
                                label="Spiel nicht im Hintergrund pausieren" color="primary"></v-switch>
                              <v-switch v-model="settings.noPauseAudio" hide-details inset
                                label="Ton nicht im Hintergrund pausieren" color="primary"></v-switch>
                            </v-card-text>

                            <v-card-subtitle class="ps-0">Debug</v-card-subtitle>
                            <v-card-text class="px-0 py-0">
                              <v-switch v-model="settings.showScriptErrors" hide-details inset
                                label="Skriptfehler anzeigen" color="primary"></v-switch>
                            </v-card-text>
                          </v-col>
                        </v-row>
                        <v-row>
                          <v-col cols="12">
                            <v-text-field label="Weitere Startparameter" prepend-inner-icon="mdi-powershell"
                              variant="solo-filled" density="comfortable" v-model="settings.command_line"
                              placeholder="-debug -hugePages -noLogs" block flat></v-text-field>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- FAQ -->
              <v-window-item :value="6">
                <faq-window></faq-window>
              </v-window-item>
            </v-window>
          </v-col>
        </v-row>
        <v-dialog transition="dialog-top-transition" width="400" v-model="show_login_dialog">
          <v-card>
            <v-toolbar color="red" title="Login" class="text-center pe-5"></v-toolbar>
            <v-card-text class="mb-2">
              <v-text-field v-model="settings.auth_token" class="mb-2" variant="solo-filled" flat clearable
                label="Auth-Token"></v-text-field>
              <v-btn block color="success" size="large" type="submit" variant="elevated" @click="login">
                Login <v-progress-circular v-if="requesting_login" indeterminate size="24"></v-progress-circular>
              </v-btn>
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-container>
      <v-container :fluid="true" v-if="first_run_dialog">
        <v-dialog transition="dialog-top-transition" width="800" v-model="first_run_dialog" persistent>
          <v-card>
            <img src="@/assets/Panthor_Header_Logo_Line.png" class=" pa-3" />
            <v-card-text>
              <div class="pa-5 text-center">
                <span class="text-h6">Willkommen im <span class="text-primary">Panthor Life</span> Launcher!</span>
                <br />
                <br />
                <span class="text-h6">Um die Panthor Mod zu installieren muss der Launcher den Pfad zu deiner Arma 3
                  Installation finden.</span>
                <br />
                <br />
                <span class="text-h8">Folgende mögliche Ordner wurden automatisch erkannt, bitte wähle den richtigen aus:</span>

                <v-radio-group label="Arma 3 Pfad" v-model="first_run_selected_path" class="mt-8"
                  v-if="possible_a3_paths.length > 0">
                  <v-radio :label="path" :value="i" v-for="(path, i) in possible_a3_paths"></v-radio>
                </v-radio-group>
                <br />
                <span class="text-h8">Falls dein Pfad nicht aufgeführt ist überspringe diesen Schritt.</span>
              </div>
              <v-alert type="warning" title="Keine validen Pfade gefunden" v-if="possible_a3_paths.length === 0"
                text="Leider ist Arma auf deinem PC nicht an einer üblichen Stelle installiert oder du hast es manuell verschoben. Bitte überspringe diesen Schritt."></v-alert>
            </v-card-text>
            <v-card-actions class="justify-center mb-2">
              <v-btn color="warning" variant="outlined" prepend-icon="mdi-debug-step-over" @click="firstRunSkip"
                size="large">Überspringen</v-btn>
              <v-btn color="success" variant="outlined" prepend-icon="mdi-content-save-cog" @click="firstRunSave"
                size="large" v-if="possible_a3_paths.length > 0">Speichern</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
      <v-container :fluid="true" v-if="launching_game">
        <v-dialog transition="dialog-top-transition" width="800" v-model="launching_game">
          <v-card>
            <v-card-text>
              <div class="pa-5 text-center">
                <span class="text-h4"><v-icon icon="mdi-loading mdi-spin"></v-icon> Arma wird gestartet</span>
                <v-divider class="mt-5 mb-5"></v-divider>
                <span class="text-h6"><v-icon icon="mdi-folder-heart-outline"></v-icon> Arma Pfad</span>
                <br>
                <code style="font-size: 16px;">{{ settings.arma_path }}</code>
                <v-divider class="mt-5 mb-5"></v-divider>
                <span class="text-h6"><v-icon icon="mdi-powershell"></v-icon> Startparameter</span>
                <v-chip-group variant="outlined" class="mt-3 w-100" column>
                  <v-chip label v-for="par in launch_params">{{ par }}</v-chip>
                </v-chip-group>
              </div>
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { ipcMain, ipcRenderer, shell } from 'electron';
import ModWindow from '@/components/ModWindow.vue';
import ChangelogWindow from '@/components/ChangelogWindow.vue';
import TfarWindow from '@/components/TfarWindow.vue';
import ServerWindow from '@/components/ServerWindow.vue';
import HomeWindow from '@/components/HomeWindow.vue';
import FaqWindow from '@/components/FaqWindow.vue';
import { defineComponent, ref } from 'vue';
import Store from 'electron-store';

import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts/dist';
import Server from '@/interfaces/ServerInterface';
import Mod from '@/interfaces/ModInterface';
import Changelog from '@/interfaces/ChangelogInterface';
import Teamspeak from './interfaces/TeamspeakInterface';
import WorkerStatus from './interfaces/WorkerStatusInterface';
import User from './interfaces/UserInterface';
import SettingsStore, { defaultSettings } from './interfaces/SettingsStoreInterface';
import { existsSync } from 'node:fs';
import { PanthorApiService } from './services/PanthorApi.service';
import News from './interfaces/NewsInterface';
import { set, useElementSize } from '@vueuse/core';

const langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
const duration_humanizer = new HumanizeDuration(langService);

export default defineComponent({
  name: 'UI',
  data: () => {
    return {
      links: ['Home', 'Mods', 'Server', 'Changelog', 'TFAR', 'Settings', 'FAQ'],
      api_data: {
        mods: [] as Mod[],
        servers: [] as Server[],
        changelogs: [] as Changelog[],
        teamspeaks: [] as Teamspeak[],
      },
      news: [] as News[],
      tab: 0,
      logged_in: false,
      show_login_dialog: false,
      requesting_login: false,
      user: {} as User,
      worker_status: [] as WorkerStatus[],
      duration_humanizer: duration_humanizer,
      loading_api_data: false,
      settings: defaultSettings as SettingsStore,
      first_run_dialog: false,
      first_run_selected_path: 0,
      launching_game: false,
      launch_params: [] as Array<string>,
      possible_a3_paths: [] as Array<string>,
      server_window_default_tab: 0,
      reloadAllowed: true
    };
  },
  methods: {
    humanFileSize(bytes: number, si = true, dp = 1, speed = false) {
      const thresh = si ? 1000 : 1024;

      if (Math.abs(bytes) < thresh) {
        return bytes + ' B/s';
      }

      const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
      let u = -1;
      const r = 10 ** dp;

      do {
        bytes /= thresh;
        ++u;
      } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

      if (speed) {
        return bytes.toFixed(dp) + ' ' + units[u] + '/s';
      }
      return bytes.toFixed(dp) + ' ' + units[u];
    },
    loadAPIDataUI() {
      if (this.reloadAllowed) {
        this.loadAPIData();
        this.reloadAllowed = false;
        setTimeout(() => {
          this.reloadAllowed = true;
        }, 5000);
      }
    },
    loadAPIData() {
      if (!this.loading_api_data) {
        this.loading_api_data = true;
        this.getAPIData();
      }
    },
    getNews() {
      PanthorApiService.getNews()
        .then((news) => {
          this.news = news
        })
        .catch(console.error);
    },
    getAPIData() {
      let promises: Promise<unknown>[] = [];

      if (this.logged_in || this.settings.auth_token === '') {
        promises.push(
          PanthorApiService.getMods(this.logged_in ? this.settings.auth_token : undefined)
            .then((mods) => {
              let missing_status = false;
              mods.forEach((mod) => {
                this.api_data.mods.forEach((old_mod) => {
                  if (old_mod.id === mod.id) {
                    mod.worker_status = old_mod.worker_status;
                  }
                });
                if (!mod.worker_status) {
                  missing_status = true;
                }
              })
              this.api_data.mods = mods
              if (missing_status) {
                this.requestWorkerUpdate();
              }
            })
            .catch(console.error)
        );
      }

      promises.push(
        PanthorApiService.getServers()
          .then((servers) => {
            for (let i = 0; i < this.api_data.servers.length; i++) {
              for (let j = 0; j < servers.length; j++) {
                if (this.api_data.servers[i].id === servers[j].id) {
                  servers[j].mod_ready = this.api_data.servers[i].mod_ready;
                }
              }
            }
            this.api_data.servers = servers
          })
          .catch(console.error)
      );

      promises.push(
        PanthorApiService.getChangelogs()
          .then((changelogs) => (this.api_data.changelogs = changelogs))
          .catch(console.error)
      );

      promises.push(
        PanthorApiService.getTeamspeaks()
          .then((teamspeaks) => (this.api_data.teamspeaks = teamspeaks))
          .catch(console.error)
      );

      if (this.logged_in) {
        promises.push(
          PanthorApiService.getProfile(this.settings.auth_token)
            .then((profile) => (this.user.player = profile))
            .catch(console.error)
        );
      }

      Promise.all(promises).then((results) => {
        this.loading_api_data = false;
      });
    },
    notZero(input: number) {
      if (input === 0) {
        return 1;
      } else {
        return input;
      }
    },
    formatTime(seconds: number): string {
      const hours = Math.floor(seconds / 3600);
      const remainingSeconds = seconds % 3600;
      const minutes = Math.floor(remainingSeconds / 60);
      const remainingSeconds2 = remainingSeconds % 60;

      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const formattedSeconds = remainingSeconds2.toString().padStart(2, '0');

      return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    },
    loadSettings() {
      let store = new Store<SettingsStore>({
        defaults: defaultSettings,
      });

      this.settings = store.store;

      ipcRenderer.on('settings:openArmaSelect:result', (event, data) => {
        this.settings.arma_path = data;
      });

      if (this.settings.first_run) {
        this.launch_first_run();
      }

      if (this.settings.auth_token) {
        this.login();
      }
    },
    chooseArmaPath() {
      ipcRenderer.send('settings:openArmaSelect', {});
    },
    openMissionCache() {
      ipcRenderer.send('settings:openMissionCache', {});
    },
    validateA3() {
      ipcRenderer.send('settings:validateA3', {});
    },
    openURL(url: string) {
      shell.openExternal(url);
    },
    launch_first_run() {
      this.first_run_dialog = true;
      ipcRenderer.on('checkRegKeys:result', (_event, key: string) => {
        this.possible_a3_paths.push(key);
      });
      ipcRenderer.send('checkRegKeys:request');
    },
    requestWorkerUpdate() {
      ipcRenderer.send('worker:requestUpdate');
    },
    openServer(index: number = 0) {
      this.server_window_default_tab = index;
      this.tab = 2;
      let serverWindowRef = this.$refs.serverWindowRef as typeof ServerWindow;
      if (serverWindowRef !== undefined) {
        serverWindowRef.setTab(index);
      }
    },
    switchTab(index: number = 0) {
      this.tab = index;
    },
    firstRunSave() {
      this.settings.first_run = false;
      this.first_run_dialog = false;
      this.settings.arma_path = this.possible_a3_paths[this.first_run_selected_path];
    },
    firstRunSkip() {
      this.settings.first_run = false;
      this.first_run_dialog = false;
    },
    loginOrOut() {
      if (this.logged_in) {
        this.logged_in = false;
        this.settings.auth_token = '';
        this.user = {} as User;
        this.loadAPIData();
      } else {
        this.show_login_dialog = true;
      }
    },
    login() {
      this.requesting_login = true;
      PanthorApiService.validateAuthToken(this.settings.auth_token)
        .then((response) => {
          if (response.status === 'Success') {
            setTimeout(() => {
              this.requesting_login = false;
              this.logged_in = true;
              this.user.name = response.name;
              this.loadAPIData();
            }, 1000);
          } else {
            this.settings.auth_token = '';
            this.logged_in = false;
            this.requesting_login = false;
          }
        })
        .catch((error) => {
          this.logged_in = false;
          this.requesting_login = false;
          console.error(error);
        })
        .finally(() => {
          this.show_login_dialog = false;
        });
    },
    launchGame(mod: Mod | undefined, server: Server | undefined, profileName: string = '') {
      console.log(mod, server, profileName)

      if (mod === undefined && server === undefined) return

      let params = []

      if (mod === undefined && server !== undefined) {
        mod = this.api_data.mods.find((mod) => mod.id === server.mod_id)
      }

      if (mod) {
        params.push('-mod=' + mod.dir)
      }

      if (server) {
        params.push('-connect=' + server.ip);
        params.push('-port=' + server.port);
        if (server.password) {
          params.push('-password=' + server.password);
        }
      }

      if (profileName) params.push('-name=' + profileName);

      if (this.settings.noSplash) params.push('-noSplash');
      if (this.settings.skipIntro) params.push('-skipIntro');
      if (this.settings.enableHT) params.push('-enableHt');
      if (this.settings.windowed) params.push('-window');
      if (this.settings.noPause) params.push('-noPause');
      if (this.settings.noPauseAudio) params.push('-noPauseAudio');
      if (this.settings.setThreadCharacteristics) params.push('-setThreadCharacteristics');
      if (this.settings.showScriptErrors) params.push('-showScriptErrors');
      if (this.settings.command_line && this.settings.command_line.length > 0) {
        this.settings.command_line.split(' ').forEach((par) => {
          params.push(par);
        });
      }

      this.launch_params = params;
      this.launching_game = true;
      ipcRenderer.send('launchGame:request', params, this.settings.arma_path);

      setTimeout(() => {
        this.launching_game = false;
      }, 5000);
    }
  },
  watch: {
    /*
    'worker_status.fileop_progress'(newVal, oldVal) {
      console.log(this.worker_status.fileop_progress);
      ipcRenderer.send('winprogress-change', {
        progress: this.worker_status.fileop_progress,
      });
    },
    */
    'settings.arma_path': {
      handler: function (newVal, oldVal) {
        if (newVal !== oldVal) {
          ipcRenderer.send('settings:changedArmaPath', this.settings.arma_path);
        }
      }
    },
    settings: {
      handler: function (newVal, oldVal) {
        let store = new Store<SettingsStore>({
          defaults: defaultSettings,
        });

        store.store = newVal;
      },
      deep: true,
    },
    'api_data.mods'(newVal: Mod[], oldVal: Mod[]) {
      let mod_ids = [] as number[];

      if (oldVal.length == 0 || oldVal.length != newVal.length) {
        ipcRenderer.send('mods:init', newVal.map((mod) => mod.id));
        return;
      }

      newVal.forEach((mod_new) => {
        oldVal.forEach((mod_old) => {
          if (mod_new.id == mod_old.id) {
            if ((mod_new.version_hash != mod_old.version_hash) || (mod_new.files != mod_old.files) || (mod_new.dir != mod_old.dir) || (mod_new.has_files != mod_old.has_files) || (mod_new.appid != mod_old.appid)) {
              mod_ids.push(mod_new.id);
            }
          }
        });
      });

      if (mod_ids.length > 0) {
        ipcRenderer.send('mods:init', mod_ids);
      }
    },
  },
  mounted() {
    this.loadSettings();
    this.loadAPIData();
    this.getNews();
    ipcRenderer.on('worker:update', (_event, mod_id: number, message: string) => {
      let worker_status = <WorkerStatus>JSON.parse(message);

      this.api_data.mods.forEach((mod) => {
        if (mod.id === mod_id) {
          mod.worker_status = worker_status;

          this.api_data.servers.forEach((server) => {
            if (server.mod_id === mod_id) {
              if (worker_status.status === 1) {
                server.mod_ready = true
              } else {
                server.mod_ready = false
              }
            }
          });
        }
      });
    });
  },
  setup() {
    const twitch2 = ref(null)
    const { width, height } = useElementSize(twitch2)

    return {
      twitch2,
      width,
      height,
    }
  },
  components: { ModWindow, ChangelogWindow, ServerWindow, FaqWindow, HomeWindow, TfarWindow },
});
</script>

<style lang="css">
* {
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

html {
  overflow-y: auto !important;
}

.image-left {
  align-self: flex-start;
  width: auto;
  height: 100%;
}

.fade-enter-active {
  transition: all 0.6s ease-out;
}

.fade-leave-active {
  transition: all 0.6s cubic-bezier(1, 0.5, 0.8, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
