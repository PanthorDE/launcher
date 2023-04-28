<template>
    <v-row>
        <v-col cols="12" style="overflow-y: scroll;" :style="{ 'max-height': scroll_height }" class="mb-3">
            <v-row v-for="server in servers">
                <v-col>
                    <server-card :server="server" @load-api-data="$emit('load-api-data')"></server-card>
                </v-col>
            </v-row>
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
  