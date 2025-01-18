export interface HealthCheckDomain {
  check(): Promise<boolean>;
}

export const HealthCheckDomain = Symbol('HealthCheckDomain');
