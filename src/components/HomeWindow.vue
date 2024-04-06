<template>
  <v-row>
    <v-col cols="9">
      <v-card>
        <v-card-title>Willkommen bei Panthor Life <v-icon icon="mdi-human-greeting" size="small" class="float-right mt-1"
            color="primary"></v-icon></v-card-title>
        <v-card-text class="mt-2">
          <v-row>
            <v-col cols="3">
              <v-card color="black_bg" @click="openURL('https://panthor.de')">
                <v-card-title class="text-primary">Blog <v-icon icon="mdi-newspaper-variant-multiple-outline" size="small"
                    class="float-right mt-1" color="primary"></v-icon></v-card-title>
                <v-card-text>Hier erfahrt ihr mehr über unser Team und aktuelle Projekte.</v-card-text>
              </v-card>
            </v-col>
            <v-col cols="3">
              <v-card color="black_bg" @click="openURL('https://forum.panthor.de')">
                <v-card-title class="text-deep-purple-darken-2">Forum <v-icon icon="mdi-forum" size="small"
                    class="float-right mt-1" color="deep-purple-darken-2"></v-icon></v-card-title>
                <v-card-text>Tausche dich mit anderen Spielern aus, bewirb dich für Support & Fraktionen.</v-card-text>
              </v-card>
            </v-col>
            <v-col cols="3">
              <v-card color="black_bg" @click="openURL('https://discord.gg/Hf3XeAyn4h')">
                <v-card-title class="text-indigo">Discord <v-icon icon="mdi-message-text" size="small"
                    class="float-right mt-1" color="indigo"></v-icon></v-card-title>
                <v-card-text>Auf unserem Discord Server bist du immer am schnellsten informiert.</v-card-text>
              </v-card>
            </v-col>
            <v-col cols="3">
              <v-card color="black_bg" @click="openURL('https://wiki.panthor.de')">
                <v-card-title class="text-light-green">Wiki <v-icon icon="mdi-wikipedia" size="small"
                    class="float-right mt-1" color="light-green"></v-icon></v-card-title>
                <v-card-text>Im Wiki sind viele nützliche Informationen zu Panthor zu finden.</v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      <v-card @click="openURL('https://www.twitch.tv/panthorde')" class="mt-2">
        <v-card-title>Panthor auf Twitch <v-icon icon="mdi-twitch" size="small" class="float-right mt-1"
            color="deep-purple"></v-icon></v-card-title>
        <v-card-text ref="twitch">
          <iframe class="mt-2 shadow-lg rounded-lg" style="border: none;"
            src="https://api.panthor.de/v2/twitch_embed"
            :width="width" :height="width * 0.5625"></iframe>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="3">
      <v-card v-if="last_changeLog">
        <v-card-title>Letztes Update <v-icon icon="mdi-update" size="small" class="float-right"
            color="success"></v-icon></v-card-title>
        <v-card-text style="font-size: 18px" class="pt-0 pb-1">{{ new
          Date(last_changeLog.release_at).toLocaleDateString([], {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
          }) }} ({{ new Date(last_changeLog.release_at).toLocaleTimeString([], { hour: '2-digit' }) }})</v-card-text>
        <v-card-subtitle class="pb-2">{{ last_changeLog.version }}</v-card-subtitle>
      </v-card>
      <v-card class="mt-3">
        <v-card-title>Neueste Blogs<v-icon icon="mdi-newspaper-variant-multiple-outline" size="small" class="float-right"
            color="primary"></v-icon></v-card-title>
        <v-card-text class="pa-0">
          <v-list>
            <v-list-item v-for="article in news.slice(0, 10)" @click="openURL(article.link._text)"
              :title="article.title._text" :subtitle="article['dc:creator']._cdata">
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { ref } from 'vue'
import { useElementSize } from '@vueuse/core';
import Changelog from '@/interfaces/ChangelogInterface';
import { shell } from 'electron';
import News from '@/interfaces/NewsInterface';

export default {
  name: 'HomeWindow',
  data() {
    return {
      host: location.hostname
    };
  },
  methods: {
    openURL(url: string) {
      shell.openExternal(url);
    }
  },
  props: {
    changelogs: { type: Array<Changelog>, required: true },
    news: { type: Array<News>, required: true },
  },
  computed: {
    last_changeLog() {
      if (this.changelogs.length !== 0) {
        return this.changelogs[0]
      } else {
        return null
      }
    }
  },
  setup() {
    const twitch = ref(null)
    const { width, height } = useElementSize(twitch)

    return {
      twitch,
      width,
      height,
    }
  }
};
</script>
