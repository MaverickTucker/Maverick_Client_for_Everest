import { CollapsiblePanel } from './CollapsiblePanel'

export function PreviewPanel() {
  return (
    <CollapsiblePanel title="Preview">
      <div className="flex-1 h-full overflow-auto bg-black m-3 rounded border border-glacier-700 flex items-center justify-center color-glacier-600 text-xs">
        PREVIEW RENDER
      </div>
    </CollapsiblePanel>
  )
}


