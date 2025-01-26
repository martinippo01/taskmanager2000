export const nfsStepOutputPathEnvVar = 'NFS_PATH' as const;

export type NfsStepOutputEnvVars = {
  [nfsStepOutputPathEnvVar]: string;
};
