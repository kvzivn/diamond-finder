import {
  PrismaClient,
  DiamondType,
  Diamond as PrismaDiamond,
  ImportStatus,
  Prisma,
} from '@prisma/client';
import type { Diamond } from '../models/diamond.server';

const prisma = new PrismaClient();

interface DiamondFilters {
  shape?: string;
  minPrice?: number;
  maxPrice?: number;
  minPriceSek?: number;
  maxPriceSek?: number;
  minCarat?: number;
  maxCarat?: number;
  minColour?: string;
  maxColour?: string;
  minClarity?: string;
  maxClarity?: string;
  minCutGrade?: string;
  maxCutGrade?: string;
  type?: string;
  gradingLab?: string;
  minFluorescence?: string;
  maxFluorescence?: string;
  minPolish?: string;
  maxPolish?: string;
  minSymmetry?: string;
  maxSymmetry?: string;
  minTable?: number;
  maxTable?: number;
  minRatio?: number;
  maxRatio?: number;
  fancyColours?: string;
  minFancyIntensity?: string;
  maxFancyIntensity?: string;
  offset?: number;
  limit?: number;
}

const BATCH_SIZE = 800; // Optimized for 1GB App / 2GB PostgreSQL instance

export async function getDiamondsByType(
  type: DiamondType,
  offset = 0,
  limit = 50
): Promise<{ data: PrismaDiamond[]; totalCount: number }> {
  const [data, totalCount] = await Promise.all([
    prisma.diamond.findMany({
      where: { type },
      skip: offset,
      take: limit,
      orderBy: { totalPrice: 'asc' },
    }),
    prisma.diamond.count({ where: { type } }),
  ]);

  return { data, totalCount };
}

