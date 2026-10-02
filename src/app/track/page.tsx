import { Suspense } from "react";
import { TrackClient } from "./TrackClient";

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <TrackClient />
    </Suspense>
  );
}
