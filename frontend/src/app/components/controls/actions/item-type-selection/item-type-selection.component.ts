import { Component } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TreeModule } from 'primeng/tree';

@Component({
    selector: 'app-control-actions-item-type-selection',
    templateUrl: './item-type-selection.component.html',
    styleUrls: ['./item-type-selection.component.scss'],
    standalone: true,
    imports: [TreeModule]
})
export class ItemTypeSelectionComponent {
  protected values: TreeNode[] = [
    
  ];
  protected selected: TreeNode | null = null;

  /**
   * The constructor.
   *
   * This constructor binds the onSubmit function of this class to the onSubmit function of the dialogConfig.
   * This allows the dialog to call the onSubmit function of this class when the user clicks the confirmation button.
   *
   * @param dialogConfig The dialogConfig which contains the onSubmit function which this class binds to.
   */
  constructor(
    private dialogConfig: DynamicDialogConfig
  ) {
    this.dialogConfig.data.onSubmit = this.onSubmit.bind(this);
  }

  ngOnInit(): void {
    
  }

  /**
   * Called when the user clicks the confirmation button of the dialog.
   *
   * The function must return a boolean indicating whether the submission was successful.
   * If the function returns false, the dialog will not close.
   *
   * @returns {boolean} Whether the submission was successful.
   */
  onSubmit(): boolean {
    return true;
  }
}
