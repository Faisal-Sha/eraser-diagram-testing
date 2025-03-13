import { Component, OnInit } from '@angular/core';
import { ItemCategory } from '@common/entities/item/item.entity';
import { I18NEXT_SCOPE } from 'angular-i18next';
import { TreeNode } from 'primeng/api';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TreeModule } from 'primeng/tree';

export interface TargetSelectionConfig {
  filter: {
    contains: ItemCategory
  }
}

@Component({
    selector: 'app-control-actions-group-selection',
    templateUrl: './group-selection.component.html',
    styleUrls: ['./group-selection.component.scss'],
    providers: [{
      provide: I18NEXT_SCOPE,
      useValue: 'component.controls.actions.groupSelection'
    }],
    standalone: true,
    imports: [TreeModule]
})
export class GroupSelectionComponent implements OnInit {
  protected values: TreeNode[] | null = null;
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

  /**
   * Called when the component is initialized.
   *
   * Sets the values array to the targets array from the dialog configuration.
   */
  ngOnInit(): void {
    this.values = this.dialogConfig.data.targets;
  }

/**
 * Handles the submission of the dialog.
 *
 * Checks if a selection has been made. If no selection is made, returns false.
 * Otherwise, sets the selected data in the dialog configuration and returns true.
 *
 * @returns {boolean} Whether the submission was successful.
 */

  onSubmit(): boolean {
    if (!this.selected) {
      return false;
    }
  
    this.dialogConfig.data.selected = this.selected.data;
    return true;
  }
}
