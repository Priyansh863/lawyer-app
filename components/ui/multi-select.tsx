import React from "react"

interface Option {
  label: string
  value: string
}

interface MultiSelectProps {
  options: Option[]
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  id?: string
  disabled?: boolean
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  id,
  disabled
}) => {
  const handleToggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val))
    } else {
      onChange([...value, val])
    }
  }
  return (
    <div id={id}>
      <div className="border rounded-md p-2 bg-white">
        {options.length === 0 ? (
          <span className="text-sm text-muted-foreground">{placeholder || "No options"}</span>
        ) : (
          options.map((opt) => (
            <div key={opt.value} className="flex items-center mb-1">
              <input
                type="checkbox"
                value={opt.value}
                checked={value.includes(opt.value)}
                onChange={() => handleToggle(opt.value)}
                disabled={disabled}
                id={`${id}-${opt.value}`}
                className="mr-2"
              />
              <label htmlFor={`${id}-${opt.value}`} className="text-sm">{opt.label}</label>
            </div>
          ))
        )}
      </div>
      {value.length > 0 && (
        <div className="mt-1 text-xs text-muted-foreground">
          Selected: {options.filter(opt => value.includes(opt.value)).map(opt => opt.label).join(", ")}
        </div>
      )}
    </div>
  )
}

export default MultiSelect