import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewChecked, HostListener
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ChatbotService, ChatMessageDto } from '../../core/services/chatbot.service';

@Component({
  selector: 'app-chatbot-widget',
  templateUrl: './chatbot-widget.component.html',
  styleUrls: ['./chatbot-widget.component.scss']
})
export class ChatbotWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;
  @ViewChild('inputRef') private inputRef!: ElementRef;

  isOpen        = false;
  isMinimized   = false;
  isLoading     = false;
  inputText     = '';
  sessionId     : string | null = null;
  messages      : ChatMessageDto[] = [];
  isAuthenticated = false;

  private shouldScroll = false;

  constructor(
    private auth: AuthService,
    private chatbot: ChatbotService
  ) {}

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.isAuthenticated = this.auth.isLoggedIn && !!this.auth.getCurrentUser();

    if (this.isAuthenticated) {
      const saved = localStorage.getItem('cc_chat_session');
      if (saved) {
        this.sessionId = saved;
        this.loadHistory();
      }
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {}

  // ── Toggle ───────────────────────────────────────────────────────────────────
  toggle(): void {
    if (!this.isAuthenticated) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.shouldScroll = true;
      setTimeout(() => this.inputRef?.nativeElement?.focus(), 100);
    }
  }

  // ── Send message ─────────────────────────────────────────────────────────────
  send(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading) return;

    this.inputText = '';

    const userMsg: ChatMessageDto = { role: 'user', content: text };
    this.messages.push(userMsg);
    this.isLoading = true;
    this.shouldScroll = true;

    this.chatbot.sendMessage({
      message: text,
      sessionId: this.sessionId ?? undefined
    }).subscribe({
      next: res => {
        this.isLoading = false;
        if (!this.sessionId && res.sessionId) {
          this.sessionId = res.sessionId;
          localStorage.setItem('cc_chat_session', this.sessionId);
        }
        this.messages.push({
          role: 'assistant',
          content: res.reply,
          sourcesUsed: res.sourcesUsed
        });
        this.shouldScroll = true;
      },
      error: () => {
        this.isLoading = false;
        this.messages.push({
          role: 'assistant',
          content: 'Sorry, I ran into an error. Please try again.'
        });
        this.shouldScroll = true;
      }
    });
  }

  onEnter(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  clearSession(): void {
    this.messages = [];
    this.sessionId = null;
    localStorage.removeItem('cc_chat_session');
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  private loadHistory(): void {
    if (!this.sessionId) return;
    this.chatbot.getHistory(this.sessionId).subscribe({
      next: msgs => {
        this.messages = msgs ?? [];
        this.shouldScroll = true;
      },
      error: () => {} // silently ignore — stale session
    });
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  /** Convert simple markdown to safe HTML for display. */
  renderMarkdown(text: string): string {
    if (!text) return '';
    return text
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  @HostListener('keydown.escape')
  onEsc(): void {
    if (this.isOpen) this.isOpen = false;
  }
}
