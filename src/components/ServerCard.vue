<template>
    <v-card flat>
        <v-card-title>{{ server.Servername }}</v-card-title>
        <v-row>
            <v-col cols="4">

            </v-col>
            <v-col cols="4">
                <v-card-title>
                    Spieler
                </v-card-title>

                <v-divider></v-divider>

                <v-virtual-scroll :items="players_list" height="320"  class="mb-4">
                    <template v-slot:default="{ item }">
                        <v-list-item :title="item.name" density="compact" :color="item.color">
                            <template v-slot:append>
                                <v-icon :icon="item.icon"></v-icon>
                            </template>
                        </v-list-item>
                    </template>
                </v-virtual-scroll>
            </v-col>
            <v-col cols="4">

            </v-col>
        </v-row>
    </v-card>
</template>
  
<script lang="ts">
import Server from '@/interfaces/ServerInterface';
import { PropType } from 'vue';

interface IPlayerWithType {
    name: string,
    color: string,
    icon: string
}

export default {
    name: "ModCard",
    data() {
        return {
        }
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
        }
    },
    props: {
        server: { type: Object as PropType<Server>, required: true }
    }
}  
</script>
  