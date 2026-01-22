import { Component, Inject, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskFormComponent } from '../../components/task-form/task-form';
import { Task } from '../../models/task';
import { TasksService } from '../../services/tasks';

@Component({
  selector: 'edit-task',
  standalone: true,
  imports: [MatDialogModule, TaskFormComponent],
  templateUrl: './edit-task.html',
  styleUrls: ['./edit-task.scss']
})

export class EditTaskDialog {

  @ViewChild(TaskFormComponent) taskForm!: TaskFormComponent;

  formValid: boolean = false;
  
  constructor(
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditTaskDialog>,
    private tasksService: TasksService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { row: Task }
  ) {}

  onAdd(): void {
    if (this.taskForm.form.valid) {

      const raw = this.taskForm.form.value;
      const newTask = {
        ...raw,
        start_date : new Date(raw.start_date).getTime(),
        end_date: raw.end_date ? raw.end_date.getTime() : null
      };

      this.tasksService.addTask(newTask).subscribe({
        next: () => {
          this.tasksService.notifyReload();
          this.snackBar.open('Task added', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('ADD TASK ERROR:', err);
          this.snackBar.open('Error adding task', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      });
    }
  }

 onModify(): void {
    if (this.taskForm.form.valid && this.data.row) {

      const raw = this.taskForm.form.value;

      const updatedTask = {
        ...raw,
        id: this.data.row.id,
        start_date : new Date(raw.start_date).getTime(),
        end_date: raw.end_date ? raw.end_date.getTime() : null
      };

      this.tasksService.updateTask(this.data.row.id, updatedTask).subscribe({
        next: () => {
          this.tasksService.notifyReload();
          this.snackBar.open('Task modified', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open('Error modifying task', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      });
    }
  }

  onDelete(): void {
    if (this.data.row) {
      this.tasksService.deleteTask(this.data.row.id).subscribe({
        next: () => {
          this.tasksService.notifyReload();
          this.snackBar.open('Task deleted', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open('Error deleting task', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      });
    }
  }

  onFormValidChange(valid: boolean) {
    console.log('PADRE RECIBE VALIDEZ:', valid); // <--- Para ver si llega
    this.formValid = valid;
    this.cdr.detectChanges(); 
  }
}
