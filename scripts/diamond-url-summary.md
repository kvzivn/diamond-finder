# Diamond URL Analysis Summary

## Overview

We analyzed the IDEX API diamond data in both "basis" and "extended" formats:

- **Natural Diamonds (Extended Format)**: 70.6% have video URLs, 41.5% have 3D viewer URLs
- **Lab Diamonds**: 37.9% have video URLs, 7.7% have 3D viewer URLs

## Key Findings

### Natural Diamonds (Extended Format)
- Total analyzed: 50,000 diamonds
- **35,285 (70.6%)** have video URLs
- **20,755 (41.5%)** have 3D viewer URLs
- **20,749 (41.5%)** have both video and 3D URLs

### Lab-Grown Diamonds
- Total analyzed: 50,000 diamonds
- **18,945 (37.9%)** have video URLs
- **3,865 (7.7%)** have 3D viewer URLs
- **2,639 (5.3%)** have both video and 3D URLs

## URL Types and Providers

### Video URLs
These appear to be hosted on various platforms:
1. **Amazon S3 buckets** (e.g., `nivoda-inhousemedia.s3.amazonaws.com`)
2. **Azure blob storage** (e.g., `storageweweb.blob.core.windows.net`)
3. **Custom diamond viewing platforms** (e.g., `v360.in`, `vv360.in`)
4. **Company-specific platforms** (e.g., `visionpts.com`, `akarshexports.com`)

### 3D Viewer URLs
These provide interactive 360-degree views:
1. **Specialized 3D viewing platforms** (e.g., `v360.diamonds`, `diamonds360.in`)
2. **Company-hosted viewers** (e.g., `www.labgrownforever.com`)
3. **Cloud-hosted solutions** (e.g., `diamdna.azureedge.net`)

## Example URLs

### Natural Diamond Examples:
```
Video: https://d-videos.s3.amazonaws.com/U200027.mp4
Video: https://nivoda-inhousemedia.s3.amazonaws.com/[diamond-id].mp4
3D Viewer: https://vv360.in/[viewer-params]
3D Viewer: https://diamdna.azureedge.net/[diamond-viewer]
```

### Lab Diamond Examples:
```
Video: https://visionpts.com/[diamond-video]
Video: https://vaishali.diamx.net/[video-id]
3D Viewer: https://www.labgrownforever.com/[3d-viewer]
3D Viewer: https://video.diamondasset.in/[viewer]
```

## Integration Recommendations

1. **Update IDEX Service**: Switch from `format_20220525_basis` to `format_20230628_extended` for natural diamonds to get Video and 3D URLs

2. **Database Schema**: The Diamond model already has `videoUrl` and `threeDViewerUrl` fields, so no schema changes needed

3. **Frontend Display**: 
   - Add video player component for MP4 videos
   - Add iframe support for 3D viewers
   - Handle different URL formats gracefully

4. **Performance Considerations**:
   - Video/3D content should be loaded on-demand
   - Consider lazy loading for better performance
   - Some URLs may require authentication or have CORS restrictions

## Next Steps

1. Update the IDEX service to use extended format for natural diamonds
2. Test sample URLs to understand embed requirements
3. Design UI components for video/3D viewing
4. Handle cases where URLs may be expired or restricted