"use client";

import React from "react";
import Billing from "./Billing";

export default function PricePage({ copy }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-3 pt-4 sm:px-4 lg:px-6">
      <Billing copy={copy} />
    </div>
  );
}