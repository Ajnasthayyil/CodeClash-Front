import { Component, OnInit } from '@angular/core';
import { NotificationService, Toast } from '../notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {
  toasts$: Observable<Toast[]>;

  constructor(private notificationService: NotificationService) {
    this.toasts$ = this.notificationService.toasts$;
  }

  ngOnInit(): void {}

  closeToast(id: string): void {
    this.notificationService.removeToast(id);
  }
}
