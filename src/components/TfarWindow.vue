<template>
  <v-card style="margin-bottom: 1rem">
    <v-card-item>
      <v-card-title>Task Force Radio installieren</v-card-title>
      <v-card-subtitle>This is a subtitle</v-card-subtitle>
    </v-card-item>

    <v-card-item>
      <p>Bitte folge diesen Anweisungen, um das Task Force Arma Radio Plugin zu installieren:</p>
      <ol style="margin-left: 1rem">
        <li>Stelle sicher, dass Teamspeak vor der Installation geschlossen ist.</li>
        <li>Lade die <code>.ts3_plugin</code> Datei herunter, indem du den "Plugin Download" Button unten klickst.</li>
        <li>
          Falls die automatische Ausführung fehlschlägt, öffne den heruntergeladenen Ordner in deinem
          Download-Verzeichnis.
        </li>
        <li>Du findest darin ein "Panthor" Verzeichnis mit dem Plugin.</li>
        <li>Entpacke den Inhalt des "Panthor" Verzeichnisses manuell in den Teamspeak-Installationsordner.</li>
      </ol>

      <p>Benötigst du Hilfe oder hast du Probleme? Melde dich bitte bei unserem Support-Team!</p>
    </v-card-item>

    <v-card-actions>
      <!-- ng-click="initFileDownload('PanthorTFAR_latest.ts3_plugin')" -->
      <v-tooltip text="Benötigt TeamSpeak 3.1.0.1+">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" variant="flat" color="primary">Plugin Download</v-btn>
        </template>
      </v-tooltip>
    </v-card-actions>
  </v-card>

  <v-card style="margin-bottom: 1rem">
    <v-card-item>
      <v-card-title>Theme installieren</v-card-title>
      <v-card-subtitle>Panthor Skin & Iconpack installieren</v-card-subtitle>
    </v-card-item>

    <v-card-item>
      <p>Bitte folge diesen Anweisungen, um den TeamSpeak 3 Skin und das Icon Pack im Panthor-Stil zu installieren:</p>
      <ol style="margin-left: 1rem">
        <li>Stelle sicher, dass Teamspeak vor der Installation geschlossen ist.</li>
        <li>Lade die <code>.ts3_addon</code> Datei herunter, indem du den "Skin Download" Button unten klickst.</li>
        <li>Führe den Installationsassistenten aus und starte die Installation.</li>
      </ol>
    </v-card-item>

    <v-card-actions>
      <!-- ng-click="initFileDownload('PanthorSkin.ts3_addon')" -->
      <v-tooltip text="Skin by Kaibu">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" variant="flat" color="primary">Skin Download</v-btn>
        </template>
      </v-tooltip>
    </v-card-actions>
  </v-card>

  <v-card>
    <v-card-item>
      <v-card-title>Soundpad installieren</v-card-title>
      <!-- <v-card-subtitle></v-card-subtitle> -->
    </v-card-item>

    <v-card-item>
      <p>
        Bitte folge diesen Anweisungen, um ein TeamSpeak 3 Soundpack zu installieren welches unnötige Sound entfernt:
      </p>
      <ol style="margin-left: 1rem">
        <li>Stelle sicher, dass Teamspeak vor der Installation geschlossen ist.</li>
        <li>
          Lade die <code>.ts3_soundpack</code> Datei herunter, indem du den "Soundpack Download" Button unten klickst.
        </li>
        <li>Führe den Installationsassistenten aus und starte die Installation.</li>
      </ol>

      <p>
        <br />
        <strong>Tipp!</strong> Ihr könnt für einzelne Lesezeichen in Teamspeak einzelne Soundpacks zuweisen, so hört ihr
        auf anderen Teamspeaks weiterhin alles.
      </p>
    </v-card-item>

    <v-card-actions>
      <!-- ng-click="initFileDownload('Panthor.ts3_soundpack')" -->
      <v-btn variant="flat" color="primary">Soundpack Download</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
export default {
  name: 'TfarWindow',
};
</script>
