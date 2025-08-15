import { useState, useMemo, useEffect, useRef } from 'react';
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from '@remix-run/node';
import {
  useLoaderData,
  useSubmit,
  useNavigation,
  useActionData,
} from '@remix-run/react';
import { authenticate } from '../shopify.server';
import prisma from '../db.server';
import { clearIntervalCache } from '../services/markup-intervals.server';
import type { DiamondType } from '../models/diamond.server';
import '../styles/markup-intervals.css';

interface MarkupInterval {
  id: string;
  type: DiamondType;
  minCarat: number;
  maxCarat: number;
  multiplier: number;
}

interface LoaderData {
  naturalIntervals: MarkupInterval[];
  labIntervals: MarkupInterval[];
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const [naturalIntervals, labIntervals] = await Promise.all([
    prisma.markupInterval.findMany({
      where: { type: 'natural' },
      orderBy: { minCarat: 'asc' },
    }),
    prisma.markupInterval.findMany({
      where: { type: 'lab' },
      orderBy: { minCarat: 'asc' },
    }),
  ]);

  return json({
    naturalIntervals: naturalIntervals as MarkupInterval[],
    labIntervals: labIntervals as MarkupInterval[],
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);

  const formData = await request.formData();
  const updates = JSON.parse(formData.get('updates') as string);

  try {
    // Update all intervals in a transaction
    await prisma.$transaction(
      updates.map((update: { id: string; multiplier: number }) =>
        prisma.markupInterval.update({
          where: { id: update.id },
          data: { multiplier: update.multiplier },
        })
      )
    );

    // Clear server-side cache
    clearIntervalCache();

    console.log('[MARKUP INTERVALS] Updated intervals and cleared cache');

    return json({ success: true });
  } catch (error) {
    console.error('Error updating markup intervals:', error);
    return json(
      { error: 'Failed to update markup intervals' },
      { status: 500 }
    );
  }
};

export default function MarkupIntervals() {
  const { naturalIntervals, labIntervals } = useLoaderData<LoaderData>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData<{ success?: boolean; error?: string }>();

  // Simple state - just store current multipliers by ID
  const [multipliers, setMultipliers] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    naturalIntervals.forEach((i) => (initial[i.id] = i.multiplier));
    labIntervals.forEach((i) => (initial[i.id] = i.multiplier));
    return initial;
  });

  // Button state management
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const lastSuccessfulAction = useRef<any>(null);

  // Store original values for change detection
  const originalMultipliers = useMemo(() => {
    const original: Record<string, number> = {};
    naturalIntervals.forEach((i) => (original[i.id] = i.multiplier));
    labIntervals.forEach((i) => (original[i.id] = i.multiplier));
    return original;
  }, [naturalIntervals, labIntervals]);

  // Check if we have changes
  const hasChanges = useMemo(() => {
    return Object.keys(multipliers).some(
      (id) => Math.abs(multipliers[id] - originalMultipliers[id]) > 0.001
    );
  }, [multipliers, originalMultipliers]);

  // Check if form is submitting
  const isSubmitting = navigation.state === 'submitting';

  // Handle success state after form submission
  useEffect(() => {
    if (
      navigation.state === 'idle' &&
      actionData?.success &&
      actionData !== lastSuccessfulAction.current
    ) {
      lastSuccessfulAction.current = actionData;
      setSaveStatus('saved');
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [navigation.state, actionData]);

  const handleIntervalChange = (id: string, multiplier: number) => {
    setMultipliers((prev) => ({
      ...prev,
      [id]: multiplier,
    }));
  };

  const handleSave = () => {
    const allUpdates = Object.keys(multipliers).map((id) => ({
      id,
      multiplier: multipliers[id],
    }));

    submit({ updates: JSON.stringify(allUpdates) }, { method: 'post' });
  };

  const handleReset = () => {
    setMultipliers({ ...originalMultipliers });
  };

  const formatCaratRange = (min: number, max: number) => {
    return `${min.toFixed(2)}-${max.toFixed(2)}`;
  };


  return (
    <div className="markup-intervals-page">
      <div className="markup-intervals-header">
        <div className="markup-intervals-header-content">
          <h1 className="markup-intervals-header-title">
            Diamond Markup Intervals
          </h1>
          <p className="markup-intervals-header-subtitle">
            Configure granular markup multipliers for different carat weight
            ranges.
          </p>
        </div>

        <div className="markup-intervals-toolbar">
          <div className="markup-intervals-toolbar-buttons">
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || isSubmitting}
              className="markup-intervals-save-button"
            >
              {isSubmitting ? 'Saving changes...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges}
              className="markup-intervals-reset-button"
            >
              Reset
            </button>
          </div>
          {saveStatus === 'saved' && (
            <div className="markup-intervals-success-message">
              ✅ Saved successfully
            </div>
          )}
        </div>
      </div>

      {/* Natural Diamonds */}
      <div className="markup-intervals-section">
        <h2 className="markup-intervals-section-title">
          Natural Diamonds ({naturalIntervals.length} intervals)
        </h2>
        <div className="markup-intervals-list">
          {naturalIntervals.map((interval) => {
            const currentMultiplier =
              multipliers[interval.id] || interval.multiplier;
            return (
              <div key={interval.id} className="markup-intervals-card">
                <div className="markup-intervals-card-body">
                  <label className="markup-intervals-label">
                    {formatCaratRange(interval.minCarat, interval.maxCarat)}{' '}
                    carat
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="10"
                    value={currentMultiplier}
                    onChange={(e) => {
                      const parsed = parseFloat(e.target.value);
                      if (!Number.isNaN(parsed)) {
                        handleIntervalChange(interval.id, parsed);
                      }
                    }}
                    className="markup-intervals-input"
                    placeholder="1.0"
                  />
                  <div className="markup-intervals-percent">
                    Markup: {((currentMultiplier - 1) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lab Diamonds */}
      <div className="markup-intervals-section">
        <h2 className="markup-intervals-section-title">
          Lab Diamonds ({labIntervals.length} intervals)
        </h2>
        <div className="markup-intervals-list">
          {labIntervals.map((interval) => {
            const currentMultiplier =
              multipliers[interval.id] || interval.multiplier;
            return (
              <div key={interval.id} className="markup-intervals-card">
                <div className="markup-intervals-card-body">
                  <label className="markup-intervals-label">
                    {formatCaratRange(interval.minCarat, interval.maxCarat)}{' '}
                    carat
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="10"
                    value={currentMultiplier}
                    onChange={(e) => {
                      const parsed = parseFloat(e.target.value);
                      if (!Number.isNaN(parsed)) {
                        handleIntervalChange(interval.id, parsed);
                      }
                    }}
                    className="markup-intervals-input"
                    placeholder="1.0"
                  />
                  <div className="markup-intervals-percent">
                    Markup: {((currentMultiplier - 1) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="markup-intervals-toolbar-bottom">
        <div className="markup-intervals-toolbar-buttons">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges}
            className="markup-intervals-reset-button"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isSubmitting}
            className="markup-intervals-save-button"
          >
            {isSubmitting ? 'Saving changes...' : 'Save Changes'}
          </button>
        </div>
        {saveStatus === 'saved' && (
          <div className="markup-intervals-success-message">
            ✅ Saved successfully
          </div>
        )}
      </div>
    </div>
  );
}
