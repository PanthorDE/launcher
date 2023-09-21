<template>
  <v-app id="panthor-launcher-worker">
    <v-main>
      <v-container>
        Path: {{ path }}
        <v-row>
          <v-col cols="6" v-for="updater in update_services">
            <v-card :title="updater.getMod().name">
              <v-card-text>
                Mod ID: <v-pill>{{ updater.getModId() }}</v-pill><br>
                Status: <v-pill>{{ updater.getStatus().toString() }}</v-pill><br>
                Dateiforschritt: <v-pill>{{ updater.getSizeProgress() }}</v-pill><br>
                Geschwindigkeit: <v-pill>{{ updater.getSpeed() }}</v-pill><br>
                Verbleidend: <v-pill>{{ updater.getTimeRemaining() }}</v-pill><br>
                Fehler: <v-pill>{{ updater.getWrongHashes() }}</v-pill><br>
                Path: <v-pill>{{ updater.getPath() }}</v-pill><br>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { ipcRenderer } from 'electron';
import { UpdateService } from './services/Update.service';
import { defineComponent } from 'vue';
import WorkerStatus, { StatusColors, StatusIcons, StatusTexts } from './interfaces/WorkerStatusInterface';

export default defineComponent({
  name: 'Worker',
  data() {
    return {
      update_services: [] as UpdateService[],
      mods: [] as number[],
      path: "",
    };
  },
  mounted() {
    ipcRenderer.on('mods:init', (_event, mods: number[]) => {
      this.init(mods);
    });
    ipcRenderer.on('mod:update', (_event, mod_id: number) => {
      const updater = this.update_services.find((updater) => updater.getModId() === mod_id);

      if (updater === undefined) {
        return;
      }

      updater.download().then((result) => {
        console.log(result);
      }).catch((error) => {
        console.log(error);
      });
    });
    ipcRenderer.on('mod:verify', (_event, mod_id: number, quick: boolean) => {
      const updater = this.update_services.find((updater) => updater.getModId() === mod_id);

      if (updater === undefined) {
        return;
      }

      updater.verify().then((result) => {
        console.log(result);
      }).catch((error) => {
        console.log(error);
      });
    });
    ipcRenderer.on('settings:changedArmaPath', (_event, path: string) => {
      this.changeArmaPath(path);
    });
    ipcRenderer.on('worker:requestUpdate', (_event, path: string) => {
      this.updateWorkerStatus();
    });
  },
  methods: {
    init(mods: number[]) {
      if (this.path !== "" && this.path !== undefined && mods.length !== this.update_services.length) {
        this.update_services.forEach((updater) => {
          updater.stop()
        })
        this.update_services.splice(0)
        this.mods = mods
        mods.forEach((mod) => {
          let update_service = new UpdateService(1, mod, this.path)
          update_service.getEventEmitter().on('statusChanged', () => {
            this.updateWorkerStatus();
          })
          this.update_services.push(update_service)
          update_service.init()
          update_service.verify(true)
        })
      }
    },
    changeArmaPath(path: string) {
      if (this.path !== "" && this.path !== undefined) {
        this.path = path
      } else {
        if (this.update_services.length === 0) {
          this.path = path
        } else {
          this.update_services.forEach((updater) => {
            updater.stop()
          })
          this.init(this.mods)
        }
      }
    },
    updateWorkerStatus() {
      this.update_services.forEach((updater) => {
        let worker_status = {} as WorkerStatus;

        worker_status.status = updater.getStatus()
        worker_status.fileop_files_done = updater.getCompletedFiles()
        worker_status.fileop_files_remaining = updater.getRemainingFiles()
        worker_status.fileop_progress = updater.getSizeProgress() * 100
        worker_status.fileop_size_done = updater.getCompletedSize()
        worker_status.fileop_size_remaining = updater.getRemainingSize()
        worker_status.fileop_speed = updater.getSpeed()
        worker_status.fileop_time_remaining = updater.getTimeRemaining()
        worker_status.fileop_files_broken = updater.getWrongHashes()
        worker_status.fileop_files_broken_size = updater.getWrongHashesSize()
        worker_status.message = StatusTexts[updater.getStatus()]
        worker_status.color = StatusColors[updater.getStatus()]
        worker_status.icon = StatusIcons[updater.getStatus()]
        
        ipcRenderer.send('worker:update', updater.getModId(), JSON.stringify(worker_status));

        console.log(updater.getModId(), JSON.stringify(worker_status))
      })
    }
  }
});
</script>