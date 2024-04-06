export enum TfarDownloadStatus {
    READY = 0,
    REQUESTED = 1,
    DOWNLOADING = 2,
    LAUNCHING = 3,
    UNPACKING = 4,
    ERROR = 5
}

export var TfarDownloadStatusTexts = {
    [TfarDownloadStatus.READY]: "Download starten",
    [TfarDownloadStatus.REQUESTED]: "Download startet...",
    [TfarDownloadStatus.DOWNLOADING]: "Download läuft",
    [TfarDownloadStatus.LAUNCHING]: "Starte Installation...",
    [TfarDownloadStatus.UNPACKING]: "Installation fehlgeschlagen, wird entpackt, bitte manuell installieren",
    [TfarDownloadStatus.ERROR]: "Fehler"
};

export var TfarDownloadStatusColors = {
    [TfarDownloadStatus.READY]: "primary",
    [TfarDownloadStatus.REQUESTED]: "success",
    [TfarDownloadStatus.DOWNLOADING]: "success",
    [TfarDownloadStatus.LAUNCHING]: "success",
    [TfarDownloadStatus.UNPACKING]: "warning",
    [TfarDownloadStatus.ERROR]: "danger"
};

export var TfarDownloadStatusIcons = {
    [TfarDownloadStatus.READY]: "mdi-download",
    [TfarDownloadStatus.REQUESTED]: "mdi-progress-download",
    [TfarDownloadStatus.DOWNLOADING]: "mdi-loading mdi-spin",
    [TfarDownloadStatus.LAUNCHING]: "mdi-check",
    [TfarDownloadStatus.UNPACKING]: "mdi-archive-clock-outline",
    [TfarDownloadStatus.ERROR]: "mdi-alert-outline"
};