"use client";

import { useState } from "react";

export default function CompanyLogo({
  domain,
  name,
}: {
  domain: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!domain || failed) {
    return null;
  }

  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={name}
      className="w-8 h-8 rounded"
      onError={() => setFailed(true)}
    />
  );
}
