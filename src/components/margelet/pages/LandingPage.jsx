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
      className={`inline-flex items-center justify-center bg-[#63cd8d] px-8 py-[15px] text-[17px] font-extrabold text-[#0d8a4e] transition hover:brightness-[1.03] ${className}`}
    >
      <span className="text-[#0d8a4e]">{children}</span>
    </Link>
  );
}

export default function LandingPage({ copy }) {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-12 pt-5 md:px-6 md:pb-16 md:pt-6">
      <section className="relative">
        {/* DESKTOP */}
        <div className="relative hidden md:block">
          <img
            src="/landing/hero-banner.png"
            alt="margelet hero"
            className="block h-auto w-full object-contain"
          />

          <div className="absolute left-[28px] top-[56px] z-10 max-w-[330px]">
            <h1 className="whitespace-nowrap text-[31px] font-extrabold leading-[1.02] tracking-[-0.025em] text-[#8f6ab5] lg:text-[33px]">
              {copy.heroTitle}
            </h1>

            <div className="mt-3 space-y-[2px] text-[17px] font-normal leading-[1.45] text-[#8f6ab5] lg:text-[18px]">
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
          <div className="px-1 pt-3">
            <h1 className="whitespace-nowrap text-[26px] font-extrabold leading-[1.02] tracking-[-0.025em] text-[#8f6ab5]">
              {copy.heroTitle}
            </h1>

            <div className="mt-4 space-y-[3px] text-[16px] font-normal leading-[1.45] text-[#8f6ab5]">
              {copy.heroLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          <div className="mt-2">
            <img
              src="/landing/hero-banner.png"
              alt="margelet hero"
              className="block h-auto w-full object-contain"
            />
          </div>
        </div>
      </section>

      <div className="mt-1 border-t border-white/60 pt-4 md:-mt-1 md:pt-5">
        <div className="grid gap-5 md:grid-cols-[320px_1fr] md:items-start md:gap-8">
          <div className="flex justify-start">
            <PixelButtonLink href="/agents" className="w-full md:w-[305px]">
              {copy.cta}
            </PixelButtonLink>
          </div>

          <div className="max-w-[760px]">
            <div className="text-[8px] font-extrabold leading-[1.04] tracking-[-0.025em] text-[#8b72b9] md:text-[38px] lg:text-[40px]">
              {copy.bottomTitle}
            </div>

            <div className="mt-3 max-w-[760px] text-[17px] font-normal leading-[1.45] text-[#6672a8] md:text-[18px]">
              {copy.bottomText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}