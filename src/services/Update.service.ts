import * as http from 'http';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as url from 'url';
import * as util from 'util';
import ModFile from '@/interfaces/ModFileInterface';
import Mod from '@/interfaces/ModInterface';
import { PanthorApiService } from './PanthorApi.service';
import { join, sep } from 'path';
import { EventEmitter } from 'events';
import { UpdateStatus } from '@/enums/UpdateStatusEnum';
import checkDiskSpace from 'check-disk-space';
import { ipcRenderer } from 'electron';
import PanthorUtils from './PanthorUtils.service';

class UpdateEventEmitter extends EventEmitter {
  constructor() {
    super();
  }
}

const readFile = util.promisify(fs.readFile);

export class UpdateService {
  private hashlist: Array<ModFile> = [];
  private queue: Array<ModFile> = [];
  private currentFiles: Array<ModFile> = [];
  private wrongHashes: Array<ModFile> = [];
  private modId: number;
  private mod: Mod = {} as Mod;
  private basePath: string;
  private status: UpdateStatus = UpdateStatus.UKNOWN;
  private runningThreads: number = 0;
  private completedFiles: number = 0;
  private completedSize: number = 0;
  private totalFiles: number = 0;
  private totalSize: number = 0;
  private promiseResolvers: Array<() => void> = [];
  private lastSpeedCalculation: number = 0;
  private lastUpdate: number = 0;
  private lastSpeedSize: number = 0;
  private lastSpeed: number = 0;
  private timeRemaining: number = 0;
  private maxThreads: number;
  private statusChanged: UpdateEventEmitter = new UpdateEventEmitter();
  private stopRequested: boolean = false;
  private retriedFiles: Array<ModFile> = [];

  constructor(maxConcurrentDownloads: number, modId: number, basePath: string) {
    this.maxThreads = maxConcurrentDownloads;
    this.modId = modId;
    this.basePath = basePath;
  }

  public init() {
    this.status = UpdateStatus.UKNOWN;
    this.setOperationEnded()
  }

  private async loadAPIData(): Promise<unknown> {
    let promises: Promise<unknown>[] = [];

    promises.push(
      PanthorApiService.getMod(this.modId)
        .then((result) => (this.mod = result))
        .catch(console.error)
    )

    promises.push(
      PanthorApiService.getModHashlist(this.modId)
        .then((result) => (this.hashlist = result))
        .catch(console.error)
    )

    return Promise.all(promises)
  }

  private async checkAvailableSpace(): Promise<boolean> {
    try {
      return await checkDiskSpace(this.basePath).then((diskSpace) => {
        return (diskSpace.free > (this.totalSize + 1000000000));
      });
    } catch (error) {
      console.error('Failed to check available space:', error);
      return true;
    }
  }

  public async download(): Promise<boolean> {
    this.stopRequested = false;
    this.currentFiles = []
    return new Promise<boolean>((resolve, reject) => {
      this.loadAPIData().then(async () => {
        this.queue = []

        if (this.wrongHashes.length > 0 && (this.status === UpdateStatus.HASHED_UPDATE_REQUIRED || this.status === UpdateStatus.DOWNLOADED_UPDATE_REQUIRED)) {
        } else {
          this.wrongHashes = []
          await this.verify(true, true)
        }

        this.completedFiles = 0;
        this.completedSize = 0;
        this.totalFiles = this.wrongHashes.length
        this.retriedFiles = []
        this.setTotalSize(this.wrongHashes);

        let enoughSpace = await this.checkAvailableSpace()

        if (!enoughSpace) {
          ipcRenderer.send('notification:create', "Speicherplatz nicht ausreichend", "Nicht ausreichend Speicherplatz verfügbar. Es werden mindestens " + PanthorUtils.humanFileSize(this.totalSize + 1000000000) + " freier Speicherplatz benötigt.");
          this.status = UpdateStatus.UKNOWN;
          this.setOperationEnded();
          resolve(true);
          return;
        }

        console.log('Downloading', this.wrongHashes.length, 'files')

        this.status = UpdateStatus.DOWNLOADING;
        this.statusChanged.emit('statusChanged', this.status);

        const filesToDownload = this.wrongHashes
        this.wrongHashes = []

        for (let i = 0; i < filesToDownload.length; i++) {
          await this.enqueueFileDownload(filesToDownload[i]);
        }

        await this.waitForAllDownloadsToComplete();

        if (this.stopRequested) {
          this.status = UpdateStatus.UKNOWN;
          this.setOperationEnded();
          resolve(true);
          return;
        }

        if (this.wrongHashes.length === 0) {
          this.status = UpdateStatus.INTACT;
          this.setOperationEnded();
        } else {
          console.log('Mismatched or Missing Files', this.wrongHashes)
          this.status = UpdateStatus.DOWNLOADED_UPDATE_REQUIRED;
          this.setOperationEnded();
        }
        resolve(true)
      }).catch(reject)
    })
  }

  public async verify(quick: boolean = false, downloadIfEmpty: boolean = false): Promise<boolean> {
    this.stopRequested = false;
    this.currentFiles = []
    return new Promise<boolean>((resolve, reject) => {
      this.loadAPIData().then(async () => {
        if (!fs.existsSync(join(this.basePath, this.mod.dir)) && !downloadIfEmpty) {
          this.status = UpdateStatus.NOT_FOUND;
          this.setOperationEnded();
          resolve(true)
          return
        }

        if (fs.existsSync(join(this.basePath, this.mod.dir))) {
          await this.deleteExtraFiles()
        }

        this.queue = []
        this.wrongHashes = []

        this.completedFiles = 0;
        this.completedSize = 0;
        this.retriedFiles = []
        this.totalFiles = this.hashlist.length
        this.setTotalSize(this.hashlist);

        if(quick) {
          this.status = UpdateStatus.QUICK_HASHING;
        } else {
          this.status = UpdateStatus.HASHING;
        }
        
        this.statusChanged.emit('statusChanged', this.status);

        for (let i = 0; i < this.hashlist.length; i++) {
          await this.enqueueFileHash(this.hashlist[i], quick);
        }

        await this.waitForAllHashesToComplete();

        if (this.stopRequested) {
          this.status = UpdateStatus.UKNOWN;
          this.setOperationEnded();
          resolve(true);
          return;
        }

        if (this.wrongHashes.length === 0) {
          this.status = UpdateStatus.INTACT;
          if (quick) {
            console.log('Mod seems intact based on quick check only')
          } else {
            console.log('Mod seems intact based on hashes')
          }
          this.setOperationEnded();
        } else {
          this.status = UpdateStatus.HASHED_UPDATE_REQUIRED;
          console.log('Mismatched or Missing Files', this.wrongHashes)
          this.setOperationEnded();
        }
        resolve(true)
      }).catch(reject)
    })
  }

  private readdirDirectory(basedir: string): string[] {
    return fs.readdirSync(basedir, { withFileTypes: true }).flatMap((file) => file.isDirectory() ? this.readdirDirectory(join(basedir, file.name)) : join(basedir, file.name))
  }

  private async deleteExtraFiles() {
    const files = this.readdirDirectory(join(this.basePath, this.mod.dir))
    const simepleHashlist = this.hashlist.map((file) => join(this.basePath, file.RelativPath))

    let extraFiles = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      let found = false
      for (let j = 0; j < simepleHashlist.length; j++) {
        const simpleHash = simepleHashlist[j]

        /*
        if(simpleHash.includes('.pbo.PANTHOR_20240202173536.bisign') && file.includes('.pbo.PANTHOR_20240202173536.bisign')) {
          console.log('Comparing', simpleHash, file)
        }
        */

        if (simpleHash === file) {
          found = true
          break
        }
      }
      if (!found) {
        extraFiles.push(file)
      }
    }

