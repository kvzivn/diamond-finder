import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Pool } from 'pg';

const execAsync = promisify(exec);

interface ImportJobStatus {
  id: string;
  type: string;
  status: string;
  totalRecords: number | null;
  processedRecords: number | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

interface ActionData {
  success: boolean;
  message: string;
  note?: string;
  importType?: string;
}

/**
 * Loader to show current import status and provide import form
 */
export async function loader({}: LoaderFunctionArgs) {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    return json({ error: 'Database not configured' }, { status: 500 });
  }

  const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });

  try {
    // Get recent import jobs
    const result = await pool.query(`
      SELECT
        id, type, status, "totalRecords", "processedRecords",
        "startedAt", "completedAt", error, "createdAt"
      FROM "ImportJob"
      ORDER BY "createdAt" DESC
      LIMIT 5
    `);

    // Get diamond counts
    const counts = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE type = 'natural') as natural,
        COUNT(*) FILTER (WHERE type = 'lab') as lab,
        MAX("updatedAt") as lastUpdated
      FROM "Diamond"
    `);

    return json({
      importJobs: result.rows as ImportJobStatus[],
      diamondCounts: {
        total: Number(counts.rows[0].total),
        natural: Number(counts.rows[0].natural),
        lab: Number(counts.rows[0].lab),
        lastUpdated: counts.rows[0].lastUpdated,
      },
    });
  } catch (error) {
    console.error('Error loading import status:', error);
    return json({ error: 'Failed to load import status' }, { status: 500 });
  } finally {
    await pool.end();
  }
}

/**
 * Action to manually trigger diamond imports using the direct PostgreSQL script
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json(
      { message: 'Method not allowed. Please use POST.' },
      { status: 405 }
    );
  }

  const formData = await request.formData();
  const importType = formData.get('type') as string;

  if (!['all', 'natural', 'lab'].includes(importType)) {
    return json(
      { success: false, message: 'Invalid import type' },
      { status: 400 }
    );
  }

  console.log(
    `Admin: Manual diamond import (${importType}) triggered in the background.`
  );

  // Determine the npm script to run
  const scriptMap = {
    all: 'import:all',
    natural: 'import:natural',
    lab: 'import:lab',
  };

  const script = scriptMap[importType as keyof typeof scriptMap];

  // Fire-and-forget: Start the import process but don't await it
  execAsync(`npm run ${script}`)
    .then(({ stdout, stderr }) => {
      console.log(
        `🎉 BACKGROUND IMPORT COMPLETED (${importType}): Direct import process finished successfully.`
      );
      if (stdout) console.log('Import stdout:', stdout);
      if (stderr) console.log('Import stderr:', stderr);
    })
    .catch((error) => {
      console.error(
        `❌ BACKGROUND IMPORT FAILED (${importType}): Direct import process failed.`,
        error
      );
    });

  // Return immediate response to prevent proxy timeouts
  return json({
    success: true,
    message: `Diamond import (${importType}) triggered successfully in the background. Monitor progress via 'fly logs'.`,
    note: 'This process will continue running on the server. Check logs for completion status.',
    importType,
  });
}

/**
 * Admin UI for triggering imports
 */
export default function AdminTriggerImport() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();

  if ('error' in data) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Import Admin - Error</h1>
        <p style={{ color: 'red' }}>Error: {data.error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Diamond Import Admin</h1>

      {actionData && (
        <div
          style={{
            padding: '10px',
            margin: '10px 0',
            backgroundColor: actionData.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${actionData.success ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px',
          }}
        >
          <strong>{actionData.success ? '✅ Success' : '❌ Error'}</strong>
          <p>{actionData.message}</p>
          {actionData.note && <small>{actionData.note}</small>}
        </div>
      )}

      <section style={{ marginBottom: '30px' }}>
        <h2>Current Database Status</h2>
        <div
          style={{
            padding: '10px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
          }}
        >
          <p>
            <strong>Total Diamonds:</strong>{' '}
            {data.diamondCounts.total.toLocaleString()}
          </p>
          <p>
            <strong>Natural Diamonds:</strong>{' '}
            {data.diamondCounts.natural.toLocaleString()}
          </p>
          <p>
            <strong>Lab Diamonds:</strong>{' '}
            {data.diamondCounts.lab.toLocaleString()}
          </p>
          <p>
            <strong>Last Updated:</strong>{' '}
            {data.diamondCounts.lastUpdated || 'Never'}
          </p>
        </div>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Trigger Import</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Form method="post">
            <input type="hidden" name="type" value="all" />
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Import All Diamonds
            </button>
          </Form>

          <Form method="post">
            <input type="hidden" name="type" value="natural" />
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Import Natural Only
            </button>
          </Form>

          <Form method="post">
            <input type="hidden" name="type" value="lab" />
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Import Lab Only
            </button>
          </Form>
        </div>
        <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '10px' }}>
          ⚠️ Warning: Import processes clear existing diamonds of the selected
          type before importing new ones.
        </p>
      </section>

      <section>
        <h2>Recent Import Jobs</h2>
        {data.importJobs.length === 0 ? (
          <p>No import jobs found</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #dee2e6',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th
                  style={{
                    padding: '8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'left',
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    padding: '8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'left',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: '8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'left',
                  }}
                >
                  Records
                </th>
                <th
                  style={{
                    padding: '8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'left',
                  }}
                >
                  Started
                </th>
                <th
                  style={{
                    padding: '8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'left',
                  }}
                >
                  Completed
                </th>
              </tr>
            </thead>
            <tbody>
              {data.importJobs.map((job) => (
                <tr key={job.id}>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                    {job.type}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor:
                          job.status === 'COMPLETED'
                            ? '#d4edda'
                            : job.status === 'FAILED'
                              ? '#f8d7da'
                              : job.status === 'IN_PROGRESS'
                                ? '#fff3cd'
                                : '#e2e3e5',
                        color:
                          job.status === 'COMPLETED'
                            ? '#155724'
                            : job.status === 'FAILED'
                              ? '#721c24'
                              : job.status === 'IN_PROGRESS'
                                ? '#856404'
                                : '#6c757d',
                      }}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                    {job.processedRecords?.toLocaleString() || 0} /{' '}
                    {job.totalRecords?.toLocaleString() || '?'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                    {job.startedAt
                      ? new Date(job.startedAt).toLocaleString()
                      : 'Not started'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                    {job.completedAt
                      ? new Date(job.completedAt).toLocaleString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section
        style={{ marginTop: '30px', fontSize: '14px', color: '#6c757d' }}
      >
        <h3>Usage Instructions</h3>
        <ul>
          <li>
            Use "Import All" to refresh both natural and lab-grown diamonds
          </li>
          <li>Use specific import buttons to update only one type</li>
          <li>
            Monitor progress using <code>fly logs</code> in your terminal
          </li>
          <li>Check this page after import completion to verify results</li>
          <li>Import processes run in the background to prevent timeouts</li>
        </ul>
      </section>
    </div>
  );
}
