import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ─── User ────────────────────────────────────────────────────────────────
  user = {
    initials: 'NC',
    name: 'NovaCoder',
    email: 'nova.coder@codeclash.com',
    phoneNumber: '',
    profileImageUrl: '',
    joined: 'Jan 2025',
    handle: 'novacoder',
    role: 'User'
  };

  isEditModalOpen = false;
  isDropdownOpen = false;
  isConfirmDeleteModalOpen = false;
  editUser = { name: '', username: '', phoneNumber: '' };
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      this.user.name = parsed.name || this.user.name;
      this.user.email = parsed.email || this.user.email;
      this.user.phoneNumber = parsed.phoneNumber || '';
      this.user.handle = parsed.username || this.user.handle;
      this.user.profileImageUrl = parsed.profileImageUrl || '';
      this.user.role = parsed.role || 'User';
      this.user.joined = parsed.joined || this.user.joined;
      if (parsed.initials) {
        this.user.initials = parsed.initials;
      } else {
        this.updateInitials();
      }
    }

    // Load fresh data from the server
    this.authService.getProfile().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const profile = res.data;
          this.user.name = profile.fullName || this.user.name;
          this.user.email = profile.email || this.user.email;
          this.user.phoneNumber = profile.phoneNumber || '';
          this.user.handle = profile.username || this.user.handle;
          this.user.profileImageUrl = profile.profileImageUrl || '';
          
          if (profile.createdAt) {
            const joinedDate = new Date(profile.createdAt);
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            this.user.joined = `${monthNames[joinedDate.getMonth()]} ${joinedDate.getFullYear()}`;
          }

          this.updateInitials();

          // Sync back to localStorage
          const existing = savedUser ? JSON.parse(savedUser) : {};
          const updatedUser = {
            ...existing,
            name: this.user.name,
            email: this.user.email,
            phoneNumber: this.user.phoneNumber,
            username: this.user.handle,
            initials: this.user.initials,
            profileImageUrl: this.user.profileImageUrl,
            joined: this.user.joined,
            role: this.user.role
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      },
      error: (err) => {
        console.error('Failed to load profile from server:', err);
      }
    });
  }

  private updateInitials(): void {
    const parts = this.user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      this.user.initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      this.user.initials = parts[0][0].toUpperCase();
    } else {
      this.user.initials = 'NC';
    }
  }

  // ─── Edit Modal ──────────────────────────────────────────────────────────
  openEditModal(): void {
    this.editUser = {
      name: this.user.name,
      username: this.user.handle,
      phoneNumber: this.user.phoneNumber
    };
    this.isEditModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
  }

  saveProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      fullName: this.editUser.name,
      phoneNumber: this.editUser.phoneNumber,
      username: this.editUser.username
    };

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success) {
          this.user.name = this.editUser.name;
          this.user.handle = this.editUser.username;
          this.user.phoneNumber = this.editUser.phoneNumber;
          this.updateInitials();

          // Sync back to localStorage
          const savedUser = localStorage.getItem('currentUser');
          const existing = savedUser ? JSON.parse(savedUser) : {};
          const updatedUser = {
            ...existing,
            name: this.user.name,
            phoneNumber: this.user.phoneNumber,
            username: this.user.handle,
            initials: this.user.initials
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));

          this.successMessage = 'Profile updated successfully!';
          setTimeout(() => {
            this.successMessage = '';
            this.closeEditModal();
          }, 1500);
        } else {
          this.errorMessage = res.message || 'Failed to update profile.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && err.error.errors && err.error.errors.length > 0) {
          this.errorMessage = err.error.errors.join(' ');
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'An error occurred while updating the profile.';
        }
      }
    });
  }

  // ─── Cloudinary Picture Upload ───────────────────────────────────────────
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.isLoading = true;
      this.authService.uploadProfileImage(file).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res && res.success && res.data) {
            const newUrl = res.data;
            this.user.profileImageUrl = newUrl;
            
            // Sync to localStorage
            const savedUser = localStorage.getItem('currentUser');
            const existing = savedUser ? JSON.parse(savedUser) : {};
            const updatedUser = {
              ...existing,
              profileImageUrl: newUrl
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            this.successMessage = 'Profile picture updated successfully!';
            this.errorMessage = '';
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          } else {
            this.errorMessage = res.message || 'Failed to upload profile picture.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('File upload error:', err);
          this.errorMessage = 'An error occurred while uploading the file.';
        }
      });
    }
  }

  // ─── Dropdown & Account Deletion ─────────────────────────────────────────
  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click')
  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  openConfirmDeleteModal(): void {
    this.isDropdownOpen = false;
    this.isConfirmDeleteModalOpen = true;
  }

  closeConfirmDeleteModal(): void {
    this.isConfirmDeleteModalOpen = false;
  }

  deleteAccount(): void {
    this.isLoading = true;
    this.authService.deleteAccount().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success) {
          this.authService.clearSession();
          this.closeConfirmDeleteModal();
          window.location.href = '/';
        } else {
          this.errorMessage = res.message || 'Failed to delete account.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Account deletion error:', err);
        this.errorMessage = 'An error occurred while deleting your account.';
      }
    });
  }
}
