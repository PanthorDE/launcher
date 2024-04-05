<template>
  <v-row>
    <v-col cols="3">
      <v-card>
        <v-card-title>Versionen <v-icon class="float-right" icon="mdi-tag-multiple"></v-icon></v-card-title>
        <v-list density="compact">
          <v-list-item v-for="(changelog, i) in changelogs" :key="i" :value="changelog" color="primary"
            @click="scrollTo('#entry' + i)">
            <v-list-item-title>
              {{ changelog.version }} <span class="float-right">{{ `${new
            Date(changelog.release_at).toLocaleDateString([], {
              month: '2-digit',
              day: '2-digit',
              year: '2-digit',
            })} - ${new Date(changelog.release_at).toLocaleTimeString([], { hour: '2-digit' })}` }}</span>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
    <v-col cols="9" style="overflow-y: scroll" :style="{ 'max-height': scroll_height }" id="scrollContainer">
      <v-card v-for="(changelog, i) in changelogs" class="mb-3" :id="'entry' + i">
        <v-card-title>{{ changelog.version }}
          <span class="float-right">{{ `${new Date(changelog.release_at).toLocaleDateString([], {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
          })} - ${new Date(changelog.release_at).toLocaleTimeString([], { hour: '2-digit' })}` }}</span>
          </v-card-title>
        <v-card-subtitle v-if="changelog.change_mission.length > 0"><v-icon icon="mdi-map"></v-icon> Mission</v-card-subtitle>
        <v-card-text v-if="changelog.change_mission.length > 0">
          <ul class="ms-5">
            <li v-for="change in changelog.change_mission">{{ change }}</li>
          </ul>
        </v-card-text>
        <v-card-subtitle v-if="changelog.change_map.length > 0"><v-icon icon="mdi-terrain"></v-icon> Map</v-card-subtitle>
        <v-card-text v-if="changelog.change_map.length > 0">
          <ul class="ms-5">
            <li v-for="change in changelog.change_map">{{ change }}</li>
          </ul>
        </v-card-text>
        <v-card-subtitle v-if="changelog.change_mod.length > 0"><v-icon icon="mdi-car"></v-icon> Mod</v-card-subtitle>
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
import { useGoTo } from 'vuetify'

export default {
  name: 'ChangelogWindow',
  props: {
    changelogs: { type: Array<Changelog>, required: true },
  },
  setup() {
    const goTo = useGoTo()
    return { goTo }
  },
  data() {
    return {};
  },
  methods: {
    scrollTo(target: string) {
      this.goTo(target, {
        container: '#scrollContainer',
        duration: 1000,
        easing: 'easeInOutCubic',
        offset: -13,
      });
    },
  },
  computed: {
    scroll_height: () => {
      return window.innerHeight - 100 + 'px';
    },
  },
  components: {},
};
</script>
