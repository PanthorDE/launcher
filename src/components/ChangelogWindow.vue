<template>
    <v-row>
        <v-col cols="3">
            <v-card>
                <v-list density="compact">
                    <v-list-subheader>Updates</v-list-subheader>
                    <v-list-item v-for="(changelog, i) in changelogs" :key="i" :value="changelog" active-color="primary"
                        @click="scrollTo('#' + i)">
                        <v-list-item-title v-text="`${changelog.version} - ${(new Date(changelog.release_at)).toLocaleTimeString()}`"></v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-card>
        </v-col>
        <v-col cols="9" style="overflow-y: scroll;" :style="{ 'max-height': scroll_height }">
            <v-card v-for="(changelog, i) in changelogs" class="mb-3" :id="'#' + i">
                <v-card-title>{{ changelog.version }}</v-card-title>
                <v-card-subtitle v-if="changelog.change_mission.length > 0">Mission</v-card-subtitle>
                <v-card-text v-if="changelog.change_mission.length > 0">
                    <ul class="ms-5">
                        <li v-for="change in changelog.change_mission">{{ change }}</li>
                    </ul>
                </v-card-text>
                <v-card-subtitle v-if="changelog.change_map.length > 0">Map</v-card-subtitle>
                <v-card-text v-if="changelog.change_map.length > 0">
                    <ul class="ms-5">
                        <li v-for="change in changelog.change_map">{{ change }}</li>
                    </ul>
                </v-card-text>
                <v-card-subtitle v-if="changelog.change_mod.length > 0">Mod</v-card-subtitle>
                <v-card-text v-if="changelog.change_mod.length > 0">
                    <ul class="ms-5">
                        <li v-for="change in changelog.change_mod">{{ change }}</li>
                    </ul>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>
  
<script lang="ts">

import Changelog from '@/interfaces/ChangelogInterface';

export default {
    name: "ChangelogWindow",
    props: {
        changelogs: { type: Array<Changelog>, required: true }
    },
    data() {
        return {
        }
    },
    methods: {
        scrollTo: (target: string) => {
            document.getElementById(target)!.scrollIntoView();
        }
    },
    computed: {
        scroll_height: () => { return (window.innerHeight - 100) + "px" }
    },
    components: {}
}
</script>
  