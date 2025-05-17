const mockDiamonds = [
  {
    "id": "499b981b-5323-446c-97b7-0c31081fa2e8",
    "type": "Natural", // Added for filtering
    "title": "0.73ct Round Natural Diamond (Colour G, Clarity VS2, Cut EX)",
    "detailPageTitle": "0.73ct Round Natural Diamond",
    "subtitle": [
      { "label": "Colour", "value": "G" },
      { "label": "Clarity", "value": "VS2" },
      { "label": "Cut", "value": "EX" }
    ],
    "description_html": "<ul><li>Type: Natural Diamond</li><li>Shape: Round</li><li>Carat: 0.73</li><li>Colour: G</li><li>Clarity: VS2</li><li>Cut: Excellent</li><li>Polish: Excellent</li><li>Symmetry: Excellent</li><li>Fluorescence: Strong</li><li>Measurements: 5.71x5.73x3.57mm</li><li>L/W Ratio: 1</li><li>Table: 57%</li><li>Depth: 62.5%</li><li>Certificate: IGI</li></ul>",
    "topImage": "https://d2rlicyi7sudqr.cloudfront.net/aHR0cHM6Ly9uaXZvZGEtaW5ob3VzZW1lZGlhLnMzLmFtYXpvbmF3cy5jb20vaW5ob3VzZS0zNjAtNjcwNDE3NjY4/0.webp",
    "price": 1949,
    "currency": "SEK", // Added for display
    "certificate": {
      "lab": "IGI",
      "shape": "ROUND",
      "carats": 0.73,
      "color": "G",
      "clarity": "VS2",
      "cut_grade": "EX", // Renamed from cut for consistency
      "polish": "Excellent", // Added from description
      "symmetry": "Excellent", // Added from description
      "fluorescence": "Strong", // Added from description
      "table_percent": 57, // Added from description
      "depth_percent": 62.5, // Added from description
      "lw_ratio": 1 // Added from description
    }
  },
  {
    "id": "1e666a29-6e83-418d-b8f6-da4e0006cae3",
    "type": "Natural", // Added for filtering
    "title": "0.70ct Round Natural Diamond (Colour G, Clarity VS1, Cut EX)",
    "detailPageTitle": "0.70ct Round Natural Diamond",
    "subtitle": [
      { "label": "Colour", "value": "G" },
      { "label": "Clarity", "value": "VS1" },
      { "label": "Cut", "value": "EX" }
    ],
    "description_html": "<ul><li>Type: Natural Diamond</li><li>Shape: Round</li><li>Carat: 0.70</li><li>Colour: G</li><li>Clarity: VS1</li><li>Cut: Excellent</li><li>Polish: Excellent</li><li>Symmetry: Excellent</li><li>Fluorescence: Faint</li><li>Measurements: 5.6x5.66x3.55mm</li><li>L/W Ratio: 0.99</li><li>Table: 57%</li><li>Depth: 63.2%</li><li>Certificate: IGI</li></ul>",
    "topImage": "https://d2rlicyi7sudqr.cloudfront.net/aHR0cHM6Ly92MzYwLmluL2RldGFpbC8xNTM2XzI3NS01NC0xOQ==/163.webp",
    "price": 1974,
    "currency": "SEK", // Added for display
    "certificate": {
      "lab": "IGI",
      "shape": "ROUND",
      "carats": 0.70,
      "color": "G",
      "clarity": "VS1",
      "cut_grade": "EX", // Renamed from cut for consistency
      "polish": "Excellent", // Added from description
      "symmetry": "Excellent", // Added from description
      "fluorescence": "Faint", // Added from description
      "table_percent": 57, // Added from description
      "depth_percent": 63.2, // Added from description
      "lw_ratio": 0.99 // Added from description
    }
  },
  {
    "id": "84715793-aba3-46fa-87ce-18c8dcc5c872",
    "type": "Natural", // Added for filtering
    "title": "0.70ct Emerald Natural Diamond (Colour G, Clarity VVS2)",
    "detailPageTitle": "0.70ct Emerald Natural Diamond",
    "subtitle": [
      { "label": "Colour", "value": "G" },
      { "label": "Clarity", "value": "VVS2" }
    ],
    "description_html": "<ul><li>Type: Natural Diamond</li><li>Shape: Emerald</li><li>Carat: 0.70</li><li>Colour: G</li><li>Clarity: VVS2</li><li>Cut: N/A</li><li>Polish: Excellent</li><li>Symmetry: Excellent</li><li>Fluorescence: Faint</li><li>Measurements: 5.66x4.22x2.88mm</li><li>L/W Ratio: 1.34</li><li>Table: 65%</li><li>Depth: 68.2%</li><li>Certificate: GIA</li></ul>",
    "topImage": "https://d2rlicyi7sudqr.cloudfront.net/aHR0cHM6Ly92djM2MC5pbi9WaXNpb24zNjAuaHRtbD9kPUsxMTAtNjlB/15.webp",
    "price": 1976,
    "currency": "SEK", // Added for display
    "certificate": {
      "lab": "GIA",
      "shape": "EMERALD",
      "carats": 0.70,
      "color": "G",
      "clarity": "VVS2",
      "cut_grade": null, // Renamed from cut for consistency
      "polish": "Excellent", // Added from description
      "symmetry": "Excellent", // Added from description
      "fluorescence": "Faint", // Added from description
      "table_percent": 65, // Added from description
      "depth_percent": 68.2, // Added from description
      "lw_ratio": 1.34 // Added from description
    }
  },
  // Add a Lab Grown example
  {
    "id": "synthetic-diamond-1",
    "type": "Lab Grown", // Added for filtering
    "title": "1.05ct Round Lab Grown Diamond (Colour D, Clarity VVS1, Cut IDEAL)",
    "detailPageTitle": "1.05ct Round Lab Grown Diamond",
    "subtitle": [
      { "label": "Colour", "value": "D" },
      { "label": "Clarity", "value": "VVS1" },
      { "label": "Cut", "value": "IDEAL" }
    ],
    "description_html": "<ul><li>Type: Lab Grown Diamond</li><li>Shape: Round</li><li>Carat: 1.05</li><li>Colour: D</li><li>Clarity: VVS1</li><li>Cut: Ideal</li><li>Polish: Ideal</li><li>Symmetry: Ideal</li><li>Fluorescence: None</li><li>Measurements: 6.50x6.52x4.00mm</li><li>L/W Ratio: 1</li><li>Table: 58%</li><li>Depth: 61.5%</li><li>Certificate: IGI</li></ul>",
    "topImage": "https://d2rlicyi7sudqr.cloudfront.net/aHR0cHM6Ly9uaXZvZGEtaW5ob3VzZW1lZGlhLnMzLmFtYXpvbmF3cy5jb20vaW5ob3VzZS0zNjAtNjcwNDE3NjY4/0.webp", // Placeholder image
    "price": 2500,
    "currency": "SEK",
    "certificate": {
      "lab": "IGI",
      "shape": "ROUND",
      "carats": 1.05,
      "color": "D",
      "clarity": "VVS1",
      "cut_grade": "IDEAL",
      "polish": "Ideal",
      "symmetry": "Ideal",
      "fluorescence": "None",
      "table_percent": 58,
      "depth_percent": 61.5,
      "lw_ratio": 1
    }
  }
];

// Make it available for import in other scripts
if (typeof window !== 'undefined') {
  window.diamondData = mockDiamonds;
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = mockDiamonds;
}