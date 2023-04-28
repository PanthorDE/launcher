<template>
    <v-card flat>
        <v-img height="300" :src="mod.ImageUrl" cover>
        </v-img>
        <v-row justify="center" class="mt-2">
            <v-card-title class="text-center">{{ mod.Name }}</v-card-title>
        </v-row>
        <v-row justify="center" class="mb-3">
            <v-card-subtitle class="text-center">{{ mod.Description }}</v-card-subtitle>
        </v-row>
        <v-row>
            <v-divider :thickness="6" color="black"></v-divider>
        </v-row>
        <v-row justify="center" class="mt-3 mb-1">
            <v-col cols="auto" v-if="false">
                <v-btn prepend-icon="mdi-folder-alert-outline" color="warning">
                    <template v-slot:prepend>
                        <v-icon color="red"></v-icon>
                    </template>
                    Kein Pfad gesetzt
                </v-btn>
            </v-col>
            <v-col cols="auto">
                <v-btn color="success" flat prepend-icon="mdi-download">
                    Download
                </v-btn>
            </v-col>
            <v-col cols="auto">
                <v-btn color="warning" flat prepend-icon="mdi-file-cog">
                    Prüfen
                </v-btn>
            </v-col>
            <v-col cols="auto">
                <v-btn color="red" flat prepend-icon="mdi-file-certificate-outline">
                    Bisign
                </v-btn>
            </v-col>
        </v-row>
    </v-card>
</template>
  
<script lang="ts">
export default {
    name: "ModCard",
    props: {
        mod: { type: Object, required: true }
    },
}  
</script>
  