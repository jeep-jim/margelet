import { useMemo } from "react";
import { COUNTRIES, type CountryCode } from "./admin.countries";

type AdminCountriesSectionProps = {
  selectedCountryCode: CountryCode;
  onSelectCountry: (code: CountryCode) => void;
  counts?: Partial<Record<CountryCode, number>>;
};

export function AdminCountriesSection({
  selectedCountryCode,
  onSelectCountry,
  counts = {},
}: AdminCountriesSectionProps) {
  const enabledCountries = useMemo(
    () => COUNTRIES.filter((item) => item.enabled),
    []
  );

  const currentCountry =
    enabledCountries.find((c) => c.code === selectedCountryCode) ||
    enabledCountries[0];

  const currentCount =
    counts[currentCountry?.code || selectedCountryCode] || 0;

  return (
    <div className="flex items-center gap-3">

      {/* select + кастомная стрелка */}
      <div className="relative min-w-0 flex-1">
        <select
          value={selectedCountryCode}
          onChange={(e) =>
            onSelectCountry(e.target.value as CountryCode)
          }
          className="w-full appearance-none rounded-xl border border-white/10 bg-[#1a1b24] px-3 py-2 pr-10 text-sm text-white outline-none"
        >
          {enabledCountries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.nativeLabel} · {country.label}
            </option>
          ))}
        </select>

        {/* стрелка (контролируемая) */}
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/60 text-sm">
          ▾
        </span>
      </div>

      {/* каналов */}
      <div className="flex h-[38px] items-center rounded-xl border border-white/10 bg-[#1a1b24] px-3 text-sm text-white/80 whitespace-nowrap">
        {currentCount} каналов
      </div>

    </div>
  );
}