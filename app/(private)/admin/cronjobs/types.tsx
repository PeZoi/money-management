export interface CronJobSchedule {
  timezone: string;
  minutes: number[];
  hours: number[];
  mdays: number[];
  months: number[];
  wdays: number[];
  expiresAt: number;
}

export interface CronJobNotification {
  onFailure: boolean;
  onFailureCount: number;
  onSuccess: boolean;
  onDisable: boolean;
  onSslCertExpiry: boolean;
  onSslCertExpirySeconds: number;
}

export interface CronJob {
  jobId: number;
  title: string;
  url: string;
  enabled: boolean;
  saveResponses: boolean;
  requestMethod: number;
  requestTimeout: number;
  redirectSuccess: boolean;
  lastStatus: number;
  lastDuration: number;
  lastExecution: number;
  nextExecution: number;
  schedule: CronJobSchedule;
  notification?: CronJobNotification;
  auth?: { enable: boolean; user?: string; password?: string };
  extendedData?: { headers?: Record<string, string>; body?: string };
}
