<template>
  <v-tabs centered color="red" v-model="tab">
    <v-tab v-for="(server, index) in servers" :key="index" :value="index">
      {{ server.name }}
    </v-tab>
  </v-tabs>
  <v-row>
    <v-col cols="12" class="mb-3">
      <server-card :server="selected_server" @load-api-data="$emit('load-api-data')" @switch-tab="$emit('switch-tab', 0)" :reload_allowed="reload_allowed"></server-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import ServerCard from '@/components/ServerCard.vue';
import Server from '@/interfaces/ServerInterface';

export default {
  name: 'ServerWindow',
  emits: ['load-api-data', 'switch-tab'],
  props: {
    servers: { type: Array<Server>, required: true },
    default_tab: { type: Number, default: 0 },
    reload_allowed: { type: Boolean },
  },
  data() {
    return {
      tab: 0,
    };
  },
  mounted() {
    this.tab = this.default_tab;
  },
  methods: {
    setTab(tab: number) {
      this.tab = tab;
    },
  },
  computed: {
    scroll_height: () => {
      return window.innerHeight - 100 + 'px';
    },
    selected_server: function () {
      return this.servers[this.tab];
    },
  },
  components: { ServerCard },
};
</script>
