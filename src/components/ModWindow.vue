<template>
    <v-row>
        <v-col cols="6" v-for="mod in mods">
            <mod-card :mod="mod"></mod-card>
        </v-col>
    </v-row>
</template>
  
<script lang="ts">
import ModCard from '@/components/ModCard.vue';
import Mod from '@/interfaces/ModInterface';

export default {
    name: "ModWindow",
    props: {
        mods: { type: Array<Mod>, required: true }
    },
    data() {
        return {
        }
    },
    components: { ModCard }
}  
</script>
  