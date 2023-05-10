export default interface WorkerStatus {
    //0: Idle
    //1: Loading Mod-Information
    //2: Getting Version-Mismatch (Based on Names)
    //3: Hashing
    //4: 
    //5: Downloading
    status: number,
    message: string,
    fileop_progress: number,
    fileop_speed: number,
    fileop_files_done: number,
    fileop_files_remaining: number,
    fileop_time_remaining: number,
    fileop_size_done: number,
    fileop_size_remaining: number,
}