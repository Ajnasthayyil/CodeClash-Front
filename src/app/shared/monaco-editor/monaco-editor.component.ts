import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import loader from '@monaco-editor/loader';



@Component({
  selector: 'app-monaco-editor',
  template: `
    <div #editorContainer class="monaco-host"></div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .monaco-host { width: 100%; height: 100%; }
  `]
})
export class MonacoEditorComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('editorContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  @Input() value = '';
  @Input() language = 'python';
  @Output() valueChange = new EventEmitter<string>();

  private editor: any = null;
  private ignoreNextChange = false;

  /** Map CodeClash lang keys → Monaco language ids */
  private static langMap: Record<string, string> = {
    csharp: 'csharp',
    python: 'python',
    javascript: 'javascript',
    cpp: 'cpp',
    java: 'java',
    go: 'go',
    rust: 'rust',
    typescript: 'typescript',
  };

  ngOnInit(): void {
    this.initMonaco();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['language'] && this.editor) {
      const monaco = (window as any).monaco;
      if (monaco) {
        const monacoLang = MonacoEditorComponent.langMap[this.language] || this.language;
        monaco.editor.setModelLanguage(this.editor.getModel(), monacoLang);
      }
    }
    if (changes['value'] && this.editor) {
      const current = this.editor.getValue();
      if (current !== this.value) {
        this.ignoreNextChange = true;
        this.editor.setValue(this.value ?? '');
      }
    }
  }

  ngOnDestroy(): void {
    this.editor?.dispose();
  }

  private async initMonaco(): Promise<void> {
    loader.config({
      paths: { vs: '/assets/monaco/vs' }
    });

    const monaco = await loader.init();
    const monacoLang = MonacoEditorComponent.langMap[this.language] || this.language;

    // Define theme BEFORE creating the editor instance
    monaco.editor.defineTheme('codeclash-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // Keywords — blue
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'keyword.control', foreground: 'C586C0', fontStyle: 'bold' },
        // Types / classes — green/teal
        { token: 'type', foreground: '4EC9B0' },
        { token: 'entity.name.type', foreground: '4EC9B0' },
        { token: 'entity.name.class', foreground: '4EC9B0' },
        // Functions — yellow
        { token: 'entity.name.function', foreground: 'DCDCAA' },
        { token: 'support.function', foreground: 'DCDCAA' },
        // Strings — orange-brown
        { token: 'string', foreground: 'CE9178' },
        { token: 'string.quoted', foreground: 'CE9178' },
        // Numbers — light green
        { token: 'number', foreground: 'B5CEA8' },
        // Comments — gray-green italic
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        // Variables — light blue
        { token: 'variable', foreground: '9CDCFE' },
        // Parameters — light blue italic
        { token: 'variable.parameter', foreground: '9CDCFE', fontStyle: 'italic' },
        // Constants
        { token: 'constant', foreground: '4FC1FF' },
        // Decorators/annotations
        { token: 'tag', foreground: '4EC9B0' },
        // Operators
        { token: 'operator', foreground: 'D4D4D4' },
        // Punctuation
        { token: 'delimiter', foreground: 'D4D4D4' },
        // Built-ins (Python builtins, etc)
        { token: 'support.type', foreground: '4EC9B0' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#1f3451',
        'editorLineNumber.foreground': '#444d56',
        'editorLineNumber.activeForeground': '#f97316',
        'editorCursor.foreground': '#f97316',
        'editorWhitespace.foreground': '#2e3439',
        'editorIndentGuide.background': '#21262d',
        'editorIndentGuide.activeBackground': '#30363d',
        'editorBracketHighlight.foreground1': '#ffd700',
        'editorBracketHighlight.foreground2': '#da70d6',
        'editorBracketHighlight.foreground3': '#87ceeb',
        'editor.findMatchBackground': '#f9731640',
        'editor.findMatchHighlightBackground': '#f9731620',
        'scrollbarSlider.background': '#30363d80',
        'scrollbarSlider.hoverBackground': '#484f5880',
        'editorWidget.background': '#161b22',
        'editorWidget.border': '#30363d',
        'editorSuggestWidget.background': '#161b22',
        'editorSuggestWidget.border': '#30363d',
        'editorSuggestWidget.selectedBackground': '#1f3451',
      }
    });

    this.editor = monaco.editor.create(this.containerRef.nativeElement, {
      value: this.value ?? '',
      language: monacoLang,
      theme: 'codeclash-dark', // Use the custom theme here directly
      fontSize: 14,
      fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
      fontLigatures: true,
      lineHeight: 22,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
      wordWrap: 'off',
      renderLineHighlight: 'line',
      renderWhitespace: 'selection',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      padding: { top: 12, bottom: 12 },
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },
      suggest: {
        showKeywords: true,
        showSnippets: true,
      },
      quickSuggestions: true,
      acceptSuggestionOnEnter: 'on',
      formatOnPaste: false,
    });

    // Propagate changes to parent via two-way binding
    this.editor.onDidChangeModelContent(() => {
      if (this.ignoreNextChange) {
        this.ignoreNextChange = false;
        return;
      }
      const newVal = this.editor.getValue();
      this.valueChange.emit(newVal);
    });
  }
}
