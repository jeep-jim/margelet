type AccessGrant = {
  telegramUserId?: string | null;
  username?: string | null;
  role?: string | null;
  updatedAt?: string | null;
  note?: string | null;
  isActive?: boolean;
};

type Props = {
  grants: AccessGrant[];
  isLoading?: boolean;
};

function formatValue(value: string | null | undefined) {
  return value && value.trim() ? value : "—";
}

export function AdminAccessSection({ grants, isLoading = false }: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Управление доступом</h2>
        <p className="mt-1 text-sm text-white/60">
          Lite-режим: доступ к админке только у владельца проекта.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
          загрузка...
        </div>
      ) : grants.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
          доступов пока нет
        </div>
      ) : (
        <div className="space-y-3">
          {grants.map((grant, index) => (
            <div
              key={`${grant.telegramUserId ?? "grant"}-${index}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                    Telegram ID
                  </div>
                  <div className="mt-1 text-sm text-white">
                    {formatValue(grant.telegramUserId)}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                    Username
                  </div>
                  <div className="mt-1 text-sm text-white">
                    {formatValue(grant.username)}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                    Роль
                  </div>
                  <div className="mt-1 text-sm text-white">
                    {formatValue(grant.role)}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                    Статус
                  </div>
                  <div className="mt-1 text-sm text-white">
                    {grant.isActive ? "активен" : "выключен"}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                    Обновлён
                  </div>
                  <div className="mt-1 text-sm text-white">
                    {formatValue(grant.updatedAt)}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                    Примечание
                  </div>
                  <div className="mt-1 text-sm text-white">
                    {formatValue(grant.note)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminAccessSection;