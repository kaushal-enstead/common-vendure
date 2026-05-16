import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import {
  DashboardRouteDefinition,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PermissionGuard,
  Alert,
  AlertDescription,
  api,
  useMutation,
} from '@vendure/dashboard';
import { executeQueryDocument } from './query-runner.graphql';
import { CodeEditor } from './components/code-editor';
import { QueryResultsTable } from './components/query-results-table';

const pageId = 'query-runner';

export const queryRunner: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'system',
    id: 'query-runner',
    url: '/query-runner',
    title: 'Query Runner',
  },
  path: '/query-runner',
  loader: () => ({
    breadcrumb: 'Query Runner',
  }),
  component: route => {
    const { t } = useLingui();
    const [query, setQuery] = useState('SELECT * FROM customer LIMIT 10;');
    const [lastResult, setLastResult] = useState<any>(null);

    const executeQueryMutation = useMutation({
      mutationFn: api.mutate(executeQueryDocument),
      onSuccess: (data: any) => {
        setLastResult(data.executeQuery);
      },
      onError: (error: any) => {
        setLastResult({
          columns: [],
          rows: [],
          rowCount: 0,
          executionTime: 0,
          error: error.message || 'Failed to execute query',
        });
      },
    });

    const handleExecute = () => {
      if (!query.trim()) {
        return;
      }
      executeQueryMutation.mutate({ query: query.trim() });
    };

    const handleClear = () => {
      setQuery('');
      setLastResult(null);
    };

    return (
      <PermissionGuard requires={['QueryRunner']}>
        <div className="flex flex-col h-full gap-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                <Trans>Query Runner</Trans>
              </h1>
              {/* <p className="text-muted-foreground mt-1">
                <Trans>
                  Execute SQL queries (SELECT, INSERT, UPDATE, DELETE, CREATE, SHOW, TRUNCATE, ALTER)
                </Trans>
              </p> */}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                <Trans>SQL Query</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeEditor value={query} onChange={setQuery} />
              <div className="flex gap-2">
                <Button onClick={handleExecute} disabled={executeQueryMutation.isPending || !query.trim()}>
                  {executeQueryMutation.isPending ? (
                    <Trans>Executing...</Trans>
                  ) : (
                    <Trans>Execute Query</Trans>
                  )}
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  <Trans>Clear</Trans>
                </Button>
              </div>
            </CardContent>
          </Card>

          {lastResult && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Results</Trans>
                  {lastResult.rowCount !== undefined && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({lastResult.rowCount} {lastResult.rowCount === 1 ? 'row' : 'rows'},{' '}
                      {lastResult.executionTime}ms)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lastResult.error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{lastResult.error}</AlertDescription>
                  </Alert>
                ) : (
                  <QueryResultsTable columns={lastResult.columns || []} rows={lastResult.rows || []} />
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                <Trans>Supported Query Types</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  <Trans>
                    Supported query types: SELECT, INSERT, UPDATE, DELETE, CREATE, SHOW, TRUNCATE and ALTER.
                  </Trans>
                </AlertDescription>
                <AlertDescription>
                  <Trans>
                    DROP and other highly destructive or privileged operations are still blocked for security.
                  </Trans>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    );
  },
};
