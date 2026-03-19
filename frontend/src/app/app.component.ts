import { Component, computed, effect, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

type ThemeId = 'original' | 'space' | 'neobrutalism';

interface ThemeOption {
  readonly id: ThemeId;
  readonly label: string;
  readonly caption: string;
}

const THEME_STORAGE_KEY = 'orbitlab-theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly themeOptions: ThemeOption[] = [
    { id: 'original', label: 'Original', caption: 'Atual' },
    { id: 'space', label: 'Space', caption: 'Orbital' },
    { id: 'neobrutalism', label: 'Neo', caption: 'Bold' },
  ];

  readonly selectedTheme = signal<ThemeId>(this.readStoredTheme());

  readonly selectedThemeIndex = computed(() =>
    this.themeOptions.findIndex((theme) => theme.id === this.selectedTheme()),
  );

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, this.selectedTheme());
      } catch {
        return;
      }
    });
  }

  setTheme(theme: ThemeId): void {
    this.selectedTheme.set(theme);
  }

  private readStoredTheme(): ThemeId {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

      if (
        storedTheme === 'original' ||
        storedTheme === 'space' ||
        storedTheme === 'neobrutalism'
      ) {
        return storedTheme;
      }
    } catch {
      return 'original';
    }

    return 'original';
  }
}
