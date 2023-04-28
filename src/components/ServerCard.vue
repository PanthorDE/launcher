<template>
    <v-card flat>
        <v-card-title>{{ server.Servername }}</v-card-title>
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
        </v-row>
        <v-row>
            <v-col cols="4">
                <v-table class="ms-3">
                    <tbody>
                        <tr>
                            <td>Ping</td>
                            <td v-if="ping !== 0" class="text-right">{{ ping }}ms</td>
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
                            <td class="text-right">{{ server.ServerPassword }}</td>
                        </tr>
                        <tr>
                            <td>Stand</td>
                            <td class="text-right">{{ server.StartParameters }}</td>
                        </tr>
                    </tbody>
                </v-table>
            </v-col>
            <v-col cols="4">
                <v-virtual-scroll :items="players_list" height="320" class="mb-4">
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

import {
    Chart as ChartJS,
    ArcElement
} from 'chart.js'

import { Pie } from 'vue-chartjs'


ChartJS.register(ArcElement);

//import ping from 'ping'; // @vite-ignore

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
            }
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
            /*
            ping.promise.probe(this.server.IpAddress)
                .then((res) => {
                    this.ping = +res.avg
                })
                */
        }
    }
}  
</script>
  