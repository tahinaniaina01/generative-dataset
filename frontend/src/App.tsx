import { useState, useCallback } from 'react';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider, useToast } from './hooks/useToast';
import { Header } from './components/Header';
import { SchemaBuilder } from './components/SchemaBuilder';
import { InputEditor } from './components/InputEditor';
import { GenerationSettingsPanel } from './components/GenerationSettings';
import { ResultViewer } from './components/ResultViewer';
import { ToastContainer } from './components/ToastContainer';
import { generateDataset } from './lib/api';
import type { Field, GenerationSettings, InputTab } from './types';

function AppContent() {
  const [fields, setFields] = useState<Field[]>([]);
  const [, setJsonExample] = useState<Record<string, unknown>>({});
  const [inputTab, setInputTab] = useState<InputTab>('json');
  const [generatedData, setGeneratedData] = useState<Record<string, unknown>[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<GenerationSettings>({
    language: 'english',
    count: 100,
    format: 'json',
    mode: 'ai',
  });

  const { addToast } = useToast();

  const handleGenerate = useCallback(async () => {
    const validFields = fields.filter((f) => f.key.trim());
    if (validFields.length === 0) {
      addToast('error', 'Please add at least one field with a key');
      return;
    }

    setIsGenerating(true);
    try {
      const data = await generateDataset({
        language: settings.language,
        count: settings.count,
        format: settings.format,
        fields: validFields,
        mode: settings.mode,
      });
      setGeneratedData(data);
      addToast('success', `Generated ${settings.count} records successfully`);
    } catch (err) {
      addToast('error', 'Failed to generate dataset. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [fields, settings, addToast]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - 60% */}
        <div className="w-[60%] flex flex-col border-r border-border divide-y divide-border">
          <div className="flex-1 p-5 min-h-0 overflow-y-auto">
            <SchemaBuilder fields={fields} onFieldsChange={setFields} />
          </div>
          <div className="flex-1 p-5 min-h-0">
            <InputEditor
              fields={fields}
              onFieldsChange={setFields}
              onJsonChange={setJsonExample}
              activeTab={inputTab}
              onTabChange={setInputTab}
            />
          </div>
        </div>

        {/* Right Panel - 40% */}
        <div className="w-[40%] flex flex-col divide-y divide-border overflow-hidden">
          <div className="p-5">
            <GenerationSettingsPanel
              settings={settings}
              onSettingsChange={setSettings}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              fieldCount={fields.filter((f) => f.key.trim()).length}
            />
          </div>
          <div className="flex-1 p-5 min-h-0 overflow-y-auto">
            <ResultViewer data={generatedData} format={settings.format} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  );
}
