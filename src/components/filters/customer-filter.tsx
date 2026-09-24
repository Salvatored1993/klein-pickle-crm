"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export const ALL_CUSTOMERS = "__all__";

type CustomerOption = { id: string; name: string };

export function CustomerFilter({
  value,
  onChange,
  customers,
}: {
  value: string;
  onChange: (value: string) => void;
  customers: { code: string; name: string }[];
}) {
  const options: CustomerOption[] = customers.map((c) => ({ id: c.code, name: c.name }));
  // No fake "All customers" entry in the item list — a Combobox with a
  // real pre-selected value doesn't clear it when you start typing (it
  // appends instead), so "cleared" is represented as no selection at all,
  // with the placeholder communicating the default.
  const selected = options.find((o) => o.id === value) ?? null;

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(
        option: CustomerOption | null,
        eventDetails?: { reason?: string },
      ) => {
        if (option === null && eventDetails?.reason === "escape-key") return;
        onChange(option?.id ?? ALL_CUSTOMERS);
      }}
      itemToStringLabel={(option: CustomerOption) => option.name}
      isItemEqualToValue={(a: CustomerOption, b: CustomerOption) => a.id === b.id}
    >
      <ComboboxInput
        placeholder="All customers"
        showClear={selected !== null}
        className="w-full sm:w-64"
      />
      <ComboboxContent>
        <ComboboxEmpty>No customers found.</ComboboxEmpty>
        <ComboboxList>
          {(option: CustomerOption) => (
            <ComboboxItem key={option.id} value={option}>
              {option.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
