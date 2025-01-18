type AtomicInputParamType = 'string' | 'number' | 'boolean';
type ArrayInputParamType = `${AtomicInputParamType}[]`;
type InputParamType = AtomicInputParamType | ArrayInputParamType;
export type InputParams = Record<string, InputParamType>;

export const isInputParams = (data: any): data is InputParams => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  for (const key in data) {
    if (typeof key !== 'string' || !key) {
      return false;
    }
    const value = data[key];
    const regex = /^(string|number|boolean)(\[\])?$/;
    if (typeof value !== 'string' || !value || !regex.test(value)) {
      return false;
    }
  }
  return true;
};

type AtomicInputArgumentType = string | number | boolean;
type ArrayInputArgumentType = AtomicInputArgumentType[];
type InputArgumentType = AtomicInputArgumentType | ArrayInputArgumentType;
export type InputArguments = Record<string, InputArgumentType>;

const isParamArray = (
  paramType: InputParamType,
): paramType is ArrayInputParamType => paramType.endsWith('[]');

const getInputAtomicType = (
  arrayParamType: ArrayInputParamType,
): AtomicInputParamType => arrayParamType.slice(0, -2) as AtomicInputParamType;

const getArgumentNumber = (argument: string): number | null => {
  const regex = /^-?\d+((\.|,)\d+)?$/;
  if (!regex.test(argument)) {
    return null;
  }
  return parseFloat(argument);
};

const getArgumentBoolean = (argument: string): boolean | null => {
  if (argument === 'true') {
    return true;
  }
  if (argument === 'false') {
    return false;
  }
  return null;
};

export const getInputArgumentFromParamType = (
  argument: string | string[],
  paramType: InputParamType,
): InputArgumentType | null => {
  const getAtomicArgumentParser = (atomicParamType: AtomicInputParamType) => {
    switch (atomicParamType) {
      case 'string':
        return (arg: string) => arg;
      case 'number':
        return getArgumentNumber;
      case 'boolean':
        return getArgumentBoolean;
      default:
        return null;
    }
  };
  if (Array.isArray(argument)) {
    if (!isParamArray(paramType)) {
      return null;
    }
    const baseType = getInputAtomicType(paramType);
    const atomicArgumentParser = getAtomicArgumentParser(baseType);
    if (!atomicArgumentParser) {
      return null;
    }
    const out: AtomicInputArgumentType[] = [];
    for (const arg of argument) {
      const parsedArg = atomicArgumentParser(arg);
      if (parsedArg === null) {
        return null;
      }
      out.push(parsedArg);
    }
    return out;
  }
  if (isParamArray(paramType)) {
    return null;
  }
  const atomicArgumentParser = getAtomicArgumentParser(paramType);
  if (!atomicArgumentParser) {
    return null;
  }
  return atomicArgumentParser(argument);
};
