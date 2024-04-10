export class PanthorUtils { 
    static humanFileSize(bytes: number, si = true, dp = 1, speed = false) {
      const thresh = si ? 1000 : 1024;
    
      if (Math.abs(bytes) < thresh) {
        return bytes + ' B/s';
      }
    
      const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
      let u = -1;
      const r = 10 ** dp;
    
      do {
        bytes /= thresh;
        ++u;
      } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
    
      if (speed) {
        return bytes.toFixed(dp) + ' ' + units[u] + '/s';
      }
      return bytes.toFixed(dp) + ' ' + units[u];
    }
}