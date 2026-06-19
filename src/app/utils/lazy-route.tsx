/**
 * Helper de code-splitting IPPOO.
 *
 * Usage dans routes.tsx :
 *   const AdminDashboard = lazyRoute(() => import("./components/admin/admin-dashboard"), "AdminDashboard");
 *
 * Puis dans la définition de route :
 *   { path: "/admin", element: <AdminDashboard /> }
 *
 * Bénéfice : chunks séparés par sous-app (client / driver / admin), pré-fetch
 * possible via `route.preload()` au survol des liens.
 */
import { Suspense, lazy, type ComponentType } from "react";
import { Skeleton } from "../components/ui-extras";

export function lazyRoute<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T } | Record<string, T>>,
  exportName?: string,
) {
  const Comp = lazy(async () => {
    const mod = await loader();
    if ("default" in mod) return mod as { default: T };
    if (exportName && (mod as any)[exportName]) {
      return { default: (mod as any)[exportName] as T };
    }
    const first = Object.values(mod)[0] as T;
    return { default: first };
  });

  function Wrapped(props: any) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Comp {...props} />
      </Suspense>
    );
  }
  (Wrapped as any).preload = loader;
  return Wrapped;
}

function PageSkeleton() {
  return (
    <div className="p-4 space-y-3" aria-busy="true">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