    for (let i = 0; i < extraFiles.length; i++) {
      const file = extraFiles[i]
      //console.log('Deleting extra File', file)
      fs.unlinkSync(file)

      //check if hash file exists
      const hashFile = file + '.md5'
      if (fs.existsSync(hashFile)) {
        try {
          fs.unlinkSync(hashFile)
        } catch (error) {
          console.error('Failed to unlink hash file:', error)
        }
      }
    }
  }

  async waitForAllDownloadsToComplete(): Promise<void> {
    this.promiseResolvers = [];
    if (this.completedFiles === this.totalFiles) {
      return;
    }

    return new Promise<void>((resolve) => {
      this.promiseResolvers.push(resolve);
    });
  }

  private async downloadNext() {
    if (this.queue.length === 0) {
      return;
    }

    if (this.runningThreads >= this.maxThreads) {
      return;
    }

    const file = this.queue.shift()!;
    this.runningThreads++;

    try {
      this.currentFiles.push(file);
      const success = await this.downloadFile(file);
      if (success) {
        //console.log(`Download erfolgreich für ${file.FileName}`);
      } else {
        if (!this.stopRequested) {
          console.error(`Download fehlgeschlagen oder MD5-Validierung fehlgeschlagen für ${file.FileName}`);
        }
      }
    } catch (error) {
      console.error('Fehler beim Herunterladen:', error);
    } finally {
      const index = this.currentFiles.indexOf(file);
      if (index > -1) {
        this.currentFiles.splice(index, 1);
      }
      this.completedFiles++;
      this.runningThreads--;

      if (this.completedFiles >= this.totalFiles) {
        this.notifyAllFilesCompleted();
      }

      this.downloadNext();
    }
  }

  private async enqueueFileDownload(file: ModFile): Promise<void> {
    this.queue.push(file);
    this.downloadNext();
  }

  private async downloadFile(file: ModFile): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const fullFilePath = join(this.basePath, file.RelativPath);
      const parsedUrl = url.parse(this.mod.files + file.RelativPath);

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.path,
        method: 'GET',
      };

      const directories = fullFilePath.split(sep).slice(0, -1);

      let currentDirectory = '';

      for (const directory of directories) {
        currentDirectory = join(currentDirectory, directory + "\\");
        if (!this.basePath.includes(currentDirectory)) {
          if (!fs.existsSync(currentDirectory)) {
            console.log('Creating directory', currentDirectory)
            fs.mkdirSync(currentDirectory);
          }
        }
      }

      const fileStream = fs.createWriteStream(fullFilePath);
      const hash = crypto.createHash('md5');
      let downloadedSize = 0;

      const req = http.request(options, (res) => {
        res.pipe(fileStream);

        res.on('data', (chunk) => {
          if (this.stopRequested) {
            req.destroy();
            return;
          }
          downloadedSize += chunk.length;
          hash.update(chunk);
          this.completedSize += chunk.length;
          this.calculateSpeed();
        });

        res.on('end', async () => {
          if (this.stopRequested) {
            fileStream.close();
            try {
              fs.unlinkSync(fullFilePath);
            } catch (error) {
              console.error('Failed to unlink on stop: ', error);
            }
            resolve(false);
            return;
          }

          fileStream.end();
          fileStream.close();

          const downloadedHash = hash.digest('hex').toUpperCase();

          if (downloadedHash !== file.Hash.toUpperCase()) {
            console.log('Hash mismatch for', file.FileName, 'Expected:', file.Hash, 'Got:', downloadedHash)

            try {
              fs.unlinkSync(fullFilePath);
            } catch (error) {
              console.error('Failed to unlink due to wrong hash: ', error);
            }
            this.wrongHashes.push(file);
          } else {
            const hash = crypto.createHash('md5');
            const fileData = await readFile(fullFilePath);

            hash.update(fileData);

            let hashDigest = hash.digest('hex').toUpperCase();

            if (hashDigest !== file.Hash.toUpperCase()) {
              console.log('Downloaded', file.FileName, 'Hash:', hashDigest, 'Expected:', file.Hash.toUpperCase())

              try {
                fs.unlinkSync(fullFilePath);
              } catch (error) {
                console.error('Failed to unlink due to wrong hash: ', error);
              }
              const retriedTimes = this.retriedFiles.filter((retriedFile) => retriedFile.FileName === file.FileName).length
              if (retriedTimes < 5) {
                console.log('Retrying download for', file.FileName)
                this.retriedFiles.push(file)
                await this.downloadFile(file)
              } else {
                console.log('Failed to download', file.FileName, 'after retry')
                this.wrongHashes.push(file);
              }
            }
          }

          resolve(true)
        });

        res.on('error', (error) => {
          if (!this.stopRequested) {
            reject(error);
          } else {
            resolve(false)
          }
        });
      });

      req.end();
    });
  }

  async waitForAllHashesToComplete(): Promise<void> {
    this.promiseResolvers = [];
    if (this.completedFiles === this.totalFiles) {
      return;
    }

    return new Promise<void>((resolve) => {
      this.promiseResolvers.push(resolve);
    });
  }

  private notifyAllFilesCompleted() {
    for (const resolver of this.promiseResolvers) {
      resolver();
    }
    this.promiseResolvers = [];
  }

  private async hashNext(quick: boolean) {
    if (this.queue.length === 0) {
      return;
    }

    if (this.runningThreads >= this.maxThreads) {
      return;
    }

    const file = this.queue.shift()!;
    this.runningThreads++;

    try {
      this.currentFiles.push(file);
      const success = await this.hashFile(file, quick);
    } catch (error) {
      console.error('Fehler beim Herunterladen:', error);
    } finally {
      const index = this.currentFiles.indexOf(file);
      if (index > -1) {
        this.currentFiles.splice(index, 1);
      }
      this.completedFiles++;
      this.runningThreads--;

      if (this.completedFiles >= this.totalFiles) {
        this.notifyAllFilesCompleted();
      }

      this.hashNext(quick);
    }
  }

  /*
  private async writeHashFile(file: ModFile, hash: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const fullFilePath = join(this.basePath, file.RelativPath + '.md5');
      fs.writeFile(fullFilePath, hash, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    })
  }
  */

  private async enqueueFileHash(file: ModFile, quick: boolean): Promise<void> {
    this.queue.push(file);
    this.hashNext(quick);
  }

  private async hashFile(file: ModFile, quick: boolean): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      const fullFilePath = join(this.basePath, file.RelativPath);

      if (this.stopRequested) {
        resolve(true);
        return;
      }

      if (!fs.existsSync(fullFilePath)) {
        this.wrongHashes.push(file);
        resolve(true)
      } else {
        const fileSize = fs.statSync(fullFilePath).size;

        /*
        if (fullFilePath.includes('RL_Weapons_Pistols.pbo')) {
          console.log('Checking', fullFilePath, 'Size:', fileSize, 'Expected:', file.Size)
        }
        */

        if (!quick || file.FileName.includes('.bisign') || file.FileName.includes('.dll') || file.FileName.includes('.paa') || file.FileName.includes('.cpp') || fileSize < 1000000) {
          const hash = crypto.createHash('md5');
          const fileData = await readFile(fullFilePath);

          hash.update(fileData);

          this.completedSize += file.Size;
          this.calculateSpeed();

          let hashDigest = hash.digest('hex').toUpperCase();

          if (hashDigest !== file.Hash.toUpperCase()) {
            this.wrongHashes.push(file);
          } else {
            
            //this.writeHashFile(file, hashDigest)
          }
          resolve(true)
        } else {
          if (fileSize !== file.Size) {
            this.wrongHashes.push(file);
            resolve(true)
          }
          resolve(true)
        }
      }
    });
  }

  private calculateSpeed() {
    if (this.lastSpeedCalculation + 5000 < Date.now()) {
      const doneSinceLastCalculation = this.completedSize - this.lastSpeedSize
      this.lastSpeedSize = this.completedSize;
      this.lastSpeed = Math.round(
        doneSinceLastCalculation / ((Date.now() - this.lastSpeedCalculation) / 1000)
      );
      this.timeRemaining = Math.round(
        (this.getRemainingSize() / this.lastSpeed)
      );
      this.lastSpeedCalculation = Date.now();
    }
    if (this.lastUpdate + 500 < Date.now()) {
      this.lastUpdate = Date.now();
      this.statusChanged.emit('statusChanged', this.status);
    }
  }

  private setOperationEnded() {
    this.lastSpeed = 0
    this.lastSpeedCalculation = 0
    this.lastUpdate = 0
    this.completedSize = 0
    this.completedFiles = 0
    this.timeRemaining = 0
    this.lastSpeedSize = 0
    this.totalFiles = 0
    this.totalSize = 0
    this.queue = []
    this.currentFiles = []
    this.retriedFiles = []
    this.statusChanged.emit('statusChanged', this.status);
  }

  public getEventEmitter(): EventEmitter {
    return this.statusChanged
  }

  public getSpeed(): number {
    return this.lastSpeed;
  }

  public getTimeRemaining(): number {
    return this.timeRemaining;
  }

  public getFileProgress(): number {
    if (this.totalFiles !== 0) {
      return this.completedFiles / this.totalFiles;
    } else {
      return 0;
    }
  }

  public getStatus(): UpdateStatus {
    return this.status
  }

  public getMod(): Mod {
    return this.mod
  }

  public getRemainingFiles(): number {
    return this.queue.length + this.currentFiles.length
  }

  public getCompletedFiles(): number {
    return this.completedFiles
  }

  public getRemainingSize(): number {
    return this.totalSize - this.completedSize;
  }

  public getSizeProgress(): number {
    if (this.getRemainingSize() !== 0) {
      return this.completedSize / (this.completedSize + this.getRemainingSize())
    } else {
      return 0
    }
  }

  public getCompletedSize(): number {
    return this.completedSize
  }

  private setTotalSize(list: ModFile[]) {
    let size = 0
    for (let i = 0; i < list.length; i++) {
      size += list[i].Size
    }

    this.totalSize = size
  }

  public getTotalSize(): number {
    return this.totalSize
  }

  public getModId(): number {
    return this.modId
  }

  public getPath(): string {
    return this.basePath
  }

  public getWrongHashes(): number {
    return this.wrongHashes.length
  }

  public getWrongHashesSize(): number {
    let size = 0
    for (let i = 0; i < this.wrongHashes.length; i++) {
      size += this.wrongHashes[i].Size
    }
    return size
  }

  public stop() {
    this.stopRequested = true;
    this.init();
  }
}