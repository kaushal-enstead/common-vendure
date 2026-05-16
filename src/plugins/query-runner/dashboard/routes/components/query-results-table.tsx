import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';

interface QueryResultsTableProps {
  columns: string[];
  rows: any[];
}

export function QueryResultsTable({ columns, rows }: QueryResultsTableProps) {
  const { t } = useLingui();
  const [maxRows, setMaxRows] = useState(100);

  // Special JSON view: when backend returns a single `json` column,
  // pretty-print the JSON instead of forcing it into a table layout.
  const isJsonMode =
    columns &&
    columns.length === 1 &&
    columns[0] === 'json' &&
    rows &&
    rows.length > 0 &&
    Object.prototype.hasOwnProperty.call(rows[0], 'json');

  if (isJsonMode) {
    const value = rows[0].json;
    let pretty = '';
    try {
      pretty = JSON.stringify(value, null, 2);
    } catch {
      pretty = String(value);
    }

    return (
      <div className="rounded-md border bg-muted/40 p-3 max-h-[500px] overflow-auto">
        <pre className="text-xs font-mono whitespace-pre-wrap break-words">{pretty}</pre>
      </div>
    );
  }

  if (!columns || columns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trans>No results to display</Trans>
      </div>
    );
  }

  const displayRows = rows.slice(0, maxRows);
  const hasMore = rows.length > maxRows;

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '<null>';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col} className="font-semibold">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  <Trans>No rows returned</Trans>
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row, idx) => (
                <TableRow key={idx}>
                  {columns.map(col => (
                    <TableCell key={col} className="font-mono text-xs">
                      {formatValue(row[col])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {hasMore && (
        <div className="flex justify-center">
          <button onClick={() => setMaxRows(rows.length)} className="text-sm text-primary hover:underline">
            <Trans>Show all {rows.length} rows</Trans>
          </button>
        </div>
      )}
    </div>
  );
}
