import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

module.exports = {
  preset: 'shared',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'test',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/../',
  }),
  coverageDirectory: '../coverage',
};
