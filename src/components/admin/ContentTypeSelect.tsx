import { Label } from "@/components/ui/label"

interface ContentTypeSelectProps {
  value: string[]
  onChange: (contentTypes: string[]) => void
}

export function ContentTypeSelect({ value, onChange }: ContentTypeSelectProps) {
  const contentTypes = ["article", "social", "email", "landing", "blog"]

  return (
    <div className="space-y-2">
      <Label>Content Types</Label>
      <div className="space-y-1">
        {contentTypes.map((type) => (
          <label key={type} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value.includes(type)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...value, type])
                } else {
                  onChange(value.filter((t) => t !== type))
                }
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm capitalize">{type}</span>
          </label>
        ))}
      </div>
    </div>
  )
} 