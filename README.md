# @lp-labs/react-data-mapper

Declarative typed-field mapping, explicit safe transforms, path helpers, and a controlled React mapping-row editor. There is no expression evaluator or runtime code execution.

## Example

```tsx
import { DataMapper, mapData, type MappingRule } from "@lp-labs/react-data-mapper";
import "@lp-labs/react-data-mapper/styles.css";

const rules: MappingRule[] = [
  { source: "person.name", destination: "profile.displayName", transforms: ["trim", "uppercase"] },
  { source: "amount", destination: "invoice.total", transforms: ["toNumber"] },
];
const output = mapData({ person: { name: " Ada " }, amount: "12.5" }, rules);
function Editor() {
  const [current, setCurrent] = React.useState(rules);
  return <DataMapper sourceFields={[{ path: "person.name", type: "string" }]}
    destinationFields={[{ path: "profile.displayName", type: "string" }]} rules={current} onChange={setCurrent} />;
}
```

## React API and data types

`DataMapperProps`: required readonly `sourceFields` and `destinationFields`, each `MapperField[]`; required readonly `rules: MappingRule[]`; required `onChange(rules)`; optional `className` (defaults to `lp-data-mapper`). `MapperField` has `path`, optional `label`, `type` (`string | number | boolean | date | unknown`), and optional `required`. The editor shows source/destination selectors for each rule; remove and add buttons update `onChange`. New rules connect the first source and destination, if available. The component shows field-path validation issues. `MappingRule` has `source`, `destination`, optional ordered `transforms`, and optional `enabled` (defaults true). `MapperIssue` is `{rule: number, message: string}`. `MappingResult<T>` is `{value: T, issues: MapperIssue[]}`.

## Helpers

- `splitDataPath(path: string): string[]` parses dot-separated safe path segments. Empty segments and `__proto__`, `prototype`, or `constructor` throw `Error`.
- `readDataPath(data: unknown, path: string): unknown` safely reads own properties; missing members return `undefined`.
- `writeDataPath(data: Record<string, unknown>, path: string, value: unknown): Record<string, unknown>` clones the object and writes a nested destination. Rejects unsafe paths and scalar/array conflicts. Does not mutate input.
- `Transform` is `trim | lowercase | uppercase | toNumber | toBoolean | toIsoDate`. Transforms run in listed order. String transforms require a string. `toNumber` accepts string/number and rejects nonfinite results. `toBoolean` accepts booleans and exact `true`, `false`, `1`, `0` strings/numbers. `toIsoDate` accepts string, timestamp number, or `Date` and returns ISO text; invalid dates fail.
- `mapData<T extends Record<string, unknown>>(source: unknown, rules: readonly MappingRule[]): MappingResult<T>` starts with an empty target, skips disabled rules, reads and transforms in sequence, then writes destinations. Mapping failures are collected in `issues` and later rules continue; `value` contains only successful writes. Duplicate destination paths are overwritten in rule order.
- `validateMapping(sourceFields, destinationFields, rules): MapperIssue[]` checks safe paths and exact source/destination field membership. It does not check data-level requiredness, types, or whether the chosen transforms are compatible.
- `DataMapper`, `DataMapperProps`, `MapperField`, `DataType`, `MappingRule`, `Transform`, `MapperIssue`, and `MappingResult` are the full component/data API.

## Limits and accessibility

Paths are dot notation only; escaping dots and arrays are not supported. Metadata field `type` is descriptive and is not enforced by `mapData`. No implicit casts, arbitrary functions, eval, template language, async operations, or streaming is supported. Add custom transforms outside the package by transforming input data before calling `mapData`. Selects and buttons use native accessible controls. React is the sole runtime peer; ESM/CJS declarations are included.

## License

[MIT](./LICENSE).

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
