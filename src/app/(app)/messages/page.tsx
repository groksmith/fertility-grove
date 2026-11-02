"use client";

import { Suspense } from "react";
import { MessagesView } from "./MessagesView";

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesView activeId={null} />
    </Suspense>
  );
}
