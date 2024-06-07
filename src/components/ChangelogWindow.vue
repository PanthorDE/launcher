<template>
  <v-row>
    <v-col cols="3">
      <v-card :style="{ 'max-height': `${scroll_height-100}px` }">
        <v-card-title>Versionen <v-icon class="float-right" icon="mdi-tag-multiple"></v-icon></v-card-title>
        <v-list density="compact"  style="overflow-y: auto; height: 100%">
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
        <v-card-actions>
          <v-btn @click="openURL('https://info.panthor.de/changelog')" block color="primary" variant="outlined" prepend-icon="mdi-open-in-new">Alle Changelogs</v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
    <v-col cols="9" style="overflow-y: scroll" :style="{ 'max-height': `${scroll_height-88}px` }" id="scrollContainer">
      <v-card v-for="(changelog, i) in changelogs" class="mb-3" :id="'entry' + i">
        <v-card-title>{{ changelog.version }}
          <span class="float-right">{{ `${new Date(changelog.release_at).toLocaleDateString([], {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
          })} - ${new Date(changelog.release_at).toLocaleTimeString([], { hour: '2-digit' })}` }}</span>
        </v-card-title>
        <v-card-text v-if="changelog.note">
          <v-code>{{ changelog.note }}</v-code>
        </v-card-text>
        <v-card-subtitle v-if="changelog.change_mission.length > 0"><v-icon icon="mdi-map"></v-icon>
          Mission <span v-if="changelog.size" class="float-end text-primary"><v-icon icon="mdi-file-download"></v-icon>
          {{ changelog.size }} Download</span></v-card-subtitle>
        <v-card-text v-if="changelog.change_mission.length > 0">
          <v-list density="compact" class="pt-0">
            <v-list-item v-for="change in changelog.change_mission">
              <v-list-item-title class=""><v-icon :icon="getChangeIcon(change)" class="me-2"></v-icon> {{ formatChangeText(change) }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-subtitle v-if="changelog.change_map.length > 0"><v-icon icon="mdi-terrain"></v-icon>
          Map</v-card-subtitle>
        <v-card-text v-if="changelog.change_map.length > 0">
          <v-list density="compact" class="pt-0">
            <v-list-item v-for="change in changelog.change_map">
              <v-list-item-title class=""><v-icon :icon="getChangeIcon(change)" class="me-2"></v-icon> {{ formatChangeText(change) }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-subtitle v-if="changelog.change_mod.length > 0"><v-icon icon="mdi-car"></v-icon> Mod</v-card-subtitle>
        <v-card-text v-if="changelog.change_mod.length > 0">
          <v-list density="compact" class="pt-0">
            <v-list-item v-for="change in changelog.change_mod">              
              <v-list-item-title class=""><v-icon :icon="getChangeIcon(change)" class="me-2"></v-icon> {{ formatChangeText(change) }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Changelog from '@/interfaces/ChangelogInterface';
import PanthorUtils from '@/services/PanthorUtils.service';
import { shell } from 'electron';
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
    return {
      human_file_size: PanthorUtils.humanFileSize,
    };
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
    getChangeIcon(change: string) {
      if (change.includes('Hinzugefügt')) {
        return 'mdi-plus';
      }
      if (change.includes('Bearbeitet')) {
        return 'mdi-pencil-outline';
      }
      if (change.includes('Behoben')) {
        return 'mdi-wrench-outline';
      }
      if (change.includes('Entfernt')) {
        return 'mdi-minus';
      }
      return 'mdi-'
    },
    formatChangeText(change: string) {
      return change.replace("Hinzugefügt:", "").replace("Behoben:", "").replace("Bearbeitet:", "").replace("Entfernt:", "");
    },
    openURL(url: string) {
      shell.openExternal(url);
    },
  },
  computed: {
    scroll_height: () => {
      return window.innerHeight;
    },
  },
  components: {},
};
</script>

<style scoped>
li {
  list-style-type: none;
}
</style>