export enum UpdateStatus {
  UKNOWN = 0,
  INTACT = 1,
  HASHING = 2,
  HASHED_UPDATE_REQUIRED = 3,
  DOWNLOADING = 4,
  DOWNLOADED_UPDATE_REQUIRED = 5,
  NOT_FOUND = 6
}

export var StatusTexts = {
  [UpdateStatus.UKNOWN]: "Status unbekannt",
  [UpdateStatus.INTACT]: "Mod ist aktuell",
  [UpdateStatus.HASHING]: "Überprüfung läuft",
  [UpdateStatus.HASHED_UPDATE_REQUIRED]: "Überpüfung abgeschlossen, Update erforderlich",
  [UpdateStatus.DOWNLOADING]: "Download läuft",
  [UpdateStatus.DOWNLOADED_UPDATE_REQUIRED]: "Download unvollständig, Update erforderlich",
  [UpdateStatus.NOT_FOUND]: "Nicht installiert"
};

export var StatusColors = {
  [UpdateStatus.UKNOWN]: "warning",
  [UpdateStatus.INTACT]: "success",
  [UpdateStatus.HASHING]: "primary",
  [UpdateStatus.HASHED_UPDATE_REQUIRED]: "warning",
  [UpdateStatus.DOWNLOADING]: "primary",
  [UpdateStatus.DOWNLOADED_UPDATE_REQUIRED]: "warning",
  [UpdateStatus.NOT_FOUND]: "primary"
};

export var StatusIcons = {
  [UpdateStatus.UKNOWN]: "mdi-help-rhombus-outline",
  [UpdateStatus.INTACT]: "mdi-check-decagram-outline",
  [UpdateStatus.HASHING]: "mdi-loading mdi-spin",
  [UpdateStatus.HASHED_UPDATE_REQUIRED]: "mdi-alert-outline",
  [UpdateStatus.DOWNLOADING]: "mdi-loading mdi-spin", 
  [UpdateStatus.DOWNLOADED_UPDATE_REQUIRED]: "mdi-alert-outline",
  [UpdateStatus.NOT_FOUND]: "mdi-download"
};

export default interface WorkerStatus {
  status: UpdateStatus;
  message: string;
  icon: string;
  color: string;
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

