import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Wifi, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Badge } from './ui/badge';
import type { GenerationSettings as GenerationSettingsType, Language, OutputFormat } from '../types';

interface GenerationSettingsProps {
  settings: GenerationSettingsType;
  onSettingsChange: (settings: GenerationSettingsType) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  fieldCount: number;
}

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'french', label: 'French' },
  { value: 'malagasy', label: 'Malagasy' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'german', label: 'German' },
  { value: 'japanese', label: 'Japanese' },
];

const FORMATS: { value: OutputFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'XLSX' },
];

export function GenerationSettingsPanel({ settings, onSettingsChange, onGenerate, isGenerating, fieldCount }: GenerationSettingsProps) {
  const [geminiStatus, setGeminiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setGeminiStatus(data.gemini_configured ? 'connected' : 'disconnected');
        } else {
          setGeminiStatus('disconnected');
        }
      } catch {
        setGeminiStatus('disconnected');
      }
    }
    checkHealth();
  }, []);

  const canGenerate = fieldCount > 0 && !isGenerating;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Generation Settings</h2>
        {geminiStatus === 'checking' && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" /> Checking...
          </Badge>
        )}
        {geminiStatus === 'connected' && (
          <Badge variant="default" className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600">
            <Wifi className="h-3 w-3" /> Gemini AI
          </Badge>
        )}
        {geminiStatus === 'disconnected' && (
          <Badge variant="outline" className="gap-1 text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
            <WifiOff className="h-3 w-3" /> Local Mode
          </Badge>
        )}
      </div>

      {geminiStatus === 'disconnected' && (
        <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          Set GEMINI_API_KEY in your .env file and restart the backend to enable AI generation. Currently using local fallback data.
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Language</Label>
          <Select value={settings.language} onValueChange={(v) => onSettingsChange({ ...settings, language: v as Language })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (<SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Number of Records</Label>
          <Input
            type="number"
            min={1}
            max={10000}
            value={settings.count}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= 10000) {
                onSettingsChange({ ...settings, count: val });
              }
            }}
            className="h-10"
          />
          <p className="text-xs text-muted-foreground">Min: 1, Max: 10,000</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Output Format</Label>
          <Select value={settings.format} onValueChange={(v) => onSettingsChange({ ...settings, format: v as OutputFormat })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FORMATS.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Generation Mode</Label>
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/50">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Generation</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {geminiStatus === 'connected' ? 'Gemini API' : 'Local Fallback'}
            </span>
          </div>
        </div>
      </div>

      <Button onClick={onGenerate} disabled={!canGenerate} className="w-full gap-2 h-11 text-sm font-semibold" size="lg">
        {isGenerating ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
        ) : (
          <><Sparkles className="h-4 w-4" />Generate Dataset</>
        )}
      </Button>

      {!canGenerate && fieldCount === 0 && (
        <p className="text-xs text-center text-amber-600 dark:text-amber-400">Add at least one field to generate data</p>
      )}
    </div>
  );
}
