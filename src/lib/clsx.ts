/** Minimal className joiner (avoids pulling in the `clsx` dependency for one use-case). */
export default function clsx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
