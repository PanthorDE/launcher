import * as http from 'http';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as url from 'url';
import ModFile from '@/interfaces/ModFileInterface';
import Mod from '@/interfaces/ModInterface';
import { PanthorApiService } from './PanthorApi.service';
import { join, sep } from 'path';
import { EventEmitter } from 'events';
import { UpdateStatus } from '@/interfaces/WorkerStatusInterface';

class UpdateEventEmitter extends EventEmitter {
  constructor() {
    super();
  }
}


export class UpdateService {
  private hashlist: Array<ModFile> = [];
  private queue: Array<ModFile> = [];
  private wrongHashes: Array<ModFile> = [];
  private modId: number;
  private mod: Mod = {} as Mod;
  private basePath: string;
  private status: UpdateStatus = UpdateStatus.UKNOWN;
  private runningThreads: number = 0;
  private completedFiles: number = 0;
  private completedSize: number = 0;
  private totalFiles: number = 0;
  private promiseResolvers: Array<() => void> = [];
  private lastSpeedCalculation: number = 0;
  private lastSpeedSize: number = 0;
  private lastSpeed: number = 0;
  private timeRemaining: number = 0;
  private maxThreads: number;
  private statusChanged: UpdateEventEmitter = new UpdateEventEmitter();

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

  public async download(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.loadAPIData().then(async () => {
        this.queue = []

        if (this.wrongHashes.length > 0 && (this.status === UpdateStatus.HASHED_UPDATE_REQUIRED || this.status === UpdateStatus.DOWNLOADED_UPDATE_REQUIRED)) {
        } else {
          this.wrongHashes = []
          await this.verify(true)
        }

        this.completedFiles = 0;
        this.completedSize = 0;
        this.totalFiles = this.wrongHashes.length

        this.status = UpdateStatus.DOWNLOADING;
        this.setOperationEnded();
        this.statusChanged.emit('statusChanged', this.status);

        const filesToDownload = this.wrongHashes
        this.wrongHashes = []

        for (let i = 0; i < filesToDownload.length; i++) {
          await this.enqueueFileDownload(filesToDownload[i]);
        }

        await this.waitForAllDownloadsToComplete();

        if (this.wrongHashes.length === 0) {
          this.status = UpdateStatus.INTACT;
          this.setOperationEnded();
          this.statusChanged.emit('statusChanged', this.status);
        } else {
          this.status = UpdateStatus.DOWNLOADED_UPDATE_REQUIRED;
          this.setOperationEnded();
          this.statusChanged.emit('statusChanged', this.status);
        }
        resolve(true)
      }).catch(reject)
    })
  }

  public async verify(quick: boolean = false): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.loadAPIData().then(async () => {
        if (!fs.existsSync(join(this.basePath, this.mod.dir))) {
          this.status = UpdateStatus.NOT_FOUND;
          this.setOperationEnded();
          this.statusChanged.emit('statusChanged', this.status);
          resolve(true)
        }

        this.queue = []
        this.wrongHashes = []

        this.completedFiles = 0;
        this.completedSize = 0;
        this.totalFiles = this.hashlist.length

        this.status = UpdateStatus.HASHING;
        this.setOperationEnded();
        this.statusChanged.emit('statusChanged', this.status);

        for (let i = 0; i < this.hashlist.length; i++) {
          await this.enqueueFileHash(this.hashlist[i], quick);
        }

        await this.waitForAllHashesToComplete();

        if (this.wrongHashes.length === 0) {
          this.status = UpdateStatus.INTACT;
          this.setOperationEnded();
          this.statusChanged.emit('statusChanged', this.status);
        } else {
          this.status = UpdateStatus.HASHED_UPDATE_REQUIRED;
          this.setOperationEnded();
          this.statusChanged.emit('statusChanged', this.status);
        }
        resolve(true)
      }).catch(reject)
    })
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
      const success = await this.downloadFile(file);
      if (success) {
        console.log(`Download erfolgreich für ${file.FileName}`);
      } else {
        console.error(`Download fehlgeschlagen oder MD5-Validierung fehlgeschlagen für ${file.FileName}`);
      }
    } catch (error) {
      console.error('Fehler beim Herunterladen:', error);
    } finally {
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
        currentDirectory = join(currentDirectory, directory);
        if (!fs.existsSync(currentDirectory)) {
          fs.mkdirSync(currentDirectory);
        }
      }

      const fileStream = fs.createWriteStream(fullFilePath);
      const hash = crypto.createHash('md5');
      let downloadedSize = 0;

      const req = http.request(options, (res) => {
        res.on('data', (chunk) => {
          downloadedSize += chunk.length;
          fileStream.write(chunk);
          hash.update(chunk);
          this.completedSize += chunk.length;
          this.calculateSpeed();
        });

        res.on('end', () => {
          fileStream.end();
          const downloadedHash = hash.digest('hex');

          if (downloadedHash.toUpperCase() !== file.Hash.toUpperCase()) {
            fs.unlinkSync(fullFilePath);
            this.wrongHashes.push(file);
          }
          resolve(true)
        });

        res.on('error', (error) => {
          reject(error);
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
      const success = await this.hashFile(file, quick);
    } catch (error) {
      console.error('Fehler beim Herunterladen:', error);
    } finally {
      this.completedFiles++;
      this.runningThreads--;

      if (this.completedFiles >= this.totalFiles) {
        this.notifyAllFilesCompleted();
      }

      this.hashNext(quick);
    }
  }

  private async enqueueFileHash(file: ModFile, quick: boolean): Promise<void> {
    this.queue.push(file);
    this.hashNext(quick);
  }

  private async hashFile(file: ModFile, quick: boolean): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const fullFilePath = join(this.basePath, file.RelativPath);

      //console.log(this.queue.length, "files remaining")

      if (!fs.existsSync(fullFilePath)) {
        this.wrongHashes.push(file);
        resolve(true)
      } else {
        const fileSize = fs.statSync(fullFilePath).size;

        

        if (fileSize !== file.Size) {
          this.wrongHashes.push(file);
          resolve(true)
        } else {
          if (!quick || file.FileName.includes('.bisign')) {

            const hash = crypto.createHash('md5');

            const rStream = fs.createReadStream(fullFilePath, { highWaterMark: 256 * 8 * 1024 });
            rStream.on('data', (data) => {
              hash.update(data);
              this.completedSize += data.length;
              this.calculateSpeed();
            });
            rStream.on('end', () => {
              const hashSum = hash.digest('hex');

              if (hashSum.toUpperCase() !== file.Hash.toUpperCase()) {
                this.wrongHashes.push(file);
              }
              resolve(true)
            });
          } else {
            resolve(true)
          }
        }
      }
    });
  }

  private calculateSpeed() {
    if (this.lastSpeedCalculation + 1000 < Date.now()) {
      const doneSinceLastCalculation = this.completedSize - this.lastSpeedSize
      this.lastSpeedSize = this.completedSize;
      this.lastSpeed = Math.round(
        doneSinceLastCalculation / ((Date.now() - this.lastSpeedCalculation) / 1000)
      );
      this.timeRemaining = Math.round(
        (this.getRemainingSize() / this.lastSpeed) * 1000
      );
      this.lastSpeedCalculation = Date.now();
      this.statusChanged.emit('statusChanged', this.status);
    }
  }

  private setOperationEnded() {
    this.lastSpeed = 0
    this.lastSpeedCalculation = 0
    this.completedSize = 0
    this.completedFiles = 0
    this.timeRemaining = 0
    this.queue = []
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
    return this.queue.length
  }

  public getCompletedFiles(): number {
    return this.completedFiles
  }

  public getRemainingSize(): number {
    let size = 0
    for (let i = 0; i < this.queue.length; i++) {
      size += this.queue[i].Size
    }
    return size
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

  public getTotalSize(): number {
    let size = 0
    for (let i = 0; i < this.queue.length; i++) {
      size += this.queue[i].Size
    }
    return size
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
    this.queue = [];
    this.totalFiles = 0;
  }
}