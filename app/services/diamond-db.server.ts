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

const BATCH_SIZE = 1000; // PostgreSQL can handle larger batches

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

  // Colour filters (complex logic requires raw query or multiple conditions)
  if (filters.minColour || filters.maxColour) {
    const colourLabels = ['K', 'J', 'I', 'H', 'G', 'F', 'E', 'D'];
    const colorConditions: string[] = [];

    if (filters.minColour) {
      const minIndex = colourLabels.indexOf(filters.minColour.toUpperCase());
      if (minIndex !== -1) {
        const validColors = colourLabels.slice(0, minIndex + 1);
        colorConditions.push(
          `color IN (${validColors.map((c) => `'${c}'`).join(',')})`
        );
      }
    }

    if (filters.maxColour) {
      const maxIndex = colourLabels.indexOf(filters.maxColour.toUpperCase());
      if (maxIndex !== -1) {
        const validColors = colourLabels.slice(maxIndex);
        if (colorConditions.length > 0) {
          // Need intersection of both conditions
          where.color = {
            in: colourLabels.slice(
              maxIndex,
              filters.minColour
                ? colourLabels.indexOf(filters.minColour.toUpperCase()) + 1
                : undefined
            ),
          };
        } else {
          where.color = { in: validColors };
        }
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
              { naturalFancyColor: { contains: 'salt', mode: 'insensitive' } },
              {
                naturalFancyColor: { contains: 'pepper', mode: 'insensitive' },
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

    // Apply fancy color conditions
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

    // Intensity filters would require similar complex logic
    // For now, keeping them as simple contains queries
    if (filters.minFancyIntensity || filters.maxFancyIntensity) {
      const intensityCondition: Prisma.DiamondWhereInput = {};
      if (filters.minFancyIntensity) {
        intensityCondition.naturalFancyColorIntensity = {
          contains: filters.minFancyIntensity,
          mode: 'insensitive',
        };
      }
      if (!where.AND) {
        where.AND = [];
      } else if (!Array.isArray(where.AND)) {
        where.AND = [where.AND];
      }
      (where.AND as Prisma.DiamondWhereInput[]).push(intensityCondition);
    }
  }

  // Clarity filters
  if (filters.minClarity || filters.maxClarity) {
    const clarityLabels = [
      'SI2',
      'SI1',
      'VS2',
      'VS1',
      'VVS2',
      'VVS1',
      'IF',
      'FL',
    ];

    if (filters.minClarity && filters.maxClarity) {
      const minIdx = clarityLabels.indexOf(filters.minClarity.toUpperCase());
      const maxIdx = clarityLabels.indexOf(filters.maxClarity.toUpperCase());
      if (minIdx !== -1 && maxIdx !== -1) {
        where.clarity = { in: clarityLabels.slice(minIdx, maxIdx + 1) };
      }
    } else if (filters.minClarity) {
      const minIdx = clarityLabels.indexOf(filters.minClarity.toUpperCase());
      if (minIdx !== -1) {
        where.clarity = { in: clarityLabels.slice(minIdx) };
      }
    } else if (filters.maxClarity) {
      const maxIdx = clarityLabels.indexOf(filters.maxClarity.toUpperCase());
      if (maxIdx !== -1) {
        where.clarity = { in: clarityLabels.slice(0, maxIdx + 1) };
      }
    }
  }

  // Cut Grade filters
  if (filters.minCutGrade || filters.maxCutGrade) {
    const cutGradeLabels = ['Good', 'Very Good', 'Excellent'];

    if (filters.minCutGrade && filters.maxCutGrade) {
      const minIdx = cutGradeLabels.findIndex(
        (g) => g.toLowerCase() === filters.minCutGrade!.toLowerCase()
      );
      const maxIdx = cutGradeLabels.findIndex(
        (g) => g.toLowerCase() === filters.maxCutGrade!.toLowerCase()
      );
      if (minIdx !== -1 && maxIdx !== -1) {
        where.cutGrade = { in: cutGradeLabels.slice(minIdx, maxIdx + 1) };
      }
    } else if (filters.minCutGrade) {
      const minIdx = cutGradeLabels.findIndex(
        (g) => g.toLowerCase() === filters.minCutGrade!.toLowerCase()
      );
      if (minIdx !== -1) {
        where.cutGrade = { in: cutGradeLabels.slice(minIdx) };
      }
    } else if (filters.maxCutGrade) {
      const maxIdx = cutGradeLabels.findIndex(
        (g) => g.toLowerCase() === filters.maxCutGrade!.toLowerCase()
      );
      if (maxIdx !== -1) {
        where.cutGrade = { in: cutGradeLabels.slice(0, maxIdx + 1) };
      }
    }
  }

  // Polish filters
  if (filters.minPolish || filters.maxPolish) {
    const polishLabels = ['Good', 'Very Good', 'Excellent'];

    if (filters.minPolish && filters.maxPolish) {
      const minIdx = polishLabels.findIndex(
        (g) => g.toLowerCase() === filters.minPolish!.toLowerCase()
      );
      const maxIdx = polishLabels.findIndex(
        (g) => g.toLowerCase() === filters.maxPolish!.toLowerCase()
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
      const maxIdx = polishLabels.findIndex(
        (g) => g.toLowerCase() === filters.maxPolish!.toLowerCase()
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
      const minIdx = symmetryLabels.findIndex(
        (g) => g.toLowerCase() === filters.minSymmetry!.toLowerCase()
      );
      const maxIdx = symmetryLabels.findIndex(
        (g) => g.toLowerCase() === filters.maxSymmetry!.toLowerCase()
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
      const maxIdx = symmetryLabels.findIndex(
        (g) => g.toLowerCase() === filters.maxSymmetry!.toLowerCase()
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

  // Fluorescence filters
  if (filters.minFluorescence || filters.maxFluorescence) {
    const fluorescenceLabels = [
      'None',
      'Faint',
      'Medium',
      'Strong',
      'Very Strong',
    ];

    if (filters.minFluorescence && filters.maxFluorescence) {
      const minIdx = fluorescenceLabels.findIndex(
        (g) => g.toLowerCase() === filters.minFluorescence!.toLowerCase()
      );
      const maxIdx = fluorescenceLabels.findIndex(
        (g) => g.toLowerCase() === filters.maxFluorescence!.toLowerCase()
      );
      if (minIdx !== -1 && maxIdx !== -1) {
        where.fluorescenceIntensity = {
          in: fluorescenceLabels.slice(minIdx, maxIdx + 1),
        };
      }
    } else if (filters.minFluorescence) {
      const minIdx = fluorescenceLabels.findIndex(
        (g) => g.toLowerCase() === filters.minFluorescence!.toLowerCase()
      );
      if (minIdx !== -1) {
        where.fluorescenceIntensity = { in: fluorescenceLabels.slice(minIdx) };
      }
    } else if (filters.maxFluorescence) {
      const maxIdx = fluorescenceLabels.findIndex(
        (g) => g.toLowerCase() === filters.maxFluorescence!.toLowerCase()
      );
      if (maxIdx !== -1) {
        where.fluorescenceIntensity = {
          in: fluorescenceLabels.slice(0, maxIdx + 1),
        };
      }
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

  // Process in batches to avoid overwhelming the database
  for (let i = 0; i < diamonds.length; i += BATCH_SIZE) {
    const batch = diamonds.slice(i, i + BATCH_SIZE);

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
