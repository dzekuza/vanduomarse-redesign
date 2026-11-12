/**
 * Array methods that React Native's Hermes engine may not have. The mobile app imports code shared with the website
 * (`lib/admin/mappers.ts`, `calendar-entries.ts`, `cabin.ts` call `toSorted`), which runs right after sign-in: a missing
 * method there surfaces as "undefined is not a function". Imported first in `app/_layout.tsx`; each method is only
 * defined when it is missing, so an engine that has them keeps its own.
 */
function define(name: string, value: (this: unknown[], ...args: never[]) => unknown) {
  if (typeof (Array.prototype as unknown as Record<string, unknown>)[name] === "function") return;
  Object.defineProperty(Array.prototype, name, { value, writable: true, configurable: true });
}

define("toSorted", function (this: unknown[], compare?: (a: unknown, b: unknown) => number) {
  return [...this].sort(compare);
});
define("toReversed", function (this: unknown[]) {
  return [...this].reverse();
});
define("toSpliced", function (this: unknown[], ...args: unknown[]) {
  const copy = [...this];
  (copy.splice as (...a: unknown[]) => unknown[])(...args);
  return copy;
});
define("with", function (this: unknown[], index: number, value: unknown) {
  const copy = [...this];
  const i = index < 0 ? copy.length + index : index;
  if (i < 0 || i >= copy.length) throw new RangeError("Invalid index");
  copy[i] = value;
  return copy;
});
define("findLast", function (this: unknown[], predicate: (value: unknown, index: number, array: unknown[]) => boolean) {
  for (let i = this.length - 1; i >= 0; i--) if (predicate(this[i], i, this)) return this[i];
  return undefined;
});
define("findLastIndex", function (this: unknown[], predicate: (value: unknown, index: number, array: unknown[]) => boolean) {
  for (let i = this.length - 1; i >= 0; i--) if (predicate(this[i], i, this)) return i;
  return -1;
});

export {};
