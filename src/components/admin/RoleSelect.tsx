import { Label } from "@/components/ui/label"

interface RoleSelectProps {
  value: string[]
  onChange: (roles: string[]) => void
}

export function RoleSelect({ value, onChange }: RoleSelectProps) {
  const roles = ["admin", "editor", "writer", "reviewer"]

  return (
    <div className="space-y-2">
      <Label>Roles</Label>
      <div className="space-y-1">
        {roles.map((role) => (
          <label key={role} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value.includes(role)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...value, role])
                } else {
                  onChange(value.filter((r) => r !== role))
                }
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm capitalize">{role}</span>
          </label>
        ))}
      </div>
    </div>
  )
} 