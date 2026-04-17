import { useMemo } from "react";
import { COUNTRIES, type CountryCode } from "./admin.countries";
import { AdminSectionCard } from "./AdminSectionCard";

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
    enabledCountries.find((country) => country.code === selectedCountryCode) ||
    enabledCountries[0];

  const currentCount = counts[currentCountry?.code || selectedCountryCode] || 0;

  return (
    <AdminSectionCard
      title="Страна"
      subtitle="Главный контекст управления. Ниже всё перестраивается только под выбранную страну."
      badge={
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
          {currentCount} каналов
        </div>
      }
    >
      <div className="rounded-3xl border border-white/10 bg-[#12131a] p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-white/35">
          Сменить страну
        </div>

        <select
          value={selectedCountryCode}
          onChange={(event) => onSelectCountry(event.target.value as CountryCode)}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-base text-white outline-none"
        >
          {enabledCountries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.nativeLabel} · {country.label}
            </option>
          ))}
        </select>

        <div className="mt-3 text-sm text-white/45">
          Сейчас выбрана страна:{" "}
          <span className="text-white">
            {currentCountry?.nativeLabel || selectedCountryCode.toUpperCase()}
          </span>
        </div>
      </div>
    </AdminSectionCard>
  );
}