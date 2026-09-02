/* --- Centralized avatar photo map --- */

const profileDA = "https://images.unsplash.com/photo-1656952945433-6cc98812d2a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZGVsaXZlcnklMjBtYW4lMjBzbWlsaW5nJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc1OTI0NDI2fDA&ixlib=rb-4.1.0&q=80&w=400";

export const AVATARS: Record<string, string> = {
  // Main user
  "DA": profileDA,
  // Hounkpatin A. - moto driver
  "HA": "https://images.unsplash.com/photo-1690564971527-b21f5b939dff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMG1hbiUyMG1vdG9yY3ljbGUlMjByaWRlciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NTkxNTExNXww&ixlib=rb-4.1.0&q=80&w=400",
  // Aїdatou D. / Aїdatou T. / Aїdatou B. - woman
  "AD": "https://images.unsplash.com/photo-1664629153345-3bb44e9c1cb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGhlYWRzaG90JTIwY29uZmlkZW50fGVufDF8fHx8MTc3NTkxNTExM3ww&ixlib=rb-4.1.0&q=80&w=400",
  "AT": "https://images.unsplash.com/photo-1664629153345-3bb44e9c1cb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGhlYWRzaG90JTIwY29uZmlkZW50fGVufDF8fHx8MTc3NTkxNTExM3ww&ixlib=rb-4.1.0&q=80&w=400",
  "AB": "https://images.unsplash.com/photo-1672846083954-aa0672b5a70e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBkcml2ZXIlMjBwb3J0cmFpdCUyMGNoZWVyZnVsfGVufDF8fHx8MTc3NTkxNTExNXww&ixlib=rb-4.1.0&q=80&w=400",
  // Gbètoho B. - man
  "GB": "https://images.unsplash.com/photo-1597384708133-af8b03bb1287?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMG1hbiUyMHBvcnRyYWl0JTIwY2FzdWFsJTIweW91bmclMjBhZnJpY2FufGVufDF8fHx8MTc3NTkxNTExM3ww&ixlib=rb-4.1.0&q=80&w=400",
  // Sessinou A. - man
  "SA": "https://images.unsplash.com/photo-1518809595274-1471d16319b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZXN0JTIwYWZyaWNhbiUyMG1hbiUyMHBvcnRyYWl0JTIwaGVhZHNob3R8ZW58MXx8fHwxNzc1OTE1MTE0fDA&ixlib=rb-4.1.0&q=80&w=400",
  // Fifamè D. - woman
  "FD": "https://images.unsplash.com/photo-1672622933740-52331291f511?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBzbWlsaW5nJTIwcG9ydHJhaXQlMjB3YXJtfGVufDF8fHx8MTc3NTkxNTExNHww&ixlib=rb-4.1.0&q=80&w=400",
  // Togbédji M. - man
  "TM": "https://images.unsplash.com/photo-1605506582466-e2138356b9e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIweW91bmclMjB3b21hbiUyMHBvcnRyYWl0JTIwZWxlZ2FudHxlbnwxfHx8fDE3NzU5MTUxMTV8MA&ixlib=rb-4.1.0&q=80&w=400",
};

/** Helper: get avatar URL by initials, fallback to null */
export function getAvatar(initials: string): string | null {
  return AVATARS[initials] ?? null;
}