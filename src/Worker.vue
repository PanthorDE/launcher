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

import stream from 'node:stream';
import http from 'node:http';

import axios from 'redaxios';

import Mod from './interfaces/ModInterface';
import ModFile from './interfaces/ModFileInterface';
import WorkerStatus from './interfaces/WorkerStatusInterface';
import hasha from 'hasha';
import { throwStatement } from '@babel/types';

export default defineComponent({
  name: "Worker",
  data: () => {
    return {
      message: "",
      mod: {} as Mod,
      hashlist: [] as ModFile[],
      worker_status: {} as WorkerStatus,
      a3folder: "O:\\Steam\\steamapps\\common\\Arma 3\\",
      to_download: new Array<string>()

    }
  },
  methods: {
    updateMod(mod_id: number) {
      Promise.all(this.getMod(mod_id)).then((results) => {
        let diff_files = this.listDiff()
        this.deleteFiles(diff_files[0])

      })
    },
    verifyMod(mod_id: number, quick: boolean = false, download: boolean = false) {
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
        this.deleteFiles(hash_result)
        toDownload = toDownload.concat(hash_result)

        this.to_download = toDownload

        this.resetWorkerStatus();

        console.log(toDownload)

        if (download) {
          this.downloadFiles()
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
    downloadFiles() {
      this.to_download.forEach((file) => {
        let stream = createWriteStream(join(this.a3folder, file))

        let stream_length = 0
        let streamed_chunkslength = 0
        let total_progress = stream_length / 1048576

        let request = http.get(this.mod.DownloadUrl + file, function (response) {
          response.pipe(stream);

          if (response.statusCode == 200) {
            if (response.headers['content-length']) {
              stream_length = +response.headers['content-length'];
            }
          }

          stream.on("finish", () => {
            stream.close();
            console.log("Download Completed");
          })

          response.on("data", function (chunk) {

            streamed_chunkslength += chunk.length;
            console.log("Downloading " + (100.0 * streamed_chunkslength / stream_length).toFixed(2) + "% " + (streamed_chunkslength / 1048576).toFixed(2) + " mb\r" + ".<br/> Total size: " + total_progress.toFixed(2) + " mb");
          });
        }).on('error', (err) => {
          unlink(join(this.a3folder, file), () => { });
        })
      })
    },
    listDiff() {
      let files = this.getFileList(join(this.a3folder, this.mod.Directories))

      let additional_files = files.filter(x => !this.hashlist_files.includes(x));
      let missing_files = this.hashlist_files.filter(x => !files.includes(x));

      return [additional_files, missing_files]
    },
    deleteFiles(files: Array<string>) {
      files.forEach((file) => {
        try {
          unlinkSync(join(this.a3folder, file))
        } catch (err) {
          console.log(err)
        }
      })
    },
    hashFiles(quick: boolean = false) {
      let file_list = this.getFileList(join(this.a3folder, this.mod.Directories))
      let files: Array<string> = [];

      this.worker_status.fileop_files_done = 0
      this.worker_status.fileop_files_remaining = file_list.length
      this.updateWorkerStatus();

      let total_size = 0

      file_list.forEach((file) => {
        total_size = total_size + statSync(join(this.a3folder, file)).size
      })

      file_list.forEach((file) => {
        this.worker_status.fileop_files_done++
        this.worker_status.fileop_progress = this.worker_status.fileop_files_done / file_list.length * 100
        this.updateWorkerStatus();

        if (quick && !file.includes('.bisign')) {
          return
        }

        let hash = hasha.fromFileSync(join(this.a3folder, file), { algorithm: 'md5' })

        this.hashlist.forEach((hashlist_file) => {
          if (hashlist_file.RelativPath == file) {
            if (hashlist_file.Hash.toUpperCase() != hash.toUpperCase()) {
              files.push(file);
            }
          }
        })
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
          files.push(join(dirName.replace(this.a3folder, ''), item.name));
        }
      }

      return files;
    },
    updateWorkerStatus() {
      ipcRenderer.send('worker_status:update', JSON.stringify(this.worker_status))
    },
    resetWorkerStatus() {
      this.worker_status.message = ""
      this.worker_status.fileop_progress = 0
      this.worker_status.fileop_speed = 0
      this.worker_status.fileop_files_done = 0
      this.worker_status.fileop_files_remaining = 0
      this.worker_status.fileop_time_remaining = 0
      this.worker_status.status = 0

      this.updateWorkerStatus()
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
      this.updateMod(mod_id)
    })
    ipcRenderer.on('mod:verify', (_event, mod_id: number) => {
      this.verifyMod(mod_id)
    })
  },
});
</script>
