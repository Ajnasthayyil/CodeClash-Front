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

<<<<<<< HEAD
  isOpen          = false;
  isLoading       = false;
  inputText       = '';
  sessionId       : string | null = null;
  messages        : ChatMessageDto[] = [];
=======
  isOpen        = false;
  isMinimized   = false;
  isLoading     = false;
  inputText     = '';
  sessionId     : string | null = null;
  messages      : ChatMessageDto[] = [];
>>>>>>> f9b4ae88e814bd25d5e3f7967dd3301b530d085d
  isAuthenticated = false;

  private shouldScroll = false;

  constructor(
    private auth: AuthService,
    private chatbot: ChatbotService
  ) {}

<<<<<<< HEAD
  ngOnInit(): void {
    this.isAuthenticated = this.auth.isLoggedIn && !!this.auth.getCurrentUser();
=======
  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.isAuthenticated = this.auth.isLoggedIn && !!this.auth.getCurrentUser();

>>>>>>> f9b4ae88e814bd25d5e3f7967dd3301b530d085d
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

<<<<<<< HEAD
=======
  // ── Toggle ───────────────────────────────────────────────────────────────────
>>>>>>> f9b4ae88e814bd25d5e3f7967dd3301b530d085d
  toggle(): void {
    if (!this.isAuthenticated) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.shouldScroll = true;
      setTimeout(() => this.inputRef?.nativeElement?.focus(), 100);
    }
  }

<<<<<<< HEAD
  send(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading) return;
    this.inputText = '';
    this.messages.push({ role: 'user', content: text });
    this.isLoading = true;
    this.shouldScroll = true;

    this.chatbot.sendMessage({ message: text, sessionId: this.sessionId ?? undefined }).subscribe({
=======
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
>>>>>>> f9b4ae88e814bd25d5e3f7967dd3301b530d085d
      next: res => {
        this.isLoading = false;
        if (!this.sessionId && res.sessionId) {
          this.sessionId = res.sessionId;
          localStorage.setItem('cc_chat_session', this.sessionId);
        }
<<<<<<< HEAD
        this.messages.push({ role: 'assistant', content: res.reply, sourcesUsed: res.sourcesUsed });
=======
        this.messages.push({
          role: 'assistant',
          content: res.reply,
          sourcesUsed: res.sourcesUsed
        });
>>>>>>> f9b4ae88e814bd25d5e3f7967dd3301b530d085d
        this.shouldScroll = true;
      },
      error: () => {
        this.isLoading = false;
<<<<<<< HEAD
        this.messages.push({ role: 'assistant', content: 'Sorry, I ran into an error. Please try again.' });
=======
        this.messages.push({
          role: 'assistant',
          content: 'Sorry, I ran into an error. Please try again.'
        });
>>>>>>> f9b4ae88e814bd25d5e3f7967dd3301b530d085d
        this.shouldScroll = true;
      }
    });
  }

  onEnter(e: KeyboardEvent): void {
<<<<<<< HEAD
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
=======
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
>>>>>>> f9b4ae88e814bd25d5e3f7967dd3301b530d085d
  }

  clearSession(): void {
    this.messages = [];
    this.sessionId = null;
    localStorage.removeItem('cc_chat_session');
  }

<<<<<<< HEAD
  private loadHistory(): void {
    if (!this.sessionId) return;
    this.chatbot.getHistory(this.sessionId).subscribe({
      next: msgs => { this.messages = msgs ?? []; this.shouldScroll = true; },
      error: () => {}
=======
  // ── Helpers ──────────────────────────────────────────────────────────────────
  private loadHistory(): void {
    if (!this.sessionId) return;
    this.chatbot.getHistory(this.sessionId).subscribe({
      next: msgs => {
        this.messages = msgs ?? [];
        this.shouldScroll = true;
      },
      error: () => {} // silently ignore — stale session
>>>>>>> f9b4ae88e814bd25d5e3f7967dd3301b530d085d
    });
  }

  private scrollToBottom(): void {
<<<<<<< HEAD
    try { this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' }); } catch {}
  }

=======
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  /** Convert simple markdown to safe HTML for display. */
>>>>>>> f9b4ae88e814bd25d5e3f7967dd3301b530d085d
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
<<<<<<< HEAD
  onEsc(): void { if (this.isOpen) this.isOpen = false; }
=======
  onEsc(): void {
    if (this.isOpen) this.isOpen = false;
  }
>>>>>>> f9b4ae88e814bd25d5e3f7967dd3301b530d085d
}
