import { UpdateStatus } from "@/enums/UpdateStatusEnum";


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
  fileop_size_total: number;
}

