"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { MessagesView } from "../_components/MessagesView";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense>
      <MessagesView activeId={id} />
    </Suspense>
  );
}
