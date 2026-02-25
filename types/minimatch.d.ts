declare module "minimatch" {
  export function match(list: string[], pattern: string): string[];
  export function filter(pattern: string): (value: string) => boolean;
  export function makeRe(pattern: string): RegExp;
}