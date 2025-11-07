import slugify from "slugify";

export function generateSlug(base: string): string {
  // Clean + normalize
  const clean = slugify(base, { lower: true, strict: true });

  // Short unique suffix (base36 avoids collisions, readable)
  const suffix = Math.random().toString(36).substring(2, 7);

  return `${clean}-${suffix}`;
}