export async function getFilteredDiamonds(
  filters: DiamondFilters
): Promise<{ data: PrismaDiamond[]; totalCount: number }> {
  const where: Prisma.DiamondWhereInput = {};

  // Type filter
  if (filters.type === 'natural' || filters.type === 'lab') {
    where.type = filters.type as DiamondType;
  }

  // Shape filter (using 'cut' field)
  if (filters.shape) {
    where.cut = { equals: filters.shape, mode: 'insensitive' };
  }

  // Price filters (prioritize SEK over USD) - always exclude diamonds with null prices
  if (filters.minPriceSek !== undefined || filters.maxPriceSek !== undefined) {
    where.totalPriceSek = {
      not: null, // Exclude diamonds with null prices
    };
    if (filters.minPriceSek !== undefined) {
      where.totalPriceSek.gte = filters.minPriceSek;
    }
    if (filters.maxPriceSek !== undefined) {
      where.totalPriceSek.lte = filters.maxPriceSek;
    }
  } else if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.totalPrice = {
      not: null, // Exclude diamonds with null prices
    };
    if (filters.minPrice !== undefined) {
      where.totalPrice.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      where.totalPrice.lte = filters.maxPrice;
    }
  } else {
    // Even when no explicit price filters are applied, exclude diamonds with null prices
    // Prioritize SEK prices, fallback to USD prices, but exclude completely null diamonds
    where.OR = [
      { totalPriceSek: { not: null } },
      {
        AND: [{ totalPriceSek: null }, { totalPrice: { not: null } }],
      },
    ];
  }

  // Carat filters
  if (filters.minCarat !== undefined || filters.maxCarat !== undefined) {
    where.carat = {};
    if (filters.minCarat !== undefined) {
      where.carat.gte = filters.minCarat;
    }
    if (filters.maxCarat !== undefined) {
      where.carat.lte = filters.maxCarat;
    }
  }

  // Colour filters
  if (filters.minColour || filters.maxColour) {
    // These are the actual colour values that exist in the database
    const actualColourLabels = ['K', 'J', 'I', 'H', 'G', 'F', 'E', 'D'];

    // Map filter values to actual database values
    const getActualColour = (value: string) => {
      const cleanValue = value.toUpperCase().replace(/_MAX$/i, '');
      // Handle D_MAX as D
      return cleanValue === 'D_MAX' ? 'D' : cleanValue;
    };

    if (filters.minColour && filters.maxColour) {
      const minColour = getActualColour(filters.minColour);
      const maxColour = getActualColour(filters.maxColour);

      const minIdx = actualColourLabels.indexOf(minColour);
      const maxIdx = actualColourLabels.indexOf(maxColour);

      if (minIdx !== -1 && maxIdx !== -1) {
        // Get the range of colour values to include
        const colourValuesToInclude = actualColourLabels.slice(
          minIdx,
          maxIdx + 1
        );

        if (!where.AND) {
          where.AND = [];
        } else if (!Array.isArray(where.AND)) {
          where.AND = [where.AND];
        }

        // Apply white color filters AND exclude fancy colored diamonds
        (where.AND as Prisma.DiamondWhereInput[]).push({
          AND: [
            { color: { in: colourValuesToInclude } },
            {
              OR: [
                { naturalFancyColor: null },
                { naturalFancyColor: '' },
                { naturalFancyColor: { in: ['', ' ', '  '] } },
              ],
            },
          ],
        });
      }
    } else if (filters.minColour) {
      const minColour = getActualColour(filters.minColour);
      const minIdx = actualColourLabels.indexOf(minColour);
      if (minIdx !== -1) {
        const colourValuesToInclude = actualColourLabels.slice(minIdx);

        if (!where.AND) {
          where.AND = [];
        } else if (!Array.isArray(where.AND)) {
          where.AND = [where.AND];
        }

        (where.AND as Prisma.DiamondWhereInput[]).push({
          AND: [
            { color: { in: colourValuesToInclude } },
            {
              OR: [
                { naturalFancyColor: null },
                { naturalFancyColor: '' },
                { naturalFancyColor: { in: ['', ' ', '  '] } },
              ],
            },
          ],
        });
      }
    } else if (filters.maxColour) {
      const maxColour = getActualColour(filters.maxColour);
      const maxIdx = actualColourLabels.indexOf(maxColour);
      if (maxIdx !== -1) {
        const colourValuesToInclude = actualColourLabels.slice(0, maxIdx + 1);

        if (!where.AND) {
          where.AND = [];
        } else if (!Array.isArray(where.AND)) {
          where.AND = [where.AND];
        }

        (where.AND as Prisma.DiamondWhereInput[]).push({
          AND: [
            { color: { in: colourValuesToInclude } },
            {
              OR: [
                { naturalFancyColor: null },
                { naturalFancyColor: '' },
                { naturalFancyColor: { in: ['', ' ', '  '] } },
              ],
            },
          ],
        });
      }
    }
  }

  // Fancy colour filters
  if (
    filters.fancyColours ||
    filters.minFancyIntensity ||
    filters.maxFancyIntensity
  ) {
    const fancyColorConditions: Prisma.DiamondWhereInput[] = [];

    if (filters.fancyColours) {
      // Special case: if fancyColours is "ALL_FANCY", show all fancy colored diamonds
      if (filters.fancyColours === 'ALL_FANCY') {
        if (!where.AND) {
          where.AND = [];
        } else if (!Array.isArray(where.AND)) {
          where.AND = [where.AND];
        }
        (where.AND as Prisma.DiamondWhereInput[]).push({
          AND: [
            { naturalFancyColor: { not: null } },
            { naturalFancyColor: { not: '' } },
            { naturalFancyColor: { not: { in: ['', ' ', '  '] } } },
          ],
        });
      } else {
        // Handle specific fancy colors
        const fancyColourList = filters.fancyColours
          .split(',')
          .map((c) => c.toLowerCase());

        fancyColourList.forEach((fancyColor) => {
          if (fancyColor === 'other') {
            // Complex "other" logic - diamonds with fancy colors not in main list
            fancyColorConditions.push({
              AND: [
                { naturalFancyColor: { not: null } },
                { naturalFancyColor: { not: '' } },
                {
                  NOT: {
                    OR: [
                      {
                        naturalFancyColor: {
                          contains: 'yellow',
                          mode: 'insensitive',
                        },
                      },
                      {
                        naturalFancyColor: {
                          contains: 'pink',
                          mode: 'insensitive',
                        },
                      },
                      {
                        naturalFancyColor: {
                          contains: 'blue',
                          mode: 'insensitive',
                        },
                      },
                      {
                        naturalFancyColor: {
                          contains: 'red',
                          mode: 'insensitive',
                        },
                      },
                      {
                        naturalFancyColor: {
                          contains: 'green',
                          mode: 'insensitive',
                        },
                      },
                      {
                        naturalFancyColor: {
                          contains: 'purple',
                          mode: 'insensitive',
                        },
                      },
                      {
                        naturalFancyColor: {
                          contains: 'orange',
                          mode: 'insensitive',
                        },
                      },
                      {
                        naturalFancyColor: {
                          contains: 'violet',
                          mode: 'insensitive',
                        },
                      },
                      {
                        naturalFancyColor: {
                          contains: 'gray',
                          mode: 'insensitive',
                        },
                      },
                      {
                        naturalFancyColor: {
                          contains: 'black',
                          mode: 'insensitive',
                        },
                      },
                      {
                        naturalFancyColor: {
                          contains: 'brown',
                          mode: 'insensitive',
                        },
                      },
                      {
                        naturalFancyColor: {
                          contains: 'cognac',
                          mode: 'insensitive',
                        },
                      },
                      {
                        naturalFancyColor: {
                          contains: 'white',
                          mode: 'insensitive',
                        },
                      },
                      {
                        naturalFancyColor: {
                          contains: 'salt',
                          mode: 'insensitive',
                        },
                      },
                      {
                        naturalFancyColor: {
                          contains: 'pepper',
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              ],
            });
          } else if (fancyColor === 's-and-p') {
            fancyColorConditions.push({
              OR: [
                {
                  naturalFancyColor: { contains: 'salt', mode: 'insensitive' },
                },
                {
                  naturalFancyColor: {
                    contains: 'pepper',
                    mode: 'insensitive',
                  },
                },
              ],
            });
          } else {
            fancyColorConditions.push({
              naturalFancyColor: { contains: fancyColor, mode: 'insensitive' },
            });
          }
        });
      }
    }

    // Apply fancy color conditions (only for specific colors, not for ALL_FANCY)
    if (fancyColorConditions.length > 0) {
      if (!where.AND) {
        where.AND = [];
      } else if (!Array.isArray(where.AND)) {
        where.AND = [where.AND];
      }
      (where.AND as Prisma.DiamondWhereInput[]).push({
        AND: [
          { naturalFancyColor: { not: null } },
          { naturalFancyColor: { not: '' } },
          { OR: fancyColorConditions },
        ],
      });
    }

    // Intensity filters with updated logic
    if (filters.minFancyIntensity || filters.maxFancyIntensity) {
      // Map filter values to actual database values
      const getActualIntensity = (value: string) => {
        const cleanValue = value.replace(/_MAX$/i, '');
        // Handle Dark_MAX as Dark
        if (cleanValue === 'Dark_MAX') return 'Dark';

        // Map our simplified labels to actual database values
        switch (cleanValue) {
          case 'Light':
            return ['Light', 'Very Light', 'Faint', 'Fancy Light'];
          case 'Fancy':
            return ['Fancy'];
          case 'Intense':
            return ['Intense'];
          case 'Vivid':
            return ['Vivid'];
          case 'Deep':
            return ['Fancy Deep'];
          case 'Dark':
            return ['Fancy Dark'];
          default:
            return cleanValue;
        }
      };

      // Get the full range of intensities based on min and max
      const simplifiedLabels = [
        'Light',
        'Fancy',
        'Intense',
        'Vivid',
        'Deep',
        'Dark',
      ];

      if (filters.minFancyIntensity && filters.maxFancyIntensity) {
        const minIntensity = filters.minFancyIntensity.replace(/_MAX$/i, '');
        const maxIntensity = filters.maxFancyIntensity.replace(/_MAX$/i, '');

        const minIdx = simplifiedLabels.findIndex(
          (intensity) => intensity.toLowerCase() === minIntensity.toLowerCase()
        );
        const maxIdx = simplifiedLabels.findIndex(
          (intensity) => intensity.toLowerCase() === maxIntensity.toLowerCase()
        );

        if (minIdx !== -1 && maxIdx !== -1) {
          // Get all intensities in the range
          let validIntensities: string[] = [];
          for (let i = minIdx; i <= maxIdx; i++) {
            const mapped = getActualIntensity(simplifiedLabels[i]);
            if (Array.isArray(mapped)) {
              validIntensities = validIntensities.concat(mapped);
            } else {
              validIntensities.push(mapped);
            }
          }

          if (!where.AND) {
            where.AND = [];
          } else if (!Array.isArray(where.AND)) {
            where.AND = [where.AND];
          }
          (where.AND as Prisma.DiamondWhereInput[]).push({
            naturalFancyColorIntensity: { in: validIntensities },
          });
        }
      } else if (filters.minFancyIntensity) {
        const minIntensity = filters.minFancyIntensity.replace(/_MAX$/i, '');
        const minIdx = simplifiedLabels.findIndex(
          (intensity) => intensity.toLowerCase() === minIntensity.toLowerCase()
        );

        if (minIdx !== -1) {
          let validIntensities: string[] = [];
          for (let i = minIdx; i < simplifiedLabels.length; i++) {
            const mapped = getActualIntensity(simplifiedLabels[i]);
            if (Array.isArray(mapped)) {
              validIntensities = validIntensities.concat(mapped);
            } else {
              validIntensities.push(mapped);
            }
          }

          if (!where.AND) {
            where.AND = [];
          } else if (!Array.isArray(where.AND)) {
            where.AND = [where.AND];
          }
          (where.AND as Prisma.DiamondWhereInput[]).push({
            naturalFancyColorIntensity: { in: validIntensities },
          });
        }
      } else if (filters.maxFancyIntensity) {
        const maxIntensity = filters.maxFancyIntensity.replace(/_MAX$/i, '');
        const maxIdx = simplifiedLabels.findIndex(
          (intensity) => intensity.toLowerCase() === maxIntensity.toLowerCase()
        );

        if (maxIdx !== -1) {
          let validIntensities: string[] = [];
          for (let i = 0; i <= maxIdx; i++) {
            const mapped = getActualIntensity(simplifiedLabels[i]);
            if (Array.isArray(mapped)) {
              validIntensities = validIntensities.concat(mapped);
            } else {
              validIntensities.push(mapped);
            }
          }

          if (!where.AND) {
            where.AND = [];
          } else if (!Array.isArray(where.AND)) {
            where.AND = [where.AND];
          }
          (where.AND as Prisma.DiamondWhereInput[]).push({
            naturalFancyColorIntensity: { in: validIntensities },
          });
        }
      }
    }
  }

  // Clarity filters
  if (filters.minClarity || filters.maxClarity) {
    // These are the actual clarity values that exist in the database
    const actualClarityLabels = [
      'SI2',
      'SI1',
      'VS2',
      'VS1',
      'VVS2',
      'VVS1',
      'IF',
      'FL',
    ];

    // Map filter values to actual database values
    const getActualClarity = (value: string) => {
      const cleanValue = value.toUpperCase().replace(/_MAX$/i, '');
      // Handle FL_MAX as FL
      return cleanValue === 'FL_MAX' ? 'FL' : cleanValue;
    };

    if (filters.minClarity && filters.maxClarity) {
      const minClarity = getActualClarity(filters.minClarity);
      const maxClarity = getActualClarity(filters.maxClarity);

      const minIdx = actualClarityLabels.indexOf(minClarity);
      const maxIdx = actualClarityLabels.indexOf(maxClarity);

      if (minIdx !== -1 && maxIdx !== -1) {
        // Get the range of clarity values to include
        const clarityValuesToInclude = actualClarityLabels.slice(
          minIdx,
          maxIdx + 1
        );
        where.clarity = { in: clarityValuesToInclude };
      }
    } else if (filters.minClarity) {
      const minClarity = getActualClarity(filters.minClarity);
      const minIdx = actualClarityLabels.indexOf(minClarity);
      if (minIdx !== -1) {
        where.clarity = { in: actualClarityLabels.slice(minIdx) };
      }
    } else if (filters.maxClarity) {
      const maxClarity = getActualClarity(filters.maxClarity);
      const maxIdx = actualClarityLabels.indexOf(maxClarity);
      if (maxIdx !== -1) {
        where.clarity = { in: actualClarityLabels.slice(0, maxIdx + 1) };
      }
    }
  }

  // Cut Grade filters
  if (filters.minCutGrade || filters.maxCutGrade) {
    // These are the actual cut grade values that exist in the database
    const actualCutGradeLabels = ['Good', 'Very Good', 'Excellent'];

    // Map filter values to actual database values
    const getActualCutGrade = (value: string) => {
      const cleanValue = value.replace(/_MAX$/i, '');
      // Handle Excellent_MAX as Excellent
      return cleanValue === 'Excellent_MAX' ? 'Excellent' : cleanValue;
    };

    if (filters.minCutGrade && filters.maxCutGrade) {
      const minCutGrade = getActualCutGrade(filters.minCutGrade);
      const maxCutGrade = getActualCutGrade(filters.maxCutGrade);

      const minIdx = actualCutGradeLabels.findIndex(
        (g) => g.toLowerCase() === minCutGrade.toLowerCase()
      );
      const maxIdx = actualCutGradeLabels.findIndex(
        (g) => g.toLowerCase() === maxCutGrade.toLowerCase()
      );

      if (minIdx !== -1 && maxIdx !== -1) {
        // Get the range of cut grades to include
        const cutGradesToInclude = actualCutGradeLabels.slice(
          minIdx,
          maxIdx + 1
        );
        where.cutGrade = { in: cutGradesToInclude };
      }
    } else if (filters.minCutGrade) {
      const minCutGrade = getActualCutGrade(filters.minCutGrade);
      const minIdx = actualCutGradeLabels.findIndex(
        (g) => g.toLowerCase() === minCutGrade.toLowerCase()
      );
      if (minIdx !== -1) {
        where.cutGrade = { in: actualCutGradeLabels.slice(minIdx) };
      }
    } else if (filters.maxCutGrade) {
      const maxCutGrade = getActualCutGrade(filters.maxCutGrade);
      const maxIdx = actualCutGradeLabels.findIndex(
        (g) => g.toLowerCase() === maxCutGrade.toLowerCase()
      );
      if (maxIdx !== -1) {
        where.cutGrade = { in: actualCutGradeLabels.slice(0, maxIdx + 1) };
      }
    }
  }

  // Polish filters
  if (filters.minPolish || filters.maxPolish) {
    const polishLabels = ['Good', 'Very Good', 'Excellent'];

    if (filters.minPolish && filters.maxPolish) {
      // Handle _MAX suffix for maxPolish
      const maxPolishValue = filters.maxPolish.replace(/_MAX$/i, '');

      const minIdx = polishLabels.findIndex(
        (g) => g.toLowerCase() === filters.minPolish!.toLowerCase()
      );
      const maxIdx = polishLabels.findIndex(
        (g) => g.toLowerCase() === maxPolishValue.toLowerCase()
      );
      if (minIdx !== -1 && maxIdx !== -1) {
        where.polish = { in: polishLabels.slice(minIdx, maxIdx + 1) };
      }
    } else if (filters.minPolish) {
      const minIdx = polishLabels.findIndex(
        (g) => g.toLowerCase() === filters.minPolish!.toLowerCase()
      );
      if (minIdx !== -1) {
        where.polish = { in: polishLabels.slice(minIdx) };
      }
    } else if (filters.maxPolish) {
      // Handle _MAX suffix (means include the best/last value)
      const maxPolishValue = filters.maxPolish.replace(/_MAX$/i, '');
      const maxIdx = polishLabels.findIndex(
        (g) => g.toLowerCase() === maxPolishValue.toLowerCase()
      );
      if (maxIdx !== -1) {
        where.polish = { in: polishLabels.slice(0, maxIdx + 1) };
      }
    }
  }

  // Symmetry filters
  if (filters.minSymmetry || filters.maxSymmetry) {
    const symmetryLabels = ['Good', 'Very Good', 'Excellent'];

    if (filters.minSymmetry && filters.maxSymmetry) {
      // Handle _MAX suffix for maxSymmetry
      const maxSymmetryValue = filters.maxSymmetry.replace(/_MAX$/i, '');

      const minIdx = symmetryLabels.findIndex(
        (g) => g.toLowerCase() === filters.minSymmetry!.toLowerCase()
      );
      const maxIdx = symmetryLabels.findIndex(
        (g) => g.toLowerCase() === maxSymmetryValue.toLowerCase()
      );
      if (minIdx !== -1 && maxIdx !== -1) {
        where.symmetry = { in: symmetryLabels.slice(minIdx, maxIdx + 1) };
      }
    } else if (filters.minSymmetry) {
      const minIdx = symmetryLabels.findIndex(
        (g) => g.toLowerCase() === filters.minSymmetry!.toLowerCase()
      );
      if (minIdx !== -1) {
        where.symmetry = { in: symmetryLabels.slice(minIdx) };
      }
    } else if (filters.maxSymmetry) {
      // Handle _MAX suffix (means include the best/last value)
      const maxSymmetryValue = filters.maxSymmetry.replace(/_MAX$/i, '');
      const maxIdx = symmetryLabels.findIndex(
        (g) => g.toLowerCase() === maxSymmetryValue.toLowerCase()
      );
      if (maxIdx !== -1) {
        where.symmetry = { in: symmetryLabels.slice(0, maxIdx + 1) };
      }
    }
  }

  // Table percentage filters
  if (filters.minTable !== undefined || filters.maxTable !== undefined) {
    where.tablePercent = {};
    if (filters.minTable !== undefined) {
      where.tablePercent.gte = filters.minTable;
    }
    if (filters.maxTable !== undefined) {
      where.tablePercent.lte = filters.maxTable;
    }
  }

  // Ratio filters (length/width)
  // This requires a calculated field or raw query
  // For now, we'll skip this complex filter

  // Fluorescence filters (ordered from best to worst for diamonds)
  if (filters.minFluorescence || filters.maxFluorescence) {
    const fluorescenceLabels = [
      'Very Strong',
      'Strong',
      'Medium',
      'Faint',
      'None',
    ];

    let minIdx = 0; // Default to Very Strong (worst)
    let maxIdx = fluorescenceLabels.length - 1; // Default to None (best)

    if (filters.minFluorescence) {
      const idx = fluorescenceLabels.findIndex(
        (g) => g.toLowerCase() === filters.minFluorescence!.toLowerCase()
      );
      if (idx !== -1) minIdx = idx;
    }

    if (filters.maxFluorescence) {
      // Handle _MAX suffix (means include the best/last value)
      const maxFluorescenceValue = filters.maxFluorescence.replace(
        /_MAX$/i,
        ''
      );
      const idx = fluorescenceLabels.findIndex(
        (g) => g.toLowerCase() === maxFluorescenceValue.toLowerCase()
      );
      if (idx !== -1) maxIdx = idx;
    }

    // Get the range of valid fluorescence values
    if (minIdx <= maxIdx) {
      where.fluorescenceIntensity = {
        in: fluorescenceLabels.slice(minIdx, maxIdx + 1),
      };
    }
  }

  // Grading lab filter
  if (filters.gradingLab) {
    const labs = filters.gradingLab.split(',');
    where.gradingLab = { in: labs };
  }

  const offset = filters.offset || 0;
  const limit = filters.limit || 100;

  const [data, totalCount] = await Promise.all([
    prisma.diamond.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { totalPrice: 'asc' },
    }),
    prisma.diamond.count({ where }),
  ]);

  return { data, totalCount };
}

export async function createImportJob(type: DiamondType): Promise<string> {
  const job = await prisma.importJob.create({
    data: {
      type,
      status: ImportStatus.PENDING,
    },
  });
  return job.id;
}

export async function updateImportJobStatus(
  jobId: string,
  status: ImportStatus,
  additionalData?: {
    totalRecords?: number;
    processedRecords?: number;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
  }
): Promise<void> {
  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status,
      ...additionalData,
    },
  });
}

