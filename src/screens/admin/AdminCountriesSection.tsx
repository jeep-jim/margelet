import { COUNTRIES, type CountryCode } from "./admin.countries";
import { AdminSectionCard } from "./AdminSectionCard";

type AdminCountriesSectionProps = {
  selectedCountryCode: CountryCode;
  onSelectCountry: (code: CountryCode) => void;
  counts?: Partial<Record<CountryCode, number>>;
  postsCount?: number;
};

export function AdminCountriesSection({
  selectedCountryCode,
  onSelectCountry,
  counts = {},
  postsCount = 0,
}: AdminCountriesSectionProps) {
  const enabledCountries = COUNTRIES.filter((item) => item.enabled);
  const currentCountry =
    enabledCountries.find((country) => country.code === selectedCountryCode) ||
    enabledCountries[0];

  return (
    <AdminSectionCard
      title="Страна"
      subtitle="Главный контекст управления. Ниже всё перестраивается только под выбранную страну."
      badge={
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
          {counts[currentCountry?.code || selectedCountryCode] || 0} channels
        </div>
      }
    >
      <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-white/10 bg-[#12131a] p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-white/35">Текущая страна</div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-2xl font-semibold tracking-tight text-white">
                {currentCountry?.nativeLabel || selectedCountryCode.toUpperCase()}
              </div>
              <div className="mt-1 text-sm text-white/45">
                {currentCountry?.label || selectedCountryCode.toUpperCase()} market
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Channels</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {counts[currentCountry?.code || selectedCountryCode] || 0}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Posts</div>
                <div className="mt-1 text-lg font-semibold text-white">{postsCount}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#12131a] p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-white/35">Сменить страну</div>
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
            Меняется вся статистика, список каналов, постов и действия ниже.
          </div>
        </div>
      </div>
    </AdminSectionCard>
  );
}
