export default interface WorkerStatus {
    status: number,
    message: string,
    fileop_progress: number,
    fileop_speed: number,
    fileop_files_done: number,
    fileop_files_remaining: number,
    fileop_time_remaining: number
}