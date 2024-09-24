<template>
  <v-card style="margin-bottom: 1rem">
    <v-card-item>
      <v-card-title>Task Force Radio installieren (nur für Teamspeak 3 verfügbar) <v-chip label class="float-right" prepend-icon="mdi-asterisk"
          color="primary">Benötigt</v-chip></v-card-title>
    </v-card-item>

    <v-card-item>
      <ol style="margin-left: 1rem">
        <li>Stelle sicher, dass Teamspeak 3 vor der Installation vollständig geschlossen ist.</li>
        <li>Lade die <code>.ts3_plugin</code> Datei herunter, indem du den "Plugin Download" Button unten klickst.</li>
        <li>
          Falls die automatische Ausführung fehlschlägt, öffne den heruntergeladenen "Panthor" Ordner in deinem
          Download-Verzeichnis.
        </li>
        <li>Entpacke den Inhalt manuell in den Teamspeak-Installationsordner.</li>
      </ol>

      <p>Benötigst du Hilfe oder hast du Probleme? Melde dich bitte bei unserem Support-Team im Teamspeak Channel: "Warte auf Support"!</p>
    </v-card-item>

    <v-card-actions>
      <!-- ng-click="initFileDownload('PanthorTFAR_latest.ts3_plugin')" -->
      <v-tooltip text="Benötigt TeamSpeak 3.1.0.1+">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" variant="flat" :color="TfarDownloadStatusColors[tfar_status]" @click="downloadTFAR"
            :disabled="tfar_status == 1"><v-icon :icon="TfarDownloadStatusIcons[tfar_status]"
              class="me-2"></v-icon> {{ TfarDownloadStatusTexts[tfar_status] }}</v-btn>
        </template>
      </v-tooltip>
    </v-card-actions>
  </v-card>

  <v-card style="margin-bottom: 1rem">
    <v-card-item>
      <v-card-title>Theme installieren <v-chip label class="float-right" prepend-icon="mdi-plus"
          color="success">Optional</v-chip></v-card-title>
    </v-card-item>

    <v-card-item>
      <ol style="margin-left: 1rem">
        <li>Stelle sicher, dass Teamspeak vor der Installation vollständig geschlossen ist.</li>
        <li>Lade die <code>.ts3_addon</code> Datei herunter, indem du den "Skin Download" Button unten klickst.</li>
        <li>Der Installationsassistent von Teamspeak öffnet sich, klicke hier auf "Installieren".</li>
      </ol>
    </v-card-item>

    <v-card-actions>
      <!-- ng-click="initFileDownload('PanthorSkin.ts3_addon')" -->
      <v-tooltip text="Skin by Kaibu">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" variant="outlined" :color="TfarDownloadStatusColors[skin_status]" @click="downloadSkin"
            :disabled="skin_status == 1"><v-icon :icon="TfarDownloadStatusIcons[skin_status]"
              class="me-2"></v-icon> {{ TfarDownloadStatusTexts[skin_status] }}</v-btn>
        </template>
      </v-tooltip>
    </v-card-actions>
  </v-card>

  <v-card>
    <v-card-item>
      <v-card-title>Soundpack installieren <v-chip label class="float-right" prepend-icon="mdi-plus"
          color="success">Optional</v-chip></v-card-title>
    </v-card-item>

    <v-card-item>
      <p>
        Das TeamSpeak 3 Soundpack entfernt unnötige Sounds (z.B. User Join/Leave)
      </p>
      <ol style="margin-left: 1rem">
        <li>Stelle sicher, dass Teamspeak vor der Installation vollständig geschlossen ist.</li>
        <li>
          Lade die <code>.ts3_soundpack</code> Datei herunter, indem du den "Soundpack Download" Button unten klickst.
        </li>
        <li>Der Installationsassistent von Teamspeak öffnet sich, klicke hier auf "Installieren".</li>
      </ol>

      <p>
        <br />
        <strong>Tipp!</strong> Ihr könnt für einzelne Lesezeichen in Teamspeak einzelne Soundpacks zuweisen, so hört ihr
        auf anderen Teamspeaks weiterhin alles.
      </p>
    </v-card-item>

    <v-card-actions>
      <!-- ng-click="initFileDownload('Panthor.ts3_soundpack')" -->
      <v-tooltip text="Skin by Kaibu">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" variant="outlined" :color="TfarDownloadStatusColors[sound_status]"
            @click="downloadSound" :disabled="sound_status == 1"><v-icon
              :icon="TfarDownloadStatusIcons[sound_status]" class="me-2"></v-icon> {{
                TfarDownloadStatusTexts[sound_status] }}</v-btn>
        </template>
      </v-tooltip>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { ipcRenderer } from 'electron';

import { TfarDownloadStatus, TfarDownloadStatusTexts, TfarDownloadStatusColors, TfarDownloadStatusIcons } from '@/enums/TfarDownloadStatusEnum';

export default {
  name: 'TfarWindow',
  data() {
    return {
      tfar_status: TfarDownloadStatus.READY,
      skin_status: TfarDownloadStatus.READY,
      sound_status: TfarDownloadStatus.READY,
      TfarDownloadStatusTexts: TfarDownloadStatusTexts,
      TfarDownloadStatusColors: TfarDownloadStatusColors,
      TfarDownloadStatusIcons: TfarDownloadStatusIcons,
    }
  },
  methods: {
    downloadTFAR() {
      ipcRenderer.send('dl:tfar');
    },
    downloadSkin() {
      ipcRenderer.send('dl:skin');
    },
    downloadSound() {
      ipcRenderer.send('dl:sound');
    }
  },
  mounted() {
    ipcRenderer.on('dl:tfar:status', (event, data) => {
      this.tfar_status = data
    });
    ipcRenderer.on('dl:skin:status', (event, data) => {
      this.skin_status = data
    });
    ipcRenderer.on('dl:sound:status', (event, data) => {
      this.sound_status = data
    });
  },
};
</script>
