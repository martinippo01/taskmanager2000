export interface HealthCheckDomain {
  check(): Promise<{ status: string; details: any }>;
}

export const HealthCheckDomain = Symbol('HealthCheckDomain');
