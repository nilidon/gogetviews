import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3.5 focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10">
      <Search className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
      />
    </div>
  );
}
