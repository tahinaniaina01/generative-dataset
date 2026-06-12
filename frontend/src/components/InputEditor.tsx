import { useState, useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { useTheme } from '../hooks/useTheme';
import type { Field, InputTab } from '../types';
import { extractSchema, generateExample } from '../lib/api';

interface InputEditorProps {
  fields: Field[];
  onFieldsChange: (fields: Field[]) => void;
  onJsonChange: (json: Record<string, unknown>) => void;
  activeTab: InputTab;
  onTabChange: (tab: InputTab) => void;
}

export function InputEditor({ fields, onFieldsChange, onJsonChange, activeTab, onTabChange }: InputEditorProps) {
  const { theme } = useTheme();
  const [jsonText, setJsonText] = useState('');
  const [csvText, setCsvText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const isUpdatingFromFields = useRef(false);
  const isUpdatingFromEditor = useRef(false);

  useEffect(() => {
    if (isUpdatingFromEditor.current) {
      isUpdatingFromEditor.current = false;
      return;
    }

    const updateJsonFromFields = async () => {
      isUpdatingFromFields.current = true;
      const validFields = fields.filter((f) => f.key.trim());
      if (validFields.length === 0) {
        setJsonText('{\n  \n}');
        onJsonChange({});
        return;
      }
      const example = await generateExample(validFields);
      const formatted = JSON.stringify(example, null, 2);
      setJsonText(formatted);
      onJsonChange(example);
    };

    updateJsonFromFields();
  }, [fields, onJsonChange]);

  const handleJsonChange = useCallback(
    async (value: string | undefined) => {
      const text = value ?? '';
      setJsonText(text);

      try {
        const parsed = JSON.parse(text);
        setJsonError('');
        isUpdatingFromEditor.current = true;
        onJsonChange(parsed);

        const result = await extractSchema({ json_example: parsed });
        const newFields = result.fields;
        const currentKeys = fields.filter((f) => f.key).map((f) => f.key);
        const newKeys = newFields.map((f) => f.key);
        if (JSON.stringify(currentKeys) !== JSON.stringify(newKeys)) {
          onFieldsChange(newFields);
        }
      } catch {
        if (text.trim()) {
          setJsonError('Invalid JSON syntax');
        } else {
          setJsonError('');
        }
      }
    },
    [fields, onFieldsChange, onJsonChange]
  );

  const handleCsvChange = useCallback(
    async (text: string) => {
      setCsvText(text);
      if (text.trim()) {
        const result = await extractSchema({ csv_example: text });
        onFieldsChange(result.fields);

        if (result.fields.length > 0) {
          const example = await generateExample(result.fields);
          setJsonText(JSON.stringify(example, null, 2));
          onJsonChange(example);
        }
      }
    },
    [onFieldsChange, onJsonChange]
  );

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Input Editor</h2>

      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as InputTab)} className="flex flex-col flex-1">
        <TabsList className="w-fit">
          <TabsTrigger value="json" className="text-xs">JSON Example</TabsTrigger>
          <TabsTrigger value="csv" className="text-xs">CSV Example</TabsTrigger>
        </TabsList>

        <TabsContent value="json" className="flex-1 mt-3 min-h-0">
          <div className="relative h-full rounded-md border border-border overflow-hidden">
            <Editor
              height="100%"
              language="json"
              value={jsonText}
              onChange={handleJsonChange}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                padding: { top: 8 },
                renderLineHighlight: 'line',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                bracketPairColorization: { enabled: true },
              }}
            />
            {jsonError && (
              <div className="absolute bottom-2 left-2 right-2 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs text-red-600 dark:text-red-400">
                {jsonError}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="csv" className="flex-1 mt-3 min-h-0">
          <Textarea
            value={csvText}
            onChange={(e) => handleCsvChange(e.target.value)}
            placeholder={'name,firstname,age\nJohn,Doe,30\nJane,Smith,25'}
            className="h-full resize-none font-mono text-sm"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
