<template>
    <v-tabs centered color="red" v-model="tab">
        <v-tab v-for="(server, index) in servers" :key="index" :value="index">
            {{ server.Servername }}
        </v-tab>
    </v-tabs>
    <v-row>
        <v-col cols="12" class="mb-3">
            <server-card :server="selected_server"></server-card>
        </v-col>
    </v-row>
</template>
  
<script lang="ts">
import ServerCard from '@/components/ServerCard.vue';
import Server from '@/interfaces/ServerInterface';

export default {
    name: "ServerWindow",
    emits: ["load-api-data"],
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
        scroll_height: () => { return (window.innerHeight - 100) + "px" },
        selected_server: function () {
            return this.servers[this.tab]
        }
    },
    components: { ServerCard }
}
</script>
  