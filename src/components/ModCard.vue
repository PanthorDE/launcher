<template>
  <v-card flat>
    <v-img height="300" :src="mod.img" cover>
      <v-btn
        color="white"
        flat
        icon="mdi-folder-open"
        rounded="sm"
        class="float-right mt-2 mr-2"
        size="small"
        @click="requestFolderOpen"
      >
        <v-icon icon="mdi-folder-open"></v-icon>
        <v-tooltip activator="parent" location="bottom">Ordner öffnen</v-tooltip>
      </v-btn>
    </v-img>
    <v-row justify="center" class="mt-2">
      <v-card-title class="text-center">{{ mod.name }}</v-card-title>
    </v-row>
    <v-row justify="center" class="mb-3">
      <v-card-subtitle class="text-center">{{ mod.desc }}</v-card-subtitle>
    </v-row>
    <v-row>
      <v-divider :thickness="6" color="black"></v-divider>
    </v-row>
    <v-row justify="center" class="mt-3 mb-1">
      <v-col cols="auto" v-if="arma_path === ''">
        <v-btn prepend-icon="mdi-folder-open" color="warning" @click="$emit('choose-armapath')">
          Arma 3 Pfad setzen
        </v-btn>
      </v-col>
    </v-row>
    <v-row justify="center" class="my-3" v-if="arma_path !== ''">
      <v-col cols="auto">
        <v-btn color="success" flat prepend-icon="mdi-download"> Download </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn color="warning" flat prepend-icon="mdi-file-cog" @click="checkMod"> Prüfen </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn color="red" flat prepend-icon="mdi-file-certificate-outline"> Bisign </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import { ipcRenderer } from 'electron';

import Mod from '@/interfaces/ModInterface';
import { PropType } from 'vue';
import { join } from 'node:path';

export default {
  name: 'ModCard',
  emits: ['choose-armapath'],
  props: {
    mod: { type: Object as PropType<Mod>, required: true },
    arma_path: { type: String, required: true },
  },
  methods: {
    checkMod() {
      ipcRenderer.send('mod:verify', this.mod.id);
    },
    requestFolderOpen() {
      ipcRenderer.send('mod:openFolder', join(this.arma_path, this.mod.dir));
    },
  },
};
</script>
