<template>
    <v-tabs centered color="red" v-model="tab">
        <v-tab v-for="(server, index) in servers" :key="index" :value="index">
          {{ server.Servername }}
        </v-tab>
      </v-tabs>
    <v-row>
        <v-col cols="12" class="mb-3">
            <v-window v-model="tab" v-for="server in servers">
              <v-window-item :value="tab">
                <server-card :server="server" @load-api-data="$emit('load-api-data')"></server-card>
              </v-window-item>
            </v-window>
        </v-col>
    </v-row>
</template>
  
<script lang="ts">
import ServerCard from '@/components/ServerCard.vue';
import Server from '@/interfaces/ServerInterface';

export default {
    name: "ServerWindow",
    props: {
        servers: { type: Array<Server>, required: true }
    },
    data() {
        return {
            tab: 0
        }
    },
    methods: {

    },
    computed: {
        scroll_height: () => { return (window.innerHeight - 100) + "px" }
    },
    components: { ServerCard }
}
</script>
  