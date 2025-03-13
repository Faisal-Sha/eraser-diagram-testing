import { AttributeName } from "@common/interfaces/attribute.interface";

const OPERATIONS_STRING = [{
  key: 'eq',
  label: 'panel.conditions.operations.eq'
}, {
  key: 'neq',
  label: 'panel.conditions.operations.neq'
}];

const OPERATIONS_NUMBER = [{
  key: 'eq',
  label: 'panel.conditions.operations.eq'
}, {
  key: 'neq',
  label: 'panel.conditions.operations.neq'
}, {
  key: 'gt',
  label: 'panel.conditions.operations.gt'
}, {
  key: 'gte',
  label: 'panel.conditions.operations.gte'
}, {
  key: 'lt',
  label: 'panel.conditions.operations.lt'
}, {
  key: 'lte',
  label: 'panel.conditions.operations.lte'
}];

export const CONDITION_CONFIG = [{
  key: 'quantity',
  label: 'panel.conditions.options.quantity',
  type: 'number',
  operations: OPERATIONS_NUMBER,
  source: 'key'
}, {
  key: 'typeId',
  label: 'panel.conditions.options.type-id',
  type: 'select',
  operations: OPERATIONS_STRING,
  values: [],
  source: 'key'
}, {
  key: 'material',
  label: 'panel.conditions.options.material',
  type: 'select',
  operations: OPERATIONS_STRING,
  source: 'key'
}, {
  key: AttributeName.WEIGHT,
  label: 'panel.conditions.options.weight',
  type: 'number',
  operations: OPERATIONS_NUMBER,
  source: 'attributes'
}, {
  key: 'dn1',
  label: 'panel.conditions.options.dn1',
  type: 'select',
  operations: OPERATIONS_NUMBER,
  source: 'key'
}, {
  key: 'dn2',
  label: 'panel.conditions.options.dn2',
  type: 'select',
  operations: OPERATIONS_NUMBER,
  source: 'key'
}, {
  key: 's1',
  label: 'panel.conditions.options.s1',
  type: 'number',
  operations: OPERATIONS_NUMBER,
  source: 'key'
}, {
  key: 's2',
  label: 'panel.conditions.options.s2',
  type: 'number',
  operations: OPERATIONS_NUMBER,
  source: 'key'
}];
