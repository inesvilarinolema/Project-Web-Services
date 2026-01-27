import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../services/auth';
import { User } from '../../models/user';

@Component({
	selector: 'login',
	standalone: true,
	imports: [ MatDialogModule, MatInputModule, ReactiveFormsModule ],
	templateUrl: './login.html',
	styleUrls: ['./login.scss']
})


export class LoginDialog {
		form: FormGroup;
		formValid: boolean = false;

		constructor(
				private snackBar: MatSnackBar,
				private dialogRef: MatDialogRef<LoginDialog>,
				private authService: AuthService,
				private fb: FormBuilder
		) {
			this.form = this.fb.group({
				username: ['', Validators.required],
				password: ['', Validators.required]
			});
		}

		//Handles the login submission
		onLogin(): void {
			if (this.form.valid) {
				//Construct user object from form values
				const user: User = { 
					username: this.form.get('username')?.value, 
					password: this.form.get('password')?.value 
				};  

				this.authService.login(user).subscribe({
					next: () => {
						//Success
						this.snackBar.open('Login successful', 'Close', { 
							duration: 5000,
							panelClass: ['snackbar-success']
						});
						//Allows the parent component to know the login happened
						this.dialogRef.close('success');
					},
					error: (err) => {
						//Error
						this.snackBar.open('Login failed', 'Close', {
							duration: 5000,
							panelClass: ['snackbar-error']
						});
					}
				});
			}
		}
}