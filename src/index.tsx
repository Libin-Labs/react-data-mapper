import * as React from 'react';

export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'unknown';
export type Transform = 'trim' | 'lowercase' | 'uppercase' | 'toNumber' | 'toBoolean' | 'toIsoDate';
export interface MapperField {
  path: string;
  label?: string;
  type: DataType;
  required?: boolean;
}
export interface MappingRule {
  source: string;
  destination: string;
  transforms?: readonly Transform[];
  enabled?: boolean;
}
export interface MapperIssue {
  rule: number;
  message: string;
}
export interface MappingResult<T = Record<string, unknown>> {
  value: T;
  issues: MapperIssue[];
}
const unsafe = new Set(['__proto__', 'prototype', 'constructor']);
export function splitDataPath(path: string): string[] {
  const parts = path.split('.');
  if (!path || parts.some((part) => !part || unsafe.has(part)))
    throw new Error(`Unsafe or empty data path: ${path}`);
  return parts;
}
export function readDataPath(data: unknown, path: string): unknown {
  let current = data;
  for (const part of splitDataPath(path)) {
    if (
      !current ||
      typeof current !== 'object' ||
      !Object.prototype.hasOwnProperty.call(current, part)
    )
      return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
export function writeDataPath(
  data: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const output = structuredClone(data);
  const parts = splitDataPath(path);
  let current = output;
  for (const part of parts.slice(0, -1)) {
    if (current[part] === undefined) current[part] = Object.create(null) as Record<string, unknown>;
    if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part]))
      throw new Error(`Destination path conflicts at ${part}.`);
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
  return output;
}
function applyTransform(value: unknown, transform: Transform): unknown {
  if (transform === 'trim' || transform === 'lowercase' || transform === 'uppercase') {
    if (typeof value !== 'string') throw new Error(`${transform} requires a string.`);
    return transform === 'trim'
      ? value.trim()
      : transform === 'lowercase'
        ? value.toLowerCase()
        : value.toUpperCase();
  }
  if (transform === 'toNumber') {
    if (typeof value !== 'string' && typeof value !== 'number')
      throw new Error('toNumber requires a string or number.');
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error('Value cannot be converted to a finite number.');
    return number;
  }
  if (transform === 'toBoolean') {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1' || value === 1) return true;
    if (value === 'false' || value === '0' || value === 0) return false;
    throw new Error('toBoolean accepts only true, false, 1, or 0.');
  }
  if (transform === 'toIsoDate') {
    if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date))
      throw new Error('toIsoDate requires a date string, timestamp, or Date.');
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) throw new Error('Value is not a valid date.');
    return date.toISOString();
  }
  const exhaustive: never = transform;
  throw new Error(`Unsupported transform: ${String(exhaustive)}`);
}
export function mapData<T extends Record<string, unknown> = Record<string, unknown>>(
  source: unknown,
  rules: readonly MappingRule[],
): MappingResult<T> {
  let output: Record<string, unknown> = {};
  const issues: MapperIssue[] = [];
  rules.forEach((rule, index) => {
    if (rule.enabled === false) return;
    try {
      let value = readDataPath(source, rule.source);
      if (value === undefined) throw new Error(`Source field is missing: ${rule.source}`);
      for (const transform of rule.transforms ?? []) value = applyTransform(value, transform);
      output = writeDataPath(output, rule.destination, value);
    } catch (error) {
      issues.push({
        rule: index,
        message: error instanceof Error ? error.message : 'Mapping failed.',
      });
    }
  });
  return { value: output as T, issues };
}
export function validateMapping(
  sourceFields: readonly MapperField[],
  destinationFields: readonly MapperField[],
  rules: readonly MappingRule[],
): MapperIssue[] {
  const issues: MapperIssue[] = [];
  const sources = new Set(sourceFields.map((field) => field.path));
  const destinations = new Set(destinationFields.map((field) => field.path));
  rules.forEach((rule, index) => {
    try {
      splitDataPath(rule.source);
      splitDataPath(rule.destination);
    } catch (error) {
      issues.push({
        rule: index,
        message: error instanceof Error ? error.message : 'Unsafe mapping path.',
      });
      return;
    }
    if (!sources.has(rule.source))
      issues.push({ rule: index, message: `Unknown source field: ${rule.source}` });
    if (!destinations.has(rule.destination))
      issues.push({ rule: index, message: `Unknown destination field: ${rule.destination}` });
  });
  return issues;
}
export interface DataMapperProps {
  sourceFields: readonly MapperField[];
  destinationFields: readonly MapperField[];
  rules: readonly MappingRule[];
  onChange: (rules: readonly MappingRule[]) => void;
  className?: string;
}
export function DataMapper({
  sourceFields,
  destinationFields,
  rules,
  onChange,
  className,
}: DataMapperProps): React.ReactElement {
  const issues = validateMapping(sourceFields, destinationFields, rules);
  return (
    <section className={className ?? 'lp-data-mapper'} aria-label="Data mapper">
      <h2>Field mappings</h2>
      {rules.map((rule, index) => (
        <div className="lp-data-mapper__rule" key={`${rule.source}-${rule.destination}-${index}`}>
          <label>
            Source {index + 1}
            <select
              value={rule.source}
              onChange={(event) =>
                onChange(
                  rules.map((item, at) =>
                    at === index ? { ...item, source: event.target.value } : item,
                  ),
                )
              }
            >
              {sourceFields.map((field) => (
                <option key={field.path} value={field.path}>
                  {field.label ?? field.path} ({field.type})
                </option>
              ))}
            </select>
          </label>
          <span aria-hidden="true">to</span>
          <label>
            Destination {index + 1}
            <select
              value={rule.destination}
              onChange={(event) =>
                onChange(
                  rules.map((item, at) =>
                    at === index ? { ...item, destination: event.target.value } : item,
                  ),
                )
              }
            >
              {destinationFields.map((field) => (
                <option key={field.path} value={field.path}>
                  {field.label ?? field.path} ({field.type})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            aria-label={`Remove mapping ${index + 1}`}
            onClick={() => onChange(rules.filter((_, at) => at !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          const source = sourceFields[0];
          const destination = destinationFields[0];
          if (source && destination)
            onChange([...rules, { source: source.path, destination: destination.path }]);
        }}
      >
        Add mapping
      </button>
      {issues.map((issue, index) => (
        <p role="alert" key={`${issue.rule}-${index}`}>
          {issue.message}
        </p>
      ))}
    </section>
  );
}
