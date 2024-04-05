import WorkerStatus from "./WorkerStatusInterface";

export default interface Mod {
  id: number;
  name: string;
  appid: number;
  files: string;
  active: boolean;
  desc: string;
  img: string;
  has_files: boolean;
  dir: string;
  worker_status: WorkerStatus;
  version_hash: string;
}
