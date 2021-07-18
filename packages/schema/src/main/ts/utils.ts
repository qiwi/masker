export const isObject = (value: any): boolean => value !== null && typeof value === 'object'

export const joinPath = (a: string, b: string): string => a ? `${a}.${b}` : b
