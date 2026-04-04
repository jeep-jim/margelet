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
  const enabledCountries = COUNTRIES.filter((item) => item.enabled);
  const disabledCountries = COUNTRIES.filter((item) => !item.enabled);

  return (
    <AdminSectionCard
      title="Страны"
      subtitle="Выбери страну. Ниже будут каналы и источники только этой страны."
    >
      <div className="flex flex-wrap gap-2">
        {enabledCountries.map((country) => {
          const active = selectedCountryCode === country.code;
          const count = counts[country.code] || 0;

          return (
            <button
              key={country.code}
              type="button"
              onClick={() => onSelectCountry(country.code)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                active
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              <span className="font-medium">{country.nativeLabel}</span>
              <span className={`ml-2 ${active ? "text-black/70" : "text-white/55"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {disabledCountries.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/35">
            Позже
          </div>

          <div className="flex flex-wrap gap-2">
            {disabledCountries.map((country) => (
              <div
                key={country.code}
                className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/35"
              >
                {country.nativeLabel}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </AdminSectionCard>
  );
}