<template>
  <v-app id="panthor-launcher">
    <v-app-bar class="px-3" color="black" flat density="compact">
      <v-img src="@/assets/Panthor_Header_Logo_Line.png"></v-img>

      <v-spacer></v-spacer>

      <v-tabs centered color="red" v-model="tab">
        <v-tab v-for="(link, index) in links" :key="link" :value="index">
          {{ link }}
        </v-tab>
      </v-tabs>
      <v-spacer></v-spacer>

      <v-btn :loading="loading_api_data" @click="loadAPIData" icon>
        <v-avatar class="hidden-sm-and-down" color="red" size="32"><v-tooltip text="Login"
            location="bottom"></v-tooltip><v-icon icon="mdi-refresh"></v-icon></v-avatar>
        <template v-slot:loader>
          <v-progress-circular indeterminate></v-progress-circular>
        </template>
      </v-btn>
      <v-btn icon><v-avatar class="hidden-sm-and-down" color="red" size="32"><v-tooltip text="Login"
            location="bottom"></v-tooltip><v-icon icon="mdi-login-variant"></v-icon></v-avatar></v-btn>

    </v-app-bar>

    <v-main class="bg-grey-lighten-3">
      <v-container :fluid="true">
        <v-row>
          <v-col cols="3">
            <v-card flat v-for="server in api_data.servers">
              <v-card-title> {{ server.Servername }} <v-progress-circular :model-value="server.Playercount / notZero(server.Slots) * 100"
                  color="red" :size="70" :width="8" class="float-right">{{ Math.round(server.Playercount / notZero(server.Slots) * 100) }}%</v-progress-circular><br><span class="text-h5"
                  style="font-size: 18px !important;">Online: {{ server.Playercount }} / {{ server.Slots
                  }}</span></v-card-title>
            </v-card>
            <v-card flat v-for="teamspeak in api_data.teamspeaks" class="mt-3">
              <v-card-title> Teamspeak <v-progress-circular :model-value="(teamspeak.Usercount / notZero(teamspeak.Slots)) * 100"
                  color="red" :size="70" :width="8" class="float-right">{{ Math.round((teamspeak.Usercount / notZero(teamspeak.Slots)) * 100) }}%</v-progress-circular><br><span class="text-h5"
                  style="font-size: 18px !important;">Online: {{ teamspeak.Usercount }} / {{ teamspeak.Slots }}</span></v-card-title>
            </v-card>
            <v-card flat min-height="100" class="mt-3" v-if="fileop_running">
              <v-card-title><v-icon icon="mdi-download-network-outline" size="small" class="float-right"></v-icon>
                Download Status</v-card-title>
              <v-row class="mt-3 mx-auto ps-5 pe-5">
                <v-progress-linear rounded striped v-model="fileop_progress" color="red" :height="25"
                  :stream="fileop_progress != 0" :indeterminate="fileop_progress == 0">
                  <strong v-if="fileop_progress > 0">{{ Math.ceil(fileop_progress) }}%</strong>
                  <strong v-if="fileop_progress == 0">Verbindungsaufbau</strong>
                </v-progress-linear>
              </v-row>
              <v-row class="text-center justify-center mb-0 mt-1">
                <v-col cols="auto" v-if="fileop_speed > 0">
                  <v-chip class="ma-2" color="success">
                    <v-icon start icon="mdi-speedometer-slow"></v-icon>
                    {{ humanFileSize(fileop_speed) }}
                  </v-chip>
                </v-col>
                <v-col cols="auto" v-if="fileop_files_remaining > 0">
                  <v-chip class="ma-2" color="success">
                    <v-icon start icon="mdi-file-multiple"></v-icon>
                    {{ fileop_files_done }} / {{ fileop_files_remaining }}
                  </v-chip>
                </v-col>
                <v-col cols="auto" v-if="fileop_time_remaining > 0">
                  <v-chip class="ma-2" color="success">
                    <v-icon start icon="mdi-clock-end"></v-icon>
                    {{ duration_humanizer.humanize(fileop_time_remaining) }}
                  </v-chip>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
          <v-col cols="9">
            <v-window v-model="tab">
              <v-window-item :value="0">
                <mod-window :mods="api_data.mods"></mod-window>
              </v-window-item>
              <v-window-item :value="1">
                <server-window :servers="api_data.servers"></server-window>
              </v-window-item>
              <v-window-item :value="2">
                <changelog-window :changelogs="api_data.changelogs"></changelog-window>
              </v-window-item>
            </v-window>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import ModWindow from '@/components/ModWindow.vue'
import ChangelogWindow from '@/components/ChangelogWindow.vue'
import ServerWindow from '@/components/ServerWindow.vue'
import { PropType, defineComponent } from 'vue'
import axios, { isCancel, AxiosError } from 'axios';

import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts/dist'
import Server from '@/interfaces/ServerInterface';
import Mod from '@/interfaces/ModInterface';
import Changelog from '@/interfaces/ChangelogInterface';
import Teamspeak from './interfaces/TeamspeakInterface';
const langService: HumanizeDurationLanguage = new HumanizeDurationLanguage()
const duration_humanizer = new HumanizeDuration(langService)


export default defineComponent({
  data() {
    return {
      links: [
        "Mods",
        "Server",
        "Changelog",
        "TFAR",
        "Settings",
        "FAQ"
      ],
      api_data: {
        mods: [] as Mod[],
        servers: [] as Server[],
        changelogs: [] as Changelog[],
        teamspeaks: [] as Teamspeak[]
      },
      tab: null,
      logged_in: false,
      fileop_progress: 50,
      fileop_speed: 14245060,
      fileop_running: true,
      fileop_files_done: 124,
      fileop_files_remaining: 1200,
      fileop_time_remaining: 1337,
      duration_humanizer: duration_humanizer,
      loading_api_data: false
    }
  },
  methods: {
    humanFileSize(bytes: number, si = false, dp = 1) {
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


      return bytes.toFixed(dp) + ' ' + units[u] + "/s";
    },
    loadAPIData() {
      if (!this.loading_api_data) {
        this.loading_api_data = true
        this.getMods()
      }
    },
    getMods() {
      let promises = [];

      promises.push(
        axios.get('https://api.panthor.de/v1/mods')
          .then((response) => {
            this.api_data.mods = response.data.data
          })
          .catch((error) => {
            console.log(error);
          }))
      promises.push(
        axios.get('https://api.panthor.de/v1/servers')
          .then((response) => {
            this.api_data.servers = response.data.data
          })
          .catch((error) => {
            console.log(error);
          }))
      promises.push(
        axios.get('https://api.panthor.de/v1/changelog')
          .then((response) => {
            this.api_data.changelogs = response.data.data
          })
          .catch((error) => {
            console.log(error);
          }))
      promises.push(
        axios.get('https://api.panthor.de/v1/teamspeaks')
          .then((response) => {
            this.api_data.teamspeaks = response.data.data
          })
          .catch((error) => {
            console.log(error);
          }))

      Promise.all(promises).then((results) => {
        this.loading_api_data = false
      })
    },
    notZero(input: number) {
      if (input === 0) {
        return 1
      } else {
        return input
      }
    }
  },
  mounted() {
    this.loadAPIData()
  },
  components: { ModWindow, ChangelogWindow, ServerWindow }
})

</script>
