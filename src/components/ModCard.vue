<template>
  <v-card flat>
    <v-img :height="single ? 500 : 230" :src="mod.img" cover>
      <v-btn color="white" flat icon="mdi-folder-open" rounded="sm" class="float-right mt-2 mr-2" size="small"
        @click="requestFolderOpen">
        <v-icon icon="mdi-folder-open"></v-icon>
        <v-tooltip activator="parent" location="bottom">Ordner öffnen</v-tooltip>
      </v-btn>
      <v-chip label variant="flat" :color="mod.worker_status.color" size="large" :prepend-icon="mod.worker_status.icon"
        class="float-left mt-2 ms-2" v-if="mod.worker_status">{{ mod.worker_status.message }}</v-chip>
    </v-img>
    <v-card-title class="text-center mt-2 mb-2 text-h5">
      {{ mod.name }}
    </v-card-title>
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
    <v-row justify="center" class="my-3" v-if="arma_path !== '' && mod.worker_status">
      <v-btn-group density="comfortable" divided>
        <v-btn color="success" prepend-icon="mdi-launch" @click="$emit('launch-game', mod)"
          v-if="mod.worker_status.status == UpdateStatus.INTACT">Starten</v-btn>
        <v-btn color="success" prepend-icon="mdi-download" @click="updateMod"
          v-if="(mod.worker_status.status == UpdateStatus.HASHED_UPDATE_REQUIRED || mod.worker_status.status == UpdateStatus.DOWNLOADED_UPDATE_REQUIRED || mod.worker_status.status == UpdateStatus.NOT_FOUND)"><span
            v-if="mod.worker_status.status == UpdateStatus.NOT_FOUND">Download</span><span v-else>Update</span></v-btn>
        <v-btn color="warning" prepend-icon="mdi-server" @click="$emit('open-server')"
          v-if="mod.worker_status.status == UpdateStatus.INTACT">Server</v-btn>
        <v-btn color="secondary" prepend-icon="mdi-file-cog" @click="verifyMod"
          v-if="(mod.worker_status.status != UpdateStatus.DOWNLOADING && mod.worker_status.status != UpdateStatus.HASHING && mod.worker_status.status != UpdateStatus.QUICK_HASHING)">Prüfen</v-btn>
        <v-btn color="primary" prepend-icon="mdi-stop" @click="stopMod"
          v-if="mod.worker_status.status == UpdateStatus.DOWNLOADING || mod.worker_status.status == UpdateStatus.HASHING || mod.worker_status.status == UpdateStatus.QUICK_HASHING">Abbruch</v-btn>
      </v-btn-group>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import { ipcRenderer } from 'electron';
import * as fs from 'fs';

import Mod from '@/interfaces/ModInterface';
import { PropType } from 'vue';
import { join } from 'node:path';
import { UpdateStatus } from '@/enums/UpdateStatusEnum';

export default {
  name: 'ModCard',
  emits: ['choose-armapath', 'open-server', 'launch-game'],
  props: {
    mod: { type: Object as PropType<Mod>, required: true },
    arma_path: { type: String, required: true },
    single: { type: Boolean, default: false },
  },
  data: () => {
    return {
      UpdateStatus: UpdateStatus
    }
  },
  methods: {
    verifyMod() {
      ipcRenderer.send('mod:verify', this.mod.id, true);
    },
    updateMod() {
      if (this.mod.worker_status.status == UpdateStatus.NOT_FOUND) {
        if (this.mod.dir_legacy) {
          if (fs.existsSync(join(this.arma_path, this.mod.dir_legacy))) {
            fs.renameSync(join(this.arma_path, this.mod.dir_legacy), join(this.arma_path, this.mod.dir));
          }
        }
      }

      ipcRenderer.send('mod:update', this.mod.id);
    },
    stopMod() {
      ipcRenderer.send('mod:stop', this.mod.id);
    },
    requestFolderOpen() {
      ipcRenderer.send('mod:openFolder', join(this.arma_path, this.mod.dir));
    },
    openServerTab() {

    }
  },
};
</script>
