import { Label } from "@/components/ui/label"

interface WorkflowSelectProps {
  value: string[]
  onChange: (workflow: string[]) => void
}

export function WorkflowSelect({ value, onChange }: WorkflowSelectProps) {
  const workflowStages = ["draft", "review", "approved", "published"]

  return (
    <div className="space-y-2">
      <Label>Workflow Stages</Label>
      <div className="space-y-1">
        {workflowStages.map((stage) => (
          <label key={stage} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value.includes(stage)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...value, stage])
                } else {
                  onChange(value.filter((s) => s !== stage))
                }
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm capitalize">{stage}</span>
          </label>
        ))}
      </div>
    </div>
  )
} 