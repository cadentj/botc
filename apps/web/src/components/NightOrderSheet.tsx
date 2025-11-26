import type { ScriptId } from "@org/types";
import { SCRIPTS, getFirstNightOrder, getOtherNightOrder } from "@org/types";
import { Button } from "@/components/ui/button";

interface NightOrderSheetProps {
  characterIds: string[];
  script: ScriptId;
  onClose: () => void;
}

export function NightOrderSheet({
  characterIds,
  script,
  onClose,
}: NightOrderSheetProps) {
  const scriptData = SCRIPTS[script];

  if (!scriptData) {
    return (
      <div className="flex-1 p-6 bg-background overflow-y-auto">
        <Button variant="outline" onClick={onClose} className="mb-6">
          ← Back to Grimoire
        </Button>
        <p>Unknown script</p>
      </div>
    );
  }

  // Get only the selected characters
  const selectedCharacters = scriptData.characters.filter((c) =>
    characterIds.includes(c.id)
  );

  const firstNight = getFirstNightOrder(selectedCharacters);
  const otherNights = getOtherNightOrder(selectedCharacters);

  const typeColors: Record<string, string> = {
    townsfolk: "border-l-blue-500",
    outsider: "border-l-cyan-500",
    minion: "border-l-orange-500",
    demon: "border-l-red-500",
  };

  return (
    <div className="flex-1 p-6 bg-background overflow-y-auto">
      <Button variant="outline" onClick={onClose} className="mb-6">
        ← Back to Grimoire
      </Button>

      <div className="flex gap-12 max-w-5xl mx-auto">
        <section className="flex-1">
          <h2 className="text-xl mb-4 text-[#c9a227]">First Night</h2>
          {firstNight.length === 0 ? (
            <p className="text-muted-foreground italic">No characters wake on the first night</p>
          ) : (
            <ol className="list-none p-0 m-0 [counter-reset:night-order]">
              {firstNight.map((char, index) => (
                <li
                  key={char.id}
                  className={`flex flex-col gap-1 p-3 mb-2 bg-card rounded-md border-l-4 relative pl-8 ${typeColors[char.type] || ""}`}
                  style={{ counterIncrement: "night-order" }}
                >
                  <span className="absolute -left-8 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-foreground">{char.name}</span>
                  <span className="text-sm text-muted-foreground">{char.ability}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="flex-1">
          <h2 className="text-xl mb-4 text-[#c9a227]">Other Nights</h2>
          {otherNights.length === 0 ? (
            <p className="text-muted-foreground italic">No characters wake on other nights</p>
          ) : (
            <ol className="list-none p-0 m-0 [counter-reset:night-order]">
              {otherNights.map((char, index) => (
                <li
                  key={char.id}
                  className={`flex flex-col gap-1 p-3 mb-2 bg-card rounded-md border-l-4 relative pl-8 ${typeColors[char.type] || ""}`}
                  style={{ counterIncrement: "night-order" }}
                >
                  <span className="absolute -left-8 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-foreground">{char.name}</span>
                  <span className="text-sm text-muted-foreground">{char.ability}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

