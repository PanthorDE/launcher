<template>
  <v-card flat>
    <v-row class="pt-3 pb-0">
      <v-col cols="4" class="pt-0 pb-0">
        <v-card-title>Daten</v-card-title>
      </v-col>
      <v-col cols="4" class="pt-0 pb-0">
        <v-card-title>Spieler</v-card-title>
      </v-col>
      <v-col cols="4" class="pt-0 pb-0 text-right">
        <v-chip prepend-icon="mdi-clock-alert-outline" class="mt-3 me-3">
          Restart in {{ new Date(restart_in).toISOString().substr(11, 8) }}
        </v-chip>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="4">
        <v-table class="ms-3">
          <tbody>
            <tr>
              <td>Ping</td>
              <td v-if="ping !== 0" class="text-right">{{ ping }} ms</td>
              <td v-if="ping === 0" class="text-right">
                <v-progress-circular indeterminate size="20" width="1" color="warning"></v-progress-circular>
              </td>
            </tr>
            <tr>
              <td>IP:Port</td>
              <td class="text-right">{{ server.ip }}:{{ server.port }}</td>
            </tr>
            <tr>
              <td>Mods</td>
              <td class="text-right">{{ server.params }}</td>
            </tr>
            <tr>
              <td>Passwort</td>
              <td class="text-right" @click="copyToClipboard(server.password)">
                {{ server.password }}
              </td>
            </tr>
            <tr>
              <td>Stand</td>
              <td class="text-right">
                {{
                  new Date(server.updated_at.date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }}
              </td>
            </tr>
          </tbody>
        </v-table>
        <v-card class="ps-4" v-if="server.desc !== null && server.desc != ''" flat>
          <v-card-subtitle class="ps-3">Beschreibung</v-card-subtitle>
          <v-card-text>{{ server.desc }}</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-text-field
          label="Suchen"
          density="compact"
          variant="solo-filled"
          prepend-inner-icon="mdi-account-search-outline"
          v-model="player_search"
          clearable
          flat
        >
        </v-text-field>
        <v-virtual-scroll :items="players_list" height="330">
          <template v-slot:default="{ item }">
            <v-list-item :title="item.name" density="compact">
              <template v-slot:append>
                <v-icon :icon="item.icon" :color="item.color"></v-icon>
              </template>
            </v-list-item>
          </template>
        </v-virtual-scroll>
      </v-col>
      <v-col cols="4">
        <Pie :data="pie_data" :options="pie_options" class="pt-5"></Pie>
      </v-col>
    </v-row>
    <v-divider thickness="6" class="mt-2"></v-divider>
    <v-row justify="end" align="center" class="px-4 py-4">
      <v-col cols="4">
        <v-select
          label="Arma Profil"
          placeholder="Arma Profil wählen"
          density="comfortable"
          single-line
          variant="solo-filled"
          flat
          hide-details
          :items="['California', 'Colorado', 'Florida', 'Georgia', 'Texas', 'Wyoming']"
        ></v-select>
      </v-col>
      <v-col cols="2"></v-col>
      <v-col cols="3">
        <v-btn color="red-lighten-1" block size="large" prepend-icon="mdi-reload" @click="$emit('load-api-data')"
          >Aktualsieren</v-btn
        >
      </v-col>
      <v-col cols="3">
        <v-btn color="success" block size="large" prepend-icon="mdi-connection">Joinen</v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import Server from '@/interfaces/ServerInterface';
import { PropType } from 'vue';
import { clipboard } from 'electron';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

import { Pie } from 'vue-chartjs';

import { promise } from 'ping';

ChartJS.register(ArcElement, Tooltip, Legend);

interface IPlayerWithType {
  name: string;
  color: string;
  icon: string;
}

export default {
  name: 'ModCard',
  emits: ['load-api-data'],
  data() {
    return {
      ping: 0,
      pie_options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#fff',
              boxHeight: 20,
            },
          },
        },
        animation: {
          animateScale: true,
        },
        tooltips: {
          displayColors: false,
        },
      },
      player_search: '',
      restart_in: 0,
      intervalId: 0 as NodeJS.Timeout | number,
    };
  },
  components: {
    Pie,
  },
  computed: {
    players_list: function () {
      let list: IPlayerWithType[] = [];

      if (this.server.gamemode != 1) {
        this.server.players.forEach((name: string) => {
          list.push({
            name,
            color: '#660080',
            icon: 'mdi-account',
          });
        });

        return list;
      }

      this.server.sides.civ.forEach((name: string) => {
        list.push({
          name,
          color: '#660080',
          icon: 'mdi-passport',
        });
      });

      this.server.sides.medic.forEach((name: string) => {
        list.push({
          name,
          color: '#008000',
          icon: 'mdi-hospital',
        });
      });

      this.server.sides.cop.forEach((name: string) => {
        list.push({
          name,
          color: '#004D99',
          icon: 'mdi-police-badge',
        });
      });

      this.server.sides.rac.forEach((name: string) => {
        list.push({
          name,
          color: '#800000',
          icon: 'mdi-car-wrench',
        });
      });

      if (this.player_search != '') {
        list = list.filter((player: IPlayerWithType) => {
          return player.name.toLowerCase().includes(this.player_search.toLowerCase());
        });
      }

      list.sort((a: IPlayerWithType, b: IPlayerWithType) => {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      });

      return list;
    },
    pie_data: function () {
      return {
        datasets: [
          {
            data: [
              this.server.sides.civ.length,
              this.server.sides.cop.length,
              this.server.sides.medic.length,
              this.server.sides.rac.length,
            ],
            backgroundColor: ['#660080', '#004D99', '#008000', '#800000'],
          },
        ],
        labels: ['Zivilisten', 'Polizei', 'Medics', 'RAC'],
      };
    },
  },
  props: {
    server: { type: Object as PropType<Server>, required: true },
  },
  watch: {
    'server.server.updated_at.date': function () {
      this.pingServer();
      clipboard.writeText(this.server.password);
    },
  },
  methods: {
    copyToClipboard(text: string) {
      clipboard.writeText(text);
    },
    pingServer() {
      this.ping = 0;
      promise.probe(this.server.ip).then((res) => {
        setTimeout(() => {
          this.ping = parseInt(res.avg);
        }, 1000);
      });
    },
    updateTimeUntilNextTarget() {
      const targets = [6, 12, 18, 24];
      const now = new Date();
      const currentHour = now.getHours();
      const targetHour = targets.find((hour) => hour > currentHour) || targets[0];
      const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour);

      this.restart_in = targetTime.getTime() - now.getTime();
    },
  },
  mounted() {
    this.updateTimeUntilNextTarget();
    this.intervalId = setInterval(this.updateTimeUntilNextTarget, 1000);
    this.pingServer();
  },
  beforeUnmount() {
    clearInterval(this.intervalId);
  },
};
</script>