export async function clearDiamondsByType(type: DiamondType): Promise<number> {
  const result = await prisma.diamond.deleteMany({
    where: { type },
  });
  return result.count;
}

export async function importDiamondsBatch(
  diamonds: Diamond[],
  type: DiamondType,
  importJobId: string
): Promise<number> {
  let totalImported = 0;

  // Process in optimized batches with delays to avoid overwhelming the database
  for (let i = 0; i < diamonds.length; i += BATCH_SIZE) {
    const batch = diamonds.slice(i, i + BATCH_SIZE);

    // Add memory cleanup hint before processing batch
    if (global.gc) {
      global.gc();
    }

    // Prepare data for batch insert
    const data = batch.map((diamond) => ({
      itemId: diamond.itemId,
      type,
      importJobId,
      supplierStockRef: diamond.supplierStockRef || null,
      cut: diamond.cut || null,
      carat: diamond.carat || null,
      color: diamond.color || null,
      naturalFancyColor: diamond.naturalFancyColor || null,
      naturalFancyColorIntensity: diamond.naturalFancyColorIntensity || null,
      naturalFancyColorOvertone: diamond.naturalFancyColorOvertone || null,
      treatedColor: diamond.treatedColor || null,
      clarity: diamond.clarity || null,
      cutGrade: diamond.cutGrade || null,
      gradingLab: diamond.gradingLab || null,
      certificateNumber: diamond.certificateNumber || null,
      certificatePath: diamond.certificatePath || null,
      certificateUrl: diamond.certificateUrl || null,
      imagePath: diamond.imagePath || null,
      imageUrl: diamond.imageUrl || null,
      onlineReport: diamond.onlineReport || null,
      onlineReportUrl: diamond.onlineReportUrl || null,
      videoUrl: diamond.videoUrl || null,
      threeDViewerUrl: diamond.threeDViewerUrl || null,
      pricePerCarat: diamond.pricePerCarat || null,
      totalPrice: diamond.totalPrice || null,
      totalPriceSek: diamond.totalPriceSek || null,
      percentOffIdexList: diamond.percentOffIdexList || null,
      polish: diamond.polish || null,
      symmetry: diamond.symmetry || null,
      measurementsLength: diamond.measurementsLength || null,
      measurementsWidth: diamond.measurementsWidth || null,
      measurementsHeight: diamond.measurementsHeight || null,
      depthPercent: diamond.depthPercent || null,
      tablePercent: diamond.tablePercent || null,
      crownHeight: diamond.crownHeight || null,
      crownAngle: diamond.crownAngle || null,
      pavilionDepth: diamond.pavilionDepth || null,
      pavilionAngle: diamond.pavilionAngle || null,
      girdleFrom: diamond.girdleFrom || null,
      girdleTo: diamond.girdleTo || null,
      culetSize: diamond.culetSize || null,
      culetCondition: diamond.culetCondition || null,
      graining: diamond.graining || null,
      fluorescenceIntensity: diamond.fluorescenceIntensity || null,
      fluorescenceColor: diamond.fluorescenceColor || null,
      enhancement: diamond.enhancement || null,
      country: diamond.country || null,
      countryCode: diamond.countryCode || null,
      countryName: diamond.countryName || null,
      stateRegion: diamond.stateRegion || null,
      stateCode: diamond.stateCode || null,
      stateName: diamond.stateName || null,
      pairStockRef: diamond.pairStockRef || null,
      pairSeparable: diamond.pairSeparable?.toString() || null,
      askingPriceForPair: diamond.askingPriceForPair || null,
      askingPricePerCaratForPair: diamond.askingPricePerCaratForPair || null,
      shade: diamond.shade || null,
      milky: diamond.milky || null,
      blackInclusion: diamond.blackInclusion || null,
      eyeClean: diamond.eyeClean || null,
      provenanceReport: diamond.provenanceReport || null,
      provenanceNumber: diamond.provenanceNumber || null,
      brand: diamond.brand || null,
      guaranteedAvailability: diamond.guaranteedAvailability || null,
      availability: diamond.availability || null,
    }));

    // Use createMany with skipDuplicates to handle potential duplicates
    const result = await prisma.diamond.createMany({
      data,
      skipDuplicates: true,
    });

    totalImported += result.count;

    // Update progress
    await updateImportJobStatus(importJobId, ImportStatus.IN_PROGRESS, {
      processedRecords: totalImported,
    });

    console.log(
      `Imported batch ${Math.floor(i / BATCH_SIZE) + 1}, total imported: ${totalImported}`
    );

    // Add small delay between batches to reduce memory pressure (50ms = good balance)
    if (i + BATCH_SIZE < diamonds.length) {
      await new Promise((resolve) => setTimeout(resolve, 50)); // Increased delay
    }
  }

  return totalImported;
}

export async function getLatestExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  const rate = await prisma.exchangeRate.findFirst({
    where: {
      fromCurrency,
      toCurrency,
      OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
    },
    orderBy: { validFrom: 'desc' },
  });

  return rate?.rate || null;
}

export async function saveExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rate: number
): Promise<void> {
  // Invalidate previous rates
  await prisma.exchangeRate.updateMany({
    where: {
      fromCurrency,
      toCurrency,
      validUntil: null,
    },
    data: {
      validUntil: new Date(),
    },
  });

  // Create new rate
  await prisma.exchangeRate.create({
    data: {
      fromCurrency,
      toCurrency,
      rate,
    },
  });
}
