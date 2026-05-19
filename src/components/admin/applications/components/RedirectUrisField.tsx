import { Globe, AlertTriangle } from "lucide-react"

interface RedirectUrisFieldProps {
  redirectUris: string[]
  onUriChange: (index: number, value: string) => void
  onAddUri: () => void
  onRemoveUri: (index: number) => void
  t: {
    redirect_uris: string
    placeholder_uri: string
  }
}

export function RedirectUrisField({
  redirectUris,
  onUriChange,
  onAddUri,
  onRemoveUri,
  t
}: RedirectUrisFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
        <Globe size={10} /> {t.redirect_uris}
      </label>
      <div className="space-y-2">
        {redirectUris.map((uri, index) => (
          <div key={index} className="flex gap-2">
            <input 
              required
              type="url"
              value={uri}
              onChange={e => onUriChange(index, e.target.value)}
              className="flex-1 bg-muted/50 border border-border rounded-none px-3 py-2 text-[10px] font-mono focus:ring-1 focus:ring-primary transition-all text-foreground"
              placeholder={t.placeholder_uri}
            />
            <button 
              type="button"
              aria-label="Remove URI"
              onClick={() => onRemoveUri(index)}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-none transition-colors"
            >
              <AlertTriangle size={14} />
            </button>
          </div>
        ))}
        <button 
          type="button"
          aria-label="Add Redirect URI"
          onClick={onAddUri}
          className="w-full py-2 border border-dashed border-border rounded-none text-[9px] font-black uppercase tracking-widest hover:border-primary/50 hover:text-primary transition-all"
        >
          + Add Redirect URI
        </button>
      </div>
    </div>
  )
}
