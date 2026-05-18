/**
 * Copy this folder to src/modules/<your-module>/ and register in core/registry.js.
 * Use db from ../../db/schema.js or add new Dexie tables in a schema version bump.
 */
export function ModuleTemplate() {
  return (
    <div class="empty-state">
      <div class="emoji">🧩</div>
      <p>New module — wire up in core/registry.js</p>
    </div>
  );
}
