import {
  DataMapper,
  mapData,
  readDataPath,
  splitDataPath,
  validateMapping,
  writeDataPath,
  type DataMapperProps,
  type MapperField,
  type MappingRule,
} from '../dist/esm/index.js';
const fields: MapperField[] = [{ path: 'name', type: 'string' }];
const rules: MappingRule[] = [{ source: 'name', destination: 'fullName' }];
const props: DataMapperProps = {
  sourceFields: fields,
  destinationFields: [{ path: 'fullName', type: 'string' }],
  rules,
  onChange: () => undefined,
};
void [DataMapper, mapData, readDataPath, splitDataPath, validateMapping, writeDataPath, props];
