import { Moon, Sun, Database } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../hooks/useTheme';

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary p-1.5 shadow-sm">
          <Database className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground leading-tight">AI Dataset Generator</h1>
          <p className="text-[10px] text-muted-foreground">Generate synthetic datasets with AI</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </header>
  );
}
