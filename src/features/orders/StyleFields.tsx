import { buttonChoices, LAPELS, SUIT_CUTS, VENTS, type SuitStyle } from '@/domain/orders';
import { useI18n } from '@/i18n';
import { Segmented } from '@/ui/Segmented';
import { TextField } from '@/ui/Field';

export function StyleFields({ value, onChange }: { value: SuitStyle; onChange: (style: SuitStyle) => void }) {
  const { t } = useI18n();
  const choices = buttonChoices(value.cut);
  return (
    <div className="flex flex-col gap-4">
      <Segmented
        label={t.orders.cut}
        value={value.cut}
        options={SUIT_CUTS.map((c) => ({ value: c, label: t.orders.cuts[c] }))}
        onChange={(cut) => onChange({ ...value, cut })}
        size="sm"
      />
      <Segmented
        label={t.orders.lapel}
        value={value.lapel}
        options={LAPELS.map((l) => ({ value: l, label: t.orders.lapels[l] }))}
        onChange={(lapel) => onChange({ ...value, lapel })}
        size="sm"
      />
      {choices ? (
        <Segmented
          label={t.orders.buttons}
          value={value.buttons}
          options={choices.map((b) => ({ value: b, label: t.orders.buttonCount(b) }))}
          onChange={(buttons) => onChange({ ...value, buttons })}
          size="sm"
        />
      ) : value.cut === 'double_breasted' ? (
        <TextField
          label={t.orders.buttons}
          placeholder={t.orders.buttonsPlaceholder}
          value={value.buttons ?? ''}
          maxLength={10}
          onChange={(e) => onChange({ ...value, buttons: e.target.value })}
        />
      ) : null}
      <Segmented
        label={t.orders.vent}
        value={value.vent}
        options={VENTS.map((v) => ({ value: v, label: t.orders.vents[v] }))}
        onChange={(vent) => onChange({ ...value, vent })}
        size="sm"
      />
    </div>
  );
}

export function styleSummary(style: SuitStyle, t: ReturnType<typeof useI18n>['t']): string[] {
  const parts: string[] = [];
  if (style.cut) parts.push(t.orders.cuts[style.cut]);
  if (style.lapel) parts.push(t.orders.lapels[style.lapel]);
  if (style.buttons) parts.push(/^\d$/.test(style.buttons) ? t.orders.buttonCount(style.buttons) : style.buttons);
  if (style.vent) parts.push(t.orders.vents[style.vent]);
  return parts;
}
