<template>
    <v-row>
        <v-col cols="6" v-for="mod in mods">
            <mod-card :mod="mod" :arma_path="arma_path" @choose-armapath="$emit('choose-armapath')"></mod-card>
        </v-col>
    </v-row>
</template>
  
<script lang="ts">
import ModCard from '@/components/ModCard.vue';
import Mod from '@/interfaces/ModInterface';

export default {
    name: "ModWindow",
    emits: ["choose-armapath"],
    props: {
        mods: { type: Array<Mod>, required: true },
        arma_path: { type: String, required: true }
    },
    data() {
        return {
        }
    },
    components: { ModCard }
}  
</script>
  