// Copies the pictures a fixture file uses into a test site, so a build of that file holds no
// unused image (the per-entry image folder rule, src/lib/content/images.ts). A fixture's pictures
// live in tests/fixtures/<collection>/images/<entry>/, next to the rule's layout in src/content/.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export interface CopyReferencedImagesOptions {
  /** The fixture file's text, after any test replacement. */
  text: string;
  /** The fixture file's base name without extension: its own image folder. */
  sourceId: string;
  /** The copied file's base name without extension (the same as `sourceId` unless a test renames it). */
  targetId: string;
  /** The fixtures' images folder to copy from. */
  fromImages: string;
  /** The test site's images folder to copy to. */
  toImages: string;
}

/**
 * Copies each `./images/<folder>/<path>` file the text references and that exists under
 * `fromImages` into `toImages`: into `<targetId>/` when `<folder>` is `sourceId`, into `<folder>/`
 * otherwise. Returns the text with `./images/<sourceId>/` rewritten to `./images/<targetId>/`.
 * Only a reference to a file that exists is rewritten; a reference to a missing file is left as
 * written, so a broken fixture still breaks with the path its test expects.
 */
export function copyReferencedImages({
  text,
  sourceId,
  targetId,
  fromImages,
  toImages,
}: CopyReferencedImagesOptions): string {
  const reference = /\.\/images\/([^/\s)"']+)\/([^\s)"']+)/g;
  if (targetId.includes("/") && text.match(reference)) {
    throw new Error(
      `A fixture copied below the collection folder (${targetId}) cannot use ./images/ references; copy it to the collection folder.`,
    );
  }
  return text.replace(reference, (whole, folder: string, path: string) => {
    const source = resolve(fromImages, folder, path);
    if (!existsSync(source)) return whole;
    const own = folder === sourceId;
    const target = resolve(toImages, own ? targetId : folder, path);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
    return own ? `./images/${targetId}/${path}` : whole;
  });
}
