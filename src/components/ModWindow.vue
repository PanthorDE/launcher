<template>
  <v-row>
    <v-col :cols="(mods.length === 1) ? 12:6" v-for="mod in mods">
      <mod-card :mod="mod" :arma_path="arma_path" @choose-armapath="$emit('choose-armapath')" @open-server="$emit('open-server')" @launch-game="launchGame" :single="mods.length === 1"></mod-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import ModCard from '@/components/ModCard.vue';
import Mod from '@/interfaces/ModInterface';

export default {
  name: 'ModWindow',
  emits: ['choose-armapath', 'open-server', 'launch-game'],
  props: {
    mods: { type: Array<Mod>, required: true },
    arma_path: { type: String, required: true },
  },
  data() {
    return {};
  },
  methods: {
    launchGame(mod: Mod) {
      this.$emit('launch-game', mod);
    },
  },
  components: { ModCard },
};
</script>
