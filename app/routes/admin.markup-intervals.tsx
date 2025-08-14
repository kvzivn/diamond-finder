import { useState, useEffect } from 'react';
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { authenticate } from '../shopify.server';
import prisma from '../db.server';
import { clearIntervalCache } from '../services/markup-intervals.server';
import type { DiamondType } from '../models/diamond.server';

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

  return json({ naturalIntervals: naturalIntervals as MarkupInterval[], labIntervals: labIntervals as MarkupInterval[] });
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
    return json({ error: 'Failed to update markup intervals' }, { status: 500 });
  }
};

export default function MarkupIntervals() {
  const { naturalIntervals, labIntervals } = useLoaderData<LoaderData>();
  const submit = useSubmit();

  const [intervals, setIntervals] = useState<{
    natural: MarkupInterval[];
    lab: MarkupInterval[];
  }>({
    natural: naturalIntervals,
    lab: labIntervals,
  });

  const [activeTab, setActiveTab] = useState<DiamondType>('natural');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const hasNaturalChanges = intervals.natural.some((interval: MarkupInterval, index: number) => 
      interval.multiplier !== naturalIntervals[index]?.multiplier
    );
    const hasLabChanges = intervals.lab.some((interval: MarkupInterval, index: number) => 
      interval.multiplier !== labIntervals[index]?.multiplier
    );
    setHasChanges(hasNaturalChanges || hasLabChanges);
  }, [intervals, naturalIntervals, labIntervals]);

  const handleIntervalChange = (type: DiamondType, id: string, multiplier: number) => {
    setIntervals(prev => ({
      ...prev,
      [type]: (prev[type] as MarkupInterval[]).map((interval: MarkupInterval) =>
        interval.id === id ? { ...interval, multiplier } : interval
      ),
    }));
  };

  const handleSave = () => {
    const allUpdates = [
      ...intervals.natural.map((interval: MarkupInterval) => ({ id: interval.id, multiplier: interval.multiplier })),
      ...intervals.lab.map((interval: MarkupInterval) => ({ id: interval.id, multiplier: interval.multiplier })),
    ];

    submit(
      { updates: JSON.stringify(allUpdates) },
      { method: 'post' }
    );
  };

  const formatCaratRange = (min: number, max: number) => {
    return `${min.toFixed(2)}-${max.toFixed(2)}`;
  };

  const currentIntervals = intervals[activeTab] as MarkupInterval[];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Diamond Markup Intervals</h1>
        <p className="text-gray-600">Configure granular markup multipliers for different carat weight ranges.</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('natural')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'natural'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Natural Diamonds ({intervals.natural.length} intervals)
            </button>
            <button
              onClick={() => setActiveTab('lab')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lab'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Lab Diamonds ({intervals.lab.length} intervals)
            </button>
          </nav>
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Unsaved Changes</h3>
              <p className="text-sm text-yellow-700">You have unsaved changes to your markup intervals.</p>
            </div>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Intervals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentIntervals.map((interval) => (
          <div key={interval.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formatCaratRange(interval.minCarat, interval.maxCarat)} carat
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="10"
                value={interval.multiplier}
                onChange={(e) => 
                  handleIntervalChange(activeTab, interval.id, parseFloat(e.target.value) || 1.0)
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="1.0"
              />
            </div>
            <div className="text-xs text-gray-500">
              Markup: {((interval.multiplier - 1) * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              const newIntervals = (intervals[activeTab] as MarkupInterval[]).map((interval: MarkupInterval) => ({ ...interval, multiplier: 1.0 }));
              setIntervals(prev => ({ ...prev, [activeTab]: newIntervals }));
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Reset All to 1.0x
          </button>
          <button
            onClick={() => {
              const newIntervals = (intervals[activeTab] as MarkupInterval[]).map((interval: MarkupInterval) => ({ ...interval, multiplier: 1.5 }));
              setIntervals(prev => ({ ...prev, [activeTab]: newIntervals }));
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Set All to 1.5x
          </button>
          <button
            onClick={() => {
              const newIntervals = (intervals[activeTab] as MarkupInterval[]).map((interval: MarkupInterval) => ({ ...interval, multiplier: 2.0 }));
              setIntervals(prev => ({ ...prev, [activeTab]: newIntervals }));
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Set All to 2.0x
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">How Markup Intervals Work</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Each carat range has its own multiplier (e.g., 1.5 = 50% markup)</li>
          <li>• Diamond prices are multiplied by the corresponding multiplier for their carat weight</li>
          <li>• Changes take effect immediately after saving</li>
          <li>• Final prices are rounded to the nearest 100 SEK</li>
        </ul>
      </div>
    </div>
  );
}