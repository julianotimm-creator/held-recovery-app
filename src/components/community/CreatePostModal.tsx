import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CreatePostModal({
  onClose,
  onCreate,
  isPending,
}: {
  onClose: () => void;
  onCreate: (values: { title: string; content: string }) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Preencha título e conteúdo.");
      return;
    }
    setError(null);
    onCreate({ title: title.trim(), content: content.trim() });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Novo tópico"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="surface-panel w-full max-w-md space-y-4 p-5"
      >
        <h2 className="text-base font-semibold text-foreground">Novo tópico</h2>

        <div className="space-y-1">
          <Input
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            autoFocus
          />
          <p className="text-right text-[11px] text-muted-foreground">{title.length}/100</p>
        </div>

        <div className="space-y-1">
          <Textarea
            value={content}
            maxLength={1000}
            rows={6}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Compartilhe o que está sentindo. Tudo aqui é anônimo."
          />
          <p className="text-right text-[11px] text-muted-foreground">{content.length}/1000</p>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            Criar tópico
          </Button>
        </div>
      </form>
    </div>
  );
}
