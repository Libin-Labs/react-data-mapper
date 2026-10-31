import api = require('../dist/cjs/index.js');
const fields: api.MapperField[] = [{ path: 'name', type: 'string' }];
const props: api.DataMapperProps = {
  sourceFields: fields,
  destinationFields: [{ path: 'fullName', type: 'string' }],
  rules: [{ source: 'name', destination: 'fullName' }],
  onChange: () => undefined,
};
void [
  api.DataMapper,
  api.mapData,
  api.readDataPath,
  api.splitDataPath,
  api.validateMapping,
  api.writeDataPath,
  props,
];
