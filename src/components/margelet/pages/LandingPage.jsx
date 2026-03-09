"use client";

import React from "react";
import Link from "next/link";

function pixelClip() {
  return {
    clipPath:
      "polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))",
  };
}

function PixelButtonLink({ children, href, className = "" }) {
  return (
    <Link
      href={href}
      style={pixelClip()}
      className={`inline-flex items-center justify-center bg-[#63cd8d] px-8 py-4 text-[18px] font-bold !text-[#0d8a4e] transition hover:brightness-[1.03] ${className}`}
    >
      {children}
    </Link>
  );
}

export default function LandingPage({ copy }) {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-4 md:px-0 md:pb-12 md:pt-0">
      <section className="relative">
        {/* DESKTOP */}
        <div className="relative hidden md:block">
          <img
            src="/landing/hero-banner.png"
            alt="margelet hero"
            className="block h-auto w-full object-contain"
          />

          <div className="absolute left-[28px] top-[54px] z-10 max-w-[330px]">
            <h1 className="whitespace-nowrap text-[32px] font-extrabold leading-[1.02] tracking-[-0.02em] text-[#8f6ab5]">
              {copy.heroTitle}
            </h1>

            <div className="mt-3 space-y-[2px] text-[17px] font-normal leading-[1.45] text-[#8f6ab5]">
              {copy.heroLines.map((line) => (
                <div key={line} className="whitespace-nowrap">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MOBILE */}
        <div className="block md:hidden">
          <div className="pt-3">
            <h1 className="whitespace-nowrap text-[26px] font-extrabold leading-[1.02] tracking-[-0.02em] text-[#8f6ab5]">
              {copy.heroTitle}
            </h1>

            <div className="mt-3 space-y-[2px] text-[16px] font-normal leading-[1.45] text-[#8f6ab5]">
              {copy.heroLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          <div className="-mt-5">
            <img
              src="/landing/hero-banner.png"
              alt="margelet hero"
              className="block h-auto w-full object-contain"
            />
          </div>
        </div>
      </section>

      <div className="-mt-9 border-t border-white/60 pt-5 md:-mt-1 md:pt-4">
        <div className="grid gap-4 md:grid-cols-[320px_1fr] md:items-start md:gap-8">
          <div>
            <PixelButtonLink href="/agents" className="w-full md:w-[320px]">
              {copy.cta}
            </PixelButtonLink>
          </div>

          <div className="max-w-[760px]">
            {/* DESKTOP BOTTOM TITLE */}
            <div className="hidden md:block text-[24px] font-extrabold leading-[1.02] tracking-[-0.02em] text-[#8f6ab5]">
              {copy.bottomTitle}
            </div>

            {/* MOBILE BOTTOM TITLE */}
            <div className="block md:hidden text-[26px] font-extrabold leading-[1.02] tracking-[-0.02em] text-[#8f6ab5]">
              {copy.bottomTitle}
            </div>

            <div className="mt-3 text-[17px] leading-[1.45] text-[#8f6ab5] md:text-[17px]">
              {copy.bottomText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}