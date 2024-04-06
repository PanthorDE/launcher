<template>
  <v-app id="panthor-launcher-worker">
    <v-main>
      <v-container>
        Arma 3 Path: {{ path }}
        <v-row class="mt-4">
          <v-col cols="12" v-for="updater in update_services">
            <v-card>
              <v-card-title>
                {{ updater.getMod().name }}
              </v-card-title>
              <v-card-text>
                Mod ID: <v-chip label>{{ updater.getModId() }}</v-chip><br>
                Status: <v-chip label>{{ updater.getStatus() }} ({{ status_texts[updater.getStatus()] }})</v-chip><br>
                Dateiforschritt: <v-chip label>{{ updater.getSizeProgress() }}</v-chip><br>
                Dateien: <v-chip label>{{ updater.getCompletedFiles() }}/{{ updater.getCompletedFiles() +
                  updater.getRemainingFiles() }}</v-chip><br>
                Geschwindigkeit: <v-chip label>{{ updater.getSpeed() }}</v-chip><br>
                Verbleidend: <v-chip label>{{ updater.getTimeRemaining() }}</v-chip><br>
                Fehler: <v-chip label>{{ updater.getWrongHashes() }}</v-chip><br>
                Path: <v-chip label>{{ updater.getPath() }}</v-chip><br>
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
import { StatusColors, StatusIcons, StatusTexts } from './enums/UpdateStatusEnum';
import WorkerStatus from './interfaces/WorkerStatusInterface';

export default defineComponent({
  name: 'Worker',
  data() {
    return {
      update_services: [] as UpdateService[],
      mods: [] as number[],
      path: "",
      status_texts: StatusTexts,
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
    ipcRenderer.on('mod:stop', (_event, mod_id: number) => {
      this.stop(mod_id);
    });
    ipcRenderer.on('settings:changedArmaPath', (_event, path: string) => {
      this.changeArmaPath(path);
    });
    ipcRenderer.on('worker:requestUpdate', (_event, path: string) => {
      this.updateWorkerStatus();
    });
    ipcRenderer.on('worker:requestStop', (_event, path: string) => {
      this.updateWorkerStatus();
    });
  },
  methods: {
    init(mods: number[], force: boolean = false) {
      this.mods = mods
      if (this.path !== "" && this.path !== undefined && (mods.length !== this.update_services.length || force)) {
        this.update_services.forEach((updater) => {
          updater.stop()
        })
        this.update_services.splice(0)
        mods.forEach((mod) => {
          let update_service = new UpdateService(3, mod, this.path)
          update_service.getEventEmitter().on('statusChanged', () => {
            this.updateWorkerStatus()
          })
          this.update_services.push(update_service)
          update_service.init()
          update_service.verify(true)
        })
      }
    },
    stop(mod_id: number) {
      const updater = this.update_services.find((updater) => updater.getModId() === mod_id);

      if (updater === undefined) {
        return;
      }

      updater.stop();
    },
    changeArmaPath(path: string) {
      this.path = path
      this.init(this.mods, true)
    },
    updateWorkerStatus() {
      let send_window_progress_update = false

      this.update_services.forEach((updater) => {
        let worker_status = {} as WorkerStatus;

        worker_status.status = updater.getStatus()
        worker_status.fileop_files_done = updater.getCompletedFiles()
        worker_status.fileop_files_remaining = updater.getRemainingFiles()
        worker_status.fileop_progress = updater.getSizeProgress() * 100
        worker_status.fileop_size_done = updater.getCompletedSize()
        worker_status.fileop_size_remaining = updater.getRemainingSize()
        worker_status.fileop_size_total = updater.getTotalSize()
        worker_status.fileop_speed = updater.getSpeed()
        worker_status.fileop_time_remaining = updater.getTimeRemaining()
        worker_status.fileop_files_broken = updater.getWrongHashes()
        worker_status.fileop_files_broken_size = updater.getWrongHashesSize()
        worker_status.message = StatusTexts[updater.getStatus()]
        worker_status.color = StatusColors[updater.getStatus()]
        worker_status.icon = StatusIcons[updater.getStatus()]

        if (worker_status.fileop_progress != 0 && !send_window_progress_update && worker_status.fileop_time_remaining !== Infinity) {
          if (worker_status.fileop_progress > 97) {
            ipcRenderer.send('winprogress-change', 0)
          } else {
            ipcRenderer.send('winprogress-change', Math.round(worker_status.fileop_progress))
          }

          send_window_progress_update = true
        }

        ipcRenderer.send('worker:update', updater.getModId(), JSON.stringify(worker_status));
      })

      if (!send_window_progress_update) {
        ipcRenderer.send('winprogress-change', 0)
      }
    }
  }
});
</script>