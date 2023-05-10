<template>
  <v-app id="panthor-launcher-worker">
    <v-container class="fill-height">
      {{ worker_status.message }}
    </v-container>
  </v-app>
</template>

<script lang="ts">
import { ipcRenderer } from 'electron';
import { PropType, defineComponent } from 'vue'

import { readdirSync, unlinkSync, createWriteStream, unlink, statSync } from 'node:fs';
import { join } from 'node:path';

import http from 'node:http';
import axios from 'axios';
import Mod from './interfaces/ModInterface';
import ModFile from './interfaces/ModFileInterface';
import WorkerStatus from './interfaces/WorkerStatusInterface';
import hasha from 'hasha';
import Store from 'electron-store';
import SettingsStore from './interfaces/SettingsStoreInterface';

export default defineComponent({
  name: "Worker",
  data: () => {
    return {
      message: "",
      mod: {} as Mod,
      hashlist: [] as ModFile[],
      worker_status: {} as WorkerStatus,
      arma_path: "",
      to_download: new Array<string>(),
      last_update: Date.now(),
      cancel_fileop: false,
      last_status: -1
    }
  },
  methods: {
    updateMod(mod_id: number) {
      Promise.all(this.getMod(mod_id)).then((results) => {
        console.log(results)
        let diff_files = this.listDiff()
        this.deleteFiles(diff_files[0])

      })
    },
    verifyMod(mod_id: number, quick: boolean = true, download: boolean = true) {
      this.worker_status.message = "Lade Modinformationen"
      this.worker_status.status = 1
      this.updateWorkerStatus();

      Promise.all(this.getMod(mod_id)).then((results) => {
        this.worker_status.message = "Ermittle Versionsunterschiede"
        this.worker_status.status = 2
        this.updateWorkerStatus();
        let diff_files = this.listDiff()

        this.worker_status.message = "Lösche überflüssige Dateien"
        this.worker_status.status = 2
        this.updateWorkerStatus();
        this.deleteFiles(diff_files[0])

        let toDownload = diff_files[1]

        this.worker_status.message = "Verifizierung wird durchgeführt"
        this.worker_status.status = 3
        this.updateWorkerStatus();
        let hash_result = this.hashFiles(quick)
        toDownload = toDownload.concat(hash_result)

        if (toDownload.length === 0) {
          this.worker_status.message = "Verifizierung abgeschlossen"
          this.worker_status.status = 1
          this.updateWorkerStatus();
          return
        }

        console.log(toDownload)

        let toDownloadHashlist = [] as ModFile[]

        toDownload.forEach((file, index) => {
          let hashlist_entry = this.hashlist.find((hashlist_entry) => {
            return hashlist_entry.RelativPath == file
          })

          if (hashlist_entry) {
            toDownloadHashlist.push(hashlist_entry)
            toDownload.splice(index, 1)
          }
        })

        this.resetWorkerStatus();

        if (download) {
          this.downloadFiles(toDownloadHashlist)
        }
      })
    },
    getMod(mod_id: number) {
      let promises = [];

      promises.push(
        axios.get('https://api.panthor.de/v1/mod/' + mod_id)
          .then((response) => {
            this.mod = response.data.data[0]
          })
          .catch((error) => {
            console.log(error);
          }))
      promises.push(
        axios.get('https://api.panthor.de/v1/mod/hashlist/' + mod_id)
          .then((response) => {
            this.hashlist = response.data.data
          })
          .catch((error) => {
            console.log(error);
          }))

      return promises
    },
    downloadFinished() {
      this.resetWorkerStatus()
    },
    downloadFiles(to_download: Array<ModFile>) {
      let total_size = 0
      this.worker_status.message = "Download startet"
      this.worker_status.status = 5
      this.worker_status.fileop_files_remaining = to_download.length
      this.worker_status.fileop_files_done = 0
      this.updateWorkerStatus()

      to_download.forEach((file) => {
        total_size += file.Size
      })

      this.downloadFileRecursive(to_download, 0, this.downloadFinished, 0, total_size)
    },
    downloadFileRecursive(to_download: Array<ModFile>, index: number, callback: Function, size_done: number = 0, total_size: number = 0, last_speed_calc: number = Date.now(), last_speed_size_done: number = 0) {
      let request_download = new Promise((resolve, reject) => {
        let file = to_download[index]

        let stream = createWriteStream(join(this.arma_path, file.RelativPath))

        let streamed_chunkslength = 0

        console.log("Downloading " + file.FileName + " (" + file.Size + " bytes")

        http.get(this.mod.DownloadUrl + file.RelativPath, (response) => {
          response.pipe(stream);

          stream.on("finish", () => {
            stream.close();
            console.log("Download Completed");
            size_done += file.Size
            this.worker_status.fileop_files_done++
            this.updateWorkerStatus()
            resolve("Download Completed");
          })

          response.on("data", (chunk) => {
            streamed_chunkslength += chunk.length;

            if (last_speed_calc + 1000 < Date.now()) {
              this.worker_status.fileop_speed = Math.round(((size_done + streamed_chunkslength) - last_speed_size_done) / ((Date.now() - last_speed_calc) / 1000))
              this.worker_status.fileop_time_remaining = Math.round(((total_size - size_done) / this.worker_status.fileop_speed) * 1000)
              last_speed_calc = Date.now()
              last_speed_size_done = size_done + streamed_chunkslength
            }

            this.worker_status.fileop_progress = (size_done + streamed_chunkslength) / total_size * 100
            this.worker_status.fileop_size_done = (size_done + streamed_chunkslength)
            this.worker_status.fileop_size_remaining = total_size
            this.worker_status.message = "Download läuft"
            this.worker_status.status = 6
            this.updateWorkerStatus()
          });
        }).on('error', (err) => {
          console.log("Download Error: " + err.message);
          unlink(join(this.arma_path, file.RelativPath), () => { });
          reject(err);
        })
      })

      request_download.then((response) => {
        if (index == to_download.length - 1) {
          callback()
        } else {
          this.downloadFileRecursive(to_download, index + 1, callback, size_done, total_size, last_speed_calc, last_speed_size_done)
        }
      }).catch((error) => {
        console.log(error);
      });
    },
    listDiff() {
      let files = this.getFileList(join(this.arma_path, this.mod.Directories))

      let additional_files = files.filter(x => !this.hashlist_files.includes(x));

      let missing_files = this.hashlist_files.filter(x => !files.includes(x));

      return [additional_files, missing_files]
    },
    deleteFiles(files: Array<string>) {
      files.forEach((file) => {
        try {
          unlinkSync(join(this.arma_path, file))
        } catch (err) {
          console.log(err)
        }
      })
    },
    hashFiles(quick: boolean = false) {
      let file_list = this.getFileList(join(this.arma_path, this.mod.Directories))
      let files: Array<string> = [];

      this.worker_status.fileop_files_done = 0
      this.worker_status.fileop_files_remaining = file_list.length

      this.updateWorkerStatus();

      let total_size = 0
      let size_done = 0
      let start_time = Date.now()

      file_list.forEach((file) => {
        total_size = total_size + statSync(join(this.arma_path, file)).size
      })

      file_list.forEach((file) => {
        this.worker_status.fileop_files_done++
        this.worker_status.fileop_progress = size_done / total_size * 100
        this.worker_status.fileop_speed = Math.round(size_done / ((Date.now() - start_time) / 1000))
        this.worker_status.fileop_time_remaining = Math.round(((total_size - size_done) / this.worker_status.fileop_speed) * 1000)
        this.worker_status.fileop_size_done = size_done
        this.worker_status.fileop_size_remaining = total_size
        this.updateWorkerStatus();

        if (quick && !file.includes('.bisign')) {
          return
        }

        let hash = hasha.fromFileSync(join(this.arma_path, file), { algorithm: 'md5' })

        this.hashlist.forEach((hashlist_file) => {
          if (hashlist_file.RelativPath == file) {
            if (hashlist_file.Hash.toUpperCase() != hash.toUpperCase()) {
              files.push(file);
            }
          }
        })

        size_done = size_done + statSync(join(this.arma_path, file)).size
      })

      return files
    },
    getFileList(dirName: string) {
      let files: Array<string> = [];
      const items = readdirSync(dirName, { withFileTypes: true });

      for (const item of items) {
        if (item.isDirectory()) {
          files = files.concat(this.getFileList(join(dirName, item.name)));
        } else {
          files.push(join(dirName.replace(this.arma_path, ''), item.name));
        }
      }

      return files;
    },
    updateWorkerStatus() {
      if (this.last_update + 100 > Date.now() && this.worker_status.status === this.last_status) {
        return
      }
      this.last_update = Date.now()
      this.last_status = this.worker_status.status
      ipcRenderer.send('worker_status:update', JSON.stringify(this.worker_status))
    },
    resetWorkerStatus() {
      this.worker_status.message = ""
      this.worker_status.fileop_progress = 0
      this.worker_status.fileop_speed = 0
      this.worker_status.fileop_files_done = 0
      this.worker_status.fileop_files_remaining = 0
      this.worker_status.fileop_time_remaining = 0
      this.worker_status.fileop_size_done = 0
      this.worker_status.fileop_size_remaining = 0
      this.worker_status.status = 0

      this.updateWorkerStatus()
    },
    reloadArmaPath() {
      let store = new Store<SettingsStore>({
        defaults: {} as SettingsStore
      });
      this.arma_path = store.get('arma_path')
      console.log(this.arma_path)
    }
  },
  computed: {
    hashlist_files: function () {
      let files: Array<string> = [];

      this.hashlist.forEach((file) => {
        files.push(file.RelativPath)
      })

      return files
    }
  },
  mounted() {
    ipcRenderer.on('mod:update', (_event, mod_id: number) => {
      if (this.arma_path !== '') {
        this.updateMod(mod_id)
      }
    })
    ipcRenderer.on('mod:verify', (_event, mod_id: number) => {
      if (this.arma_path !== '') {
        this.verifyMod(mod_id)
      }
    })
    ipcRenderer.on('settings:changedArmaPath', (_event, path: string) => {
      this.reloadArmaPath()
    })

    this.reloadArmaPath()
  },
});
</script>
