<template>
  <v-row>
    <v-col cols="12">
      <v-expansion-panels>
        <v-expansion-panel v-for="(question, i) in questions" :key="i" :title="question.title">
          <v-expansion-panel-text v-html="question.text" class="pa-5 ms-5"></v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>
  </v-row>
</template>

<script lang="ts">
export default {
  name: 'FaqWindow',
  data() {
    return {
      questions: [
        {
          title: 'Du wirst beim Joinen auf den Server gekickt ("Verbindung zur Sitzung abgebrochen"/"Session Lost")',
          text: 'Nutze den Button "Bisign" zum Löschen der .bisign Dateien und Prüfen der Mods.',
        },
        {
          title: 'Du wirst beim Joinen auf den Server gekickt wegen "Sie können diese Mission nicht spielen..."',
          text: '<ul><li>Gehe 100% sicher, dass die Panthor-Mods geladen werden, dies istsichtbar am Panthor-Logo im Hauptmenü.</li><li>Fehler hierbei können unter anderem durch mehrere ArmaInstallationen entstehen. Der Panthor Launcher startet die ArmaInstallation, die im Pfad ausgewählt ist und nicht die, dieSteam möglicherweise verwendet!</li><li>Melde dich im Support, falls du das Problem nicht selber behbenkannst. Dort wird dir immer geholfen :)</li></ul>',
        },
        {
          title: 'Ein Bug im Launcher! Was nun ?',
          text: 'Melde deinen Bug im&nbsp;<a target="_blank" href="https://discord.gg/Hf3XeAyn4h">Discord Bugtracker</a>&nbsp;oder via&nbsp;<a target="_blank" href="https://github.com/PanthorDE/launcher/issues">GitHub</a>.',
        },
      ],
    };
  },
};
</script>
