import { Injectable } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { DialogTemplateFooterComponent } from '../../components/dialog-templates/footer/dialog-template-footer.component';
import { ItemService } from '../item/item.service';
import { ItemCategory, ItemEntity } from '@common/entities/item/item.entity';
import { ItemGroupEntity } from '@common/entities/item/items/group.entity';
import { GroupSelectionComponent } from 'src/app/components/controls/actions/group-selection/group-selection.component';
import { ItemTypeSelectionComponent } from 'src/app/components/controls/actions/item-type-selection/item-type-selection.component';
import { ITEM_CATEGORY_TO_ICON } from '@common/entities/item/resolvers/item.resolver';
import { TreeNode } from 'primeng/api';

interface ItemFilter {
  contains: ItemCategory;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  /**
   * Constructs an instance of GroupService.
   *
   * @param dialogService - Service used for handling dialog interactions.
   * @param itemService - Service used for managing item operations within groups.
   */

  constructor(
    private dialogService: DialogService,
    private itemService: ItemService
  ) { }

  /**
   * Adds a new item to the specified group.
   *
   * @param targetGroup - The group to which the new item will be added.
   * @returns A promise that resolves when the item is added successfully.
   */
  public async addItemToGroup(targetGroup: ItemGroupEntity): Promise<void> {
    const itemType = await this.selectItemType();
    if (itemType) {
      this.itemService.addItem({
        category: targetGroup.contains,
        typeId: "0"
      }, targetGroup);
    }
  }

  /**
   * Adds a new group type item to the selected group.
   *
   * @param targetContains - The category of the group to which the new item will be added.
   *
   * @returns A promise that resolves when the new group type item is added successfully.
   *          If no group is selected, the promise is rejected.
   */
  public async addGroupTypeGroup(): Promise<void> {
    const target = await this.selectGroup(ItemCategory.GROUP);
    if (target) {
      this.itemService.addItem<ItemGroupEntity>({
        name: 'Neue Gruppe',
        category: ItemCategory.GROUP,
        contains: ItemCategory.GROUP,
        typeId: "0",
        items: []
      }, target);
    }
  }

  /**
   * Adds a new group type item containing pipe fittings to the selected group.
   *
   * @param targetContains - The category of the group to which the new item will be added.
   *                        In this case, it should always be `ItemCategory.GROUP`.
   *
   * @returns A promise that resolves when the new group type item containing pipe fittings is added successfully.
   *          If no group is selected, the promise is rejected.
   */
  public async addGroupTypePipeFitting(): Promise<void> {
    const target = await this.selectGroup(ItemCategory.GROUP);
    if (target) {
      this.itemService.addItem<ItemGroupEntity>({
        name: 'Neue Rohrleitung',
        category: ItemCategory.GROUP,
        contains: ItemCategory.PIPEFITTING,
        typeId: "0",
        items: []
      }, target);
    }
  }

  /**
   * Adds a new group type item containing services to the selected group.
   *
   * @param targetContains - The category of the group to which the new item will be added.
   *                        In this case, it should always be `ItemCategory.GROUP`.
   *
   * @returns A promise that resolves when the new group type item containing services is added successfully.
   *          If no group is selected, the promise is rejected.
   */
  public async addGroupTypeService(): Promise<void> {
    const target = await this.selectGroup(ItemCategory.GROUP);
    if (target) {
      this.itemService.addItem<ItemGroupEntity>({
        name: 'Neue Dienstleistung',
        category: ItemCategory.GROUP,
        contains: ItemCategory.SERVICE,
        typeId: "0",
        items: []
      }, target);
    }
  }

  /**
   * Opens a dialog to select a group based on the specified category.
   *
   * @param targetContains - The category of the group to be selected.
   *
   * @returns A promise that resolves with the selected group entity.
   *          If no group is selected or only one group is available, the promise resolves with the group entity directly.
   *          If the user cancels the selection, the promise is rejected.
   */
  public async selectGroup(targetContains: ItemCategory): Promise<ItemEntity> {
    const targets = this.getTargets({ contains: targetContains });
    
    const flattenTargets = this.flattenNodeTree(targets);
    if (flattenTargets.length === 1) {
      return flattenTargets[0].data
    }

    return new Promise((resolve, reject) => {
      const dialogRef = this.dialogService.open(GroupSelectionComponent, {
        header: 'Auswahl',
        width: '50vw',
        templates: {
          footer: DialogTemplateFooterComponent
        },
        data: {
          buttons: {
            confirm: 'Auswählen',
            cancel: 'Abbrechen'
          },
          targets
        }
      });

      dialogRef.onClose.subscribe((result?: { confirmed: boolean; data: any }) => {
        if (result?.confirmed) {
          resolve(result.data.selected);
        } else {
          reject();
        }
      });
    });
  }

  /**
   * Opens a dialog to select an item type from a predefined list.
   *
   * @returns A promise that resolves with the selected item category.
   *          If the user confirms the selection, the promise resolves with the selected category.
   *          If the user cancels the selection, the promise is rejected.
   */
  public async selectItemType(): Promise<ItemCategory> {
    return new Promise((resolve, reject) => {
      const dialogRef = this.dialogService.open(ItemTypeSelectionComponent, {
        header: 'Auswahl',
        width: '50vw',
        templates: {
          footer: DialogTemplateFooterComponent
        },
        data: {
          buttons: {
            confirm: 'Auswählen',
            cancel: 'Abbrechen'
          }
        }
      });

      dialogRef.onClose.subscribe((result?: { confirmed: boolean; data: any }) => {
        if (result?.confirmed) {
          resolve(result.data.selected);
        } else {
          reject();
        }
      });
    });
  }

  /**
   * Retrieves a list of tree nodes representing the item groups based on the provided filter.
   *
   * @param filter - An optional filter object to specify the category of items to retrieve.
   *                 If not provided, all item groups will be retrieved.
   *
   * @returns An array of TreeNode objects representing the item groups.
   *          Each TreeNode object contains information about the group, such as its key, label, data,
   *          selection status, children (if any), and icon.
   *
   * @remarks The function retrieves the root group from the item service and then recursively
   *          builds the tree nodes based on the group's children and the provided filter.
   */
  private getTargets(filter?: ItemFilter): TreeNode[] {
    const { contains } = filter?.contains ? filter : { contains: null };

    const rootGroup = this.itemService.rootGroup;
    if (!rootGroup) {
      return [];
    }

    const targets: TreeNode[] = [];
    targets.push({
      key: `root`,
      label: rootGroup.name,
      data: rootGroup,
      expanded: true,
      selectable: contains ? rootGroup.contains === contains : true,
      children: this.getChildTargets(rootGroup, 0, filter),
      icon: ITEM_CATEGORY_TO_ICON[rootGroup.contains]
    });
    return targets;
  }

  /**
   * Retrieves a list of tree nodes representing the child groups of the provided group based on the provided filter.
   *
   * @param group - The parent group for which to retrieve child groups.
   * @param level - The current level of recursion. Used to generate unique keys for each tree node.
   * @param filter - An optional filter object to specify the category of items to retrieve.
   *                 If not provided, all child groups will be retrieved.
   *
   * @returns An array of TreeNode objects representing the child groups of the provided group.
   *          Each TreeNode object contains information about the group, such as its key, label, data,
   *          selection status, children (if any), and icon.
   *
   * @remarks The function filters the child items of the provided group to only include groups.
   *          It then recursively builds the tree nodes based on the filtered child groups and the provided filter.
   *          The function only includes a tree node in the result if it is selectable (based on the filter)
   *          or if it has children.
   */
  private getChildTargets(group: ItemGroupEntity, level: number, filter?: ItemFilter): TreeNode[] {
    const targets: TreeNode[] = [];
    const { contains } = filter?.contains ? filter : { contains: null };

    const groupChildItems = group.items.filter(i => i instanceof ItemGroupEntity) as ItemGroupEntity[];

    for (const item of groupChildItems) {
      const result = {
        key: `${level}-group-${item.id}`,
        label: item.name,
        data: item,
        expanded: true,
        selectable: contains ? item.contains === contains : true,
        children: this.getChildTargets(item as ItemGroupEntity, level + 1, filter),
        icon: ITEM_CATEGORY_TO_ICON[item.contains]
      };

      if (result.selectable || result.children.length > 0) {
        targets.push(result);
      }
    }
  
    return targets;
  }

  /**
   * Flattens a hierarchical tree of TreeNode objects into a single-level array.
   *
   * @param nodes - The root TreeNode objects to flatten.
   *
   * @returns A single-level array of TreeNode objects, where each node represents a leaf node in the original tree.
   *
   * @remarks This function is used to simplify the manipulation of TreeNode objects in the context of tree-like data structures.
   *          It recursively traverses the tree, adding each node to the flattenedNodes array.
   *          If a node has children, the function calls itself recursively to flatten those children as well.
   */
  private flattenNodeTree(nodes: TreeNode[]): TreeNode[] {
    const flattenedNodes: TreeNode[] = [];
    for (const node of nodes) {
      flattenedNodes.push(node);
      if (node.children) {
        flattenedNodes.push(...this.flattenNodeTree(node.children));
      }
    }
    return flattenedNodes;
  }
}
