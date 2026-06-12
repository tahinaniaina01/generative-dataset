import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { Field } from '../types';

interface SchemaBuilderProps {
  fields: Field[];
  onFieldsChange: (fields: Field[]) => void;
}

export function SchemaBuilder({ fields, onFieldsChange }: SchemaBuilderProps) {
  const addField = () => {
    onFieldsChange([...fields, { key: '', description: '' }]);
  };

  const removeField = (index: number) => {
    onFieldsChange(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<Field>) => {
    onFieldsChange(fields.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Schema Builder</h2>
        <Button onClick={addField} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Field
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 py-12">
            <div className="rounded-full bg-muted p-3">
              <Plus className="h-5 w-5" />
            </div>
            <p className="text-sm">No fields defined yet</p>
            <p className="text-xs text-muted-foreground/60">Add fields manually or paste a JSON/CSV example below</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[24px_1fr_1fr_32px] gap-2 px-1">
              <div />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Key</span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</span>
              <div />
            </div>

            {fields.map((field, index) => (
              <div key={index} className="grid grid-cols-[24px_1fr_1fr_32px] gap-2 items-center group animate-fade-in">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
                <Input
                  value={field.key}
                  onChange={(e) => updateField(index, { key: e.target.value })}
                  placeholder="field_name"
                  className="h-9 text-sm font-mono"
                />
                <Input
                  value={field.description}
                  onChange={(e) => updateField(index, { description: e.target.value })}
                  placeholder="Optional description"
                  className="h-9 text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(index)}
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {fields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {fields.length} field{fields.length !== 1 ? 's' : ''} defined
            {fields.filter((f) => !f.key).length > 0 && (
              <span className="text-amber-600 dark:text-amber-400 ml-2">
                ({fields.filter((f) => !f.key).length} empty key{fields.filter((f) => !f.key).length !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
