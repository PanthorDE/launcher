export enum UpdateStatus {
  UKNOWN = 0,
  INTACT = 1,
  HASHING = 2,
  HASHED_UPDATE_REQUIRED = 3,
  DOWNLOADING = 4,
  DOWNLOADED_UPDATE_REQUIRED = 5,
}

export var StatusTexts = {
  [UpdateStatus.UKNOWN]: "Status unbekannt",
  [UpdateStatus.INTACT]: "Mod ist aktuell",
  [UpdateStatus.HASHING]: "Überprüfung läuft",
  [UpdateStatus.HASHED_UPDATE_REQUIRED]: "Überpüfung abgeschlossen, Update erforderlich",
  [UpdateStatus.DOWNLOADING]: "Download läuft",
  [UpdateStatus.DOWNLOADED_UPDATE_REQUIRED]: "Download unvollständig, Update erforderlich"
};

export default interface WorkerStatus {
  status: UpdateStatus;
  message: string;
  fileop_progress: number;
  fileop_speed: number;
  fileop_files_done: number;
  fileop_files_remaining: number;
  fileop_time_remaining: number;
  fileop_size_done: number;
  fileop_size_remaining: number;
  fileop_files_broken: number;
  fileop_files_broken_size: number;
}

