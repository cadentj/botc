import type { ScriptId } from "@org/types";
import { SCRIPTS, getFirstNightOrder, getOtherNightOrder } from "@org/types";

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
      <div className="night-order-sheet">
        <button className="close-btn" onClick={onClose}>
          ← Back to Grimoire
        </button>
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

  return (
    <div className="night-order-sheet">
      <button className="close-btn" onClick={onClose}>
        ← Back to Grimoire
      </button>

      <div className="night-order-content">
        <section className="night-section">
          <h2>First Night</h2>
          {firstNight.length === 0 ? (
            <p className="no-characters">No characters wake on the first night</p>
          ) : (
            <ol className="night-order-list">
              {firstNight.map((char) => (
                <li key={char.id} className={`night-order-item ${char.type}`}>
                  <span className="character-name">{char.name}</span>
                  <span className="character-ability">{char.ability}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="night-section">
          <h2>Other Nights</h2>
          {otherNights.length === 0 ? (
            <p className="no-characters">No characters wake on other nights</p>
          ) : (
            <ol className="night-order-list">
              {otherNights.map((char) => (
                <li key={char.id} className={`night-order-item ${char.type}`}>
                  <span className="character-name">{char.name}</span>
                  <span className="character-ability">{char.ability}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

