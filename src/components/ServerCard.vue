<template>
    <v-card flat>
        <v-row class="pt-3 pb-0">
            <v-col cols="4" class="pt-0 pb-0">
                <v-card-title>
                    Daten
                </v-card-title>
            </v-col>
            <v-col cols="4" class="pt-0 pb-0">
                <v-card-title>
                    Spieler
                </v-card-title>
            </v-col>
            <v-col cols="4" class="pt-0 pb-0 text-right">
                <v-chip append-icon="mdi-clock-alert-outline" class="mt-3 me-3">
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
                            <td v-if="ping === 0" class="text-right"><v-progress-circular indeterminate size="20" width="1"
                                    color="warning"></v-progress-circular></td>
                        </tr>
                        <tr>
                            <td>IP:Port</td>
                            <td class="text-right">{{ server.IpAddress }}:{{ server.Port }}</td>
                        </tr>
                        <tr>
                            <td>Mods</td>
                            <td class="text-right">{{ server.StartParameters }}</td>
                        </tr>
                        <tr>
                            <td>Passwort</td>
                            <td class="text-right" @click="copyToClipboard(server.ServerPassword)">{{ server.ServerPassword }}</td>
                        </tr>
                        <tr>
                            <td>Stand</td>
                            <td class="text-right">{{ new Date(server.updated_at.date).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            }) }}</td>
                        </tr>
                    </tbody>
                </v-table>
            </v-col>
            <v-col cols="4">
                <v-text-field label="Filter" density="compact" prepend-icon="mdi-account-search-outline"
                    v-model="player_search"></v-text-field>
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
                <Pie :data="pie_data" :options="pie_options" class="pa-5"></Pie>
            </v-col>
        </v-row>
        <v-divider thickness="6" class="mt-2"></v-divider>
        <v-row justify="end" class="mt-2 mb-0 me-2">
            <v-col cols="6" class="text-right pt-3  pb-0">
                <v-select label="Arma Profil auswählen" density="comfortable" persistent-hint hint="Arma Profil" single-line
                    placeholder="Arma Profil" variant="outlined" rounded="lg"
                    :items="['California', 'Colorado', 'Florida', 'Georgia', 'Texas', 'Wyoming']"></v-select>
            </v-col>
        </v-row>
        <v-row justify="end" class="mt-0 mb-2 me-2">
            <v-col cols="3" class="text-right pt-2">
                <v-btn color="red-lighten-1" block size="large" class="mt-1" prepend-icon="mdi-reload"
                    @click="$emit('load-api-data')">Aktualsieren</v-btn>
            </v-col>
            <v-col cols="3" class="text-right pt-2">
                <v-btn color="success" block size="large" class="mt-1" prepend-icon="mdi-connection">Joinen</v-btn>
            </v-col>
        </v-row>
    </v-card>
</template>
  
<script lang="ts">
import Server from '@/interfaces/ServerInterface';
import { PropType } from 'vue';
import { clipboard } from 'electron';

import {
    Chart as ChartJS,
    ArcElement
} from 'chart.js'

import { Pie } from 'vue-chartjs'

import { promise } from "ping";

ChartJS.register(ArcElement);

interface IPlayerWithType {
    name: string,
    color: string,
    icon: string
}

export default {
    name: "ModCard",
    data() {
        return {
            ping: 0,
            pie_options: {
                responsive: true,
                legend: {
                    display: true
                },
                tooltips: {
                    enabled: true
                }
            },
            player_search: '',
            restart_in: 0,
            intervalId: 0 as NodeJS.Timeout | number
        }
    },
    components: {
        Pie
    },
    computed: {
        players_list: function () {
            let list: IPlayerWithType[] = []

            this.server.Side.Civs.forEach((name: string) => {
                let player = <IPlayerWithType>{};
                player.name = name
                player.color = '#660080'
                player.icon = 'mdi-passport'

                list.push(player)
            });

            this.server.Side.Medics.forEach((name: string) => {
                let player = <IPlayerWithType>{};
                player.name = name
                player.color = '#008000'
                player.icon = 'mdi-hospital'

                list.push(player)
            });

            this.server.Side.Cops.forEach((name: string) => {
                let player = <IPlayerWithType>{};
                player.name = name
                player.color = '#004D99'
                player.icon = 'mdi-police-badge'

                list.push(player)
            });

            this.server.Side.RAC.forEach((name: string) => {
                let player = <IPlayerWithType>{};
                player.name = name
                player.color = '#800000'
                player.icon = 'mdi-car-wrench'

                list.push(player)
            });

            if (this.player_search != '') {
                return list.filter((player: IPlayerWithType) => {
                    return player.name.toLowerCase().includes(this.player_search.toLowerCase())
                })
            }

            return list
        },
        pie_data: function () {
            return {
                datasets: [{
                    data: [this.server.Civilians, this.server.Cops, this.server.Medics, this.server.Adac],
                    backgroundColor: [
                        '#660080',
                        '#004D99',
                        '#008000',
                        '#800000'
                    ],
                    labels: [
                        'Zivilisten',
                        'Polizei',
                        'Medics',
                        'RAC'
                    ]
                }]
            }
        }
    },
    props: {
        server: { type: Object as PropType<Server>, required: true }
    },
    watch: {
        server: function () {
            this.pingServer();
            clipboard.writeText(this.server.ServerPassword)
        }
    },
    methods: {
        copyToClipboard(text:string) {
            clipboard.writeText(text)
        },
        pingServer() {
            this.ping = 0;
            promise.probe(this.server.IpAddress).then((res) => {
                setTimeout(() => {
                    this.ping = parseInt(res.avg)
                }, 1000);
            });
        },
        updateTimeUntilNextTarget() {
            const targets = [6, 12, 18, 24];
            const now = new Date();
            const currentHour = now.getHours();
            const targetHour = targets.find(hour => hour > currentHour) || targets[0];
            const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour);

            this.restart_in = targetTime.getTime() - now.getTime();
        }
    },
    mounted() {
        this.intervalId = setInterval(this.updateTimeUntilNextTarget, 1000);
        this.pingServer();
    },
    beforeUnmount() {
        clearInterval(this.intervalId);
    },
}  
</script>
  