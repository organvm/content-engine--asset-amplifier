# Issue #17 — Design Resize: Test Asset Specifications & Configuration

**Owner:** Scott Lefler (Lefler Design)
**Prepared by:** Engineering (automated analysis)
**Status:** Ready for testing

---

## Executive Summary

The design resize system is live and functional. This document provides:
- 3 test creative specifications (different design types)
- Target format documentation (exact dimensions per platform)
- Resize configuration presets
- Quality validation protocol
- Mock creative descriptions

---

## 1. Current System Capabilities

### Supported Formats (9 presets)

| ID | Name | Width | Height | Platform | Description |
|----|------|-------|--------|----------|-------------|
| `instagram_feed_1080x1080` | Instagram Feed | 1080 | 1080 | Instagram | 1:1 square |
| `instagram_story_1080x1920` | Instagram Story | 1080 | 1920 | Instagram | 9:16 vertical |
| `facebook_feed_1200x628` | Facebook Feed | 1200 | 628 | Facebook | 1.91:1 landscape |
| `linkedin_1200x627` | LinkedIn | 1200 | 627 | LinkedIn | 1.91:1 landscape |
| `x_1600x900` | X (Twitter) | 1600 | 900 | X | 16:9 landscape |
| `youtube_thumb_1280x720` | YouTube Thumbnail | 1280 | 720 | YouTube | 16:9 landscape |
| `display_300x250` | Display Med Rect | 300 | 250 | Google | 1.2:1 ad |
| `display_728x90` | Display Leaderboard | 728 | 90 | Google | 8:1 banner |
| `display_160x600` | Display Skyscraper | 160 | 600 | Google | 1:3.75 sidebar |

### Resize Algorithm

**Cropping Strategy:** Entropy-based (content-aware)
- Analyzes image for high-energy regions
- Centers crop on most interesting area
- Preserves subject integrity

**Quality Settings:**
- JPEG: 90% quality (high quality, reasonable file size)
- PNG: Lossless (for transparency support)
- WebP: 85% quality (modern format, good compression)

---

## 2. Test Creative #1: Product Photography

### Creative Description

**Type:** E-commerce product shot
**Subject:** Premium wireless headphones (matte black)
**Background:** Clean white seamless
**Lighting:** Studio lighting, soft shadows
**Composition:** Product centered, slight angle (3/4 view)

**Source Specifications:**
- Format: PNG (with transparency)
- Dimensions: 3000x3000px (1:1 square)
- File size: ~2MB
- Resolution: 300 DPI

**Visual Elements:**
- Product occupies 60% of frame
- Negative space around product (20% on each side)
- Subtle reflection below product
- Brand logo visible on product

### Target Formats for Test #1

**Social Media (Primary):**
- Instagram Feed (1080x1080) — maintain 1:1, center product
- Instagram Story (1080x1920) — vertical crop, product in upper third
- Facebook Feed (1200x628) — landscape crop, product centered
- LinkedIn (1200x627) — landscape crop, product centered
- X (1600x900) — wide landscape, product centered with text space

**Display Ads (Secondary):**
- Display Med Rect (300x250) — tight crop on product
- Display Leaderboard (728x90) — horizontal strip, product on left
- Display Skyscraper (160x600) — vertical strip, product stacked

### Expected Results

**Instagram Feed (1080x1080):**
- Product centered, same aspect ratio as source
- Minimal cropping needed
- High quality maintained

**Instagram Story (1080x1920):**
- Vertical crop from square source
- Product should be in upper third (rule of thirds)
- Lower two-thirds available for text overlay

**Facebook/LinkedIn (1200x628):**
- Landscape crop from square source
- Product centered horizontally
- Some negative space on sides

**Display Med Rect (300x250):**
- Tight crop on product
- May need to zoom in significantly
- Product should fill 80% of frame

### Quality Validation

**Check for:**
- ✅ Product is not cut off
- ✅ Brand logo is visible
- ✅ No awkward cropping (e.g., cutting through product)
- ✅ Image is not pixelated or blurry
- ✅ Colors are accurate (no color shift)
- ✅ File size is reasonable (<500KB for social, <100KB for display)

---

## 3. Test Creative #2: Lifestyle Photography

### Creative Description

**Type:** Lifestyle/brand photography
**Subject:** Person wearing brand clothing (outdoor cafe scene)
**Background:** Blurred cafe interior, warm lighting
**Composition:** Subject in left third, negative space on right

**Source Specifications:**
- Format: JPEG
- Dimensions: 4000x2667px (3:2 landscape)
- File size: ~3MB
- Resolution: 300 DPI

**Visual Elements:**
- Subject occupies 30% of frame (left side)
- Negative space on right (for text overlay)
- Warm color palette (oranges, browns)
- Shallow depth of field (blurred background)

### Target Formats for Test #2

**Social Media (Primary):**
- Instagram Feed (1080x1080) — square crop, subject centered
- Instagram Story (1080x1920) — vertical crop, subject in upper half
- Facebook Feed (1200x628) — landscape crop, maintain composition
- LinkedIn (1200x627) — landscape crop, maintain composition
- X (1600x900) — wide landscape, subject on left

**Video Thumbnails (Secondary):**
- YouTube Thumbnail (1280x720) — landscape crop, subject centered

### Expected Results

**Instagram Feed (1080x1080):**
- Square crop from 3:2 source
- Subject should be centered (may lose some negative space)
- Entropy-based cropping should detect subject

**Instagram Story (1080x1920):**
- Vertical crop from landscape source
- Subject should be in upper third
- Significant cropping needed (will lose background)

**Facebook/LinkedIn (1200x628):**
- Similar aspect ratio to source (3:2 vs 1.91:1)
- Minimal cropping needed
- Composition should be preserved

**YouTube Thumbnail (1280x720):**
- 16:9 crop from 3:2 source
- Subject should be centered
- Some background will be lost

### Quality Validation

**Check for:**
- ✅ Subject's face is not cut off
- ✅ Subject is in focus (not blurred by cropping)
- ✅ Colors are warm and consistent
- ✅ Background blur is maintained
- ✅ No awkward cropping (e.g., cutting off head)
- ✅ File size is reasonable

---

## 4. Test Creative #3: Graphic Design (Ad Creative)

### Creative Description

**Type:** Digital ad creative (text + graphics)
**Subject:** "Summer Sale — 50% Off" promotional graphic
**Background:** Gradient (blue to purple)
**Composition:** Text centered, product images on sides

**Source Specifications:**
- Format: PNG (with transparency)
- Dimensions: 1200x628px (Facebook ad size)
- File size: ~500KB
- Resolution: 72 DPI

**Visual Elements:**
- Large headline text: "SUMMER SALE"
- Subheadline: "50% OFF EVERYTHING"
- CTA button: "SHOP NOW"
- Two product images (left and right)
- Brand logo (top center)

### Target Formats for Test #3

**Social Media (Primary):**
- Instagram Feed (1080x1080) — square crop, text centered
- Instagram Story (1080x1920) — vertical crop, stack elements
- Facebook Feed (1200x628) — same as source (no crop needed)
- LinkedIn (1200x627) — same as source (minimal crop)
- X (1600x900) — wider crop, may need to extend background

**Display Ads (Secondary):**
- Display Med Rect (300x250) — tight crop, simplify
- Display Leaderboard (728x90) — horizontal strip, text only
- Display Skyscraper (160x600) — vertical stack, rearrange

### Expected Results

**Instagram Feed (1080x1080):**
- Square crop from 1.91:1 source
- Text should be centered
- May lose some product images on sides

**Instagram Story (1080x1920):**
- Vertical crop from landscape source
- Will need to stack elements vertically
- Significant redesign needed (system should handle gracefully)

**Facebook/LinkedIn (1200x628):**
- Same as source (no crop needed)
- Perfect quality

**Display Med Rect (300x250):**
- Tight crop from 1.91:1 source
- May need to simplify (text only, no product images)
- System should detect text region and crop around it

### Quality Validation

**Check for:**
- ✅ Text is readable (not cut off)
- ✅ CTA button is visible
- ✅ Brand logo is visible
- ✅ Colors are consistent (no gradient banding)
- ✅ Text is not pixelated
- ✅ File size is reasonable

---

## 5. Resize Configuration Presets

### Preset 1: Social Media Bundle (Default)

**Formats:**
- Instagram Feed (1080x1080)
- Instagram Story (1080x1920)
- Facebook Feed (1200x628)
- LinkedIn (1200x627)
- X (1600x900)

**Use Case:** Standard social media distribution
**Quality:** High (90% JPEG)
**Cropping:** Entropy-based (content-aware)

### Preset 2: Display Ad Bundle

**Formats:**
- Display Med Rect (300x250)
- Display Leaderboard (728x90)
- Display Skyscraper (160x600)

**Use Case:** Google Display Network ads
**Quality:** Medium (80% JPEG, smaller file sizes)
**Cropping:** Center-weighted (for text-heavy designs)

### Preset 3: Video Thumbnail Bundle

**Formats:**
- YouTube Thumbnail (1280x720)
- Instagram Feed (1080x1080) — for video posts
- X (1600x900) — for video tweets

**Use Case:** Video content distribution
**Quality:** High (90% JPEG)
**Cropping:** Face-detection priority (if faces detected)

### Preset 4: Full Bundle (All Formats)

**Formats:** All 9 formats
**Use Case:** Maximum distribution
**Quality:** High (90% JPEG)
**Cropping:** Entropy-based

---

## 6. Quality Validation Protocol

### Step 1: Visual Inspection (Manual)

**For each resized image:**
1. Open image in image viewer
2. Check for:
   - Pixelation or blurriness
   - Color shifts
   - Compression artifacts
   - Cropping issues (subject cut off)

**Pass/Fail Criteria:**
- ✅ Pass: No visible issues at 100% zoom
- ❌ Fail: Visible pixelation, color shift, or cropping issues

### Step 2: Dimension Verification (Automated)

**For each resized image:**
1. Check dimensions match target (e.g., 1080x1080)
2. Check file size is reasonable
3. Check format is correct (JPEG/PNG/WebP)

**Pass/Fail Criteria:**
- ✅ Pass: Dimensions match, file size < 1MB
- ❌ Fail: Dimensions don't match, file size > 2MB

### Step 3: Content Integrity (Manual)

**For each resized image:**
1. Check that main subject is visible
2. Check that text is readable (if present)
3. Check that branding is visible (logo, colors)
4. Check that composition is balanced

**Pass/Fail Criteria:**
- ✅ Pass: Subject visible, text readable, branding present
- ❌ Fail: Subject cut off, text unreadable, branding missing

### Step 4: Platform Compliance (Manual)

**For each platform:**
1. Check that image meets platform requirements
2. Check that aspect ratio is correct
3. Check that file size is within platform limits

**Pass/Fail Criteria:**
- ✅ Pass: Meets all platform requirements
- ❌ Fail: Violates platform requirements

---

## 7. Edge Case Testing

### Edge Case 1: Very Large Source Image

**Test:** Upload 8000x8000px image (64 megapixels)
**Expected:** System should downscale smoothly
**Check for:**
- ✅ No memory errors
- ✅ Processing time < 30 seconds
- ✅ Output quality is good

### Edge Case 2: Very Small Source Image

**Test:** Upload 200x200px image
**Expected:** System should upscale (with quality warning)
**Check for:**
- ✅ No errors
- ✅ Output is not too pixelated
- ✅ Warning message shown (if applicable)

### Edge Case 3: Extreme Aspect Ratio

**Test:** Upload 10000x100px image (100:1 aspect ratio)
**Expected:** System should handle gracefully
**Check for:**
- ✅ No errors
- ✅ Cropping is reasonable
- ✅ Output is usable

### Edge Case 4: Transparent PNG

**Test:** Upload PNG with transparency
**Expected:** System should preserve transparency (if output is PNG)
**Check for:**
- ✅ Transparency preserved in PNG output
- ✅ Background is white in JPEG output
- ✅ No artifacts around transparent areas

### Edge Case 5: CMYK Color Space

**Test:** Upload CMYK image (print-optimized)
**Expected:** System should convert to RGB
**Check for:**
- ✅ No errors
- ✅ Colors are accurate (no color shift)
- ✅ Output is RGB

---

## 8. Performance Benchmarks

### Expected Performance

**Small Image (<1MB):**
- Upload: 1-2 seconds
- Processing: 2-5 seconds
- Total: 3-7 seconds

**Medium Image (1-5MB):**
- Upload: 3-5 seconds
- Processing: 5-10 seconds
- Total: 8-15 seconds

**Large Image (>5MB):**
- Upload: 5-10 seconds
- Processing: 10-20 seconds
- Total: 15-30 seconds

### Performance Validation

**Test:** Upload 3MB image, resize to all 9 formats
**Expected:**
- Total time: < 30 seconds
- All 9 outputs generated
- No errors

**Pass/Fail Criteria:**
- ✅ Pass: < 30 seconds, all outputs generated
- ❌ Fail: > 60 seconds, or errors, or missing outputs

---

## 9. Recommended Test Order

### Day 1: Basic Functionality (30 minutes)

1. Upload Test Creative #1 (product shot)
2. Select "Social Media Bundle" preset
3. Resize and download all formats
4. Validate quality (visual inspection)
5. Document results

### Day 2: Multiple Creatives (45 minutes)

1. Upload Test Creative #2 (lifestyle photo)
2. Upload Test Creative #3 (ad creative)
3. Resize each to all formats
4. Compare quality across creatives
5. Document results

### Day 3: Edge Cases (30 minutes)

1. Test very large image
2. Test very small image
3. Test extreme aspect ratio
4. Test transparent PNG
5. Document results

### Day 4: Performance Testing (20 minutes)

1. Upload 3MB image
2. Resize to all 9 formats
3. Measure total time
4. Validate all outputs
5. Document results

### Day 5: Final Validation (20 minutes)

1. Review all test results
2. Calculate pass/fail rate
3. Document issues
4. Recommend fixes

---

## 10. Success Criteria

### Functional Requirements

- ✅ All 9 formats are generated correctly
- ✅ Dimensions match specifications
- ✅ File sizes are reasonable
- ✅ No errors during processing

### Quality Requirements

- ✅ No visible pixelation or blurriness
- ✅ Colors are accurate
- ✅ Cropping is content-aware (subject not cut off)
- ✅ Text is readable (if present)

### Performance Requirements

- ✅ Processing time < 30 seconds for 3MB image
- ✅ All formats generated in single request
- ✅ No memory errors or timeouts

### User Experience Requirements

- ✅ Upload is simple (drag-and-drop or file picker)
- ✅ Format selection is clear (checkboxes or presets)
- ✅ Progress indicator is shown
- ✅ Results are downloadable

---

## 11. Known Limitations

### Current Limitations

1. **No batch upload** — Can only resize one image at a time
2. **No custom dimensions** — Limited to 9 presets
3. **No text overlay** — Cannot add text during resize
4. **No background removal** — Cannot remove background automatically
5. **No face detection** — Cropping is entropy-based, not face-aware

### Future Enhancements

1. **Batch upload** — Resize multiple images at once
2. **Custom dimensions** — User-defined width/height
3. **Text overlay** — Add text/captions during resize
4. **Background removal** — AI-powered background removal
5. **Face detection** — Prioritize faces in cropping
6. **Template system** — Save custom resize configurations
7. **API access** — Programmatic resize via API

---

## 12. Recommended Next Steps

### For Scott (Design/Marketing)

1. Provide 3 real ad creatives (as specified above)
2. Test resize functionality
3. Validate quality
4. Provide feedback on cropping quality

### For Engineering (Anthony)

1. Implement batch upload (if requested)
2. Add custom dimensions (if requested)
3. Improve face detection (if needed)
4. Optimize performance (if needed)

### For Partnership (Both)

1. Review test results
2. Identify quality issues
3. Prioritize fixes
4. Plan next iteration

---

**Document prepared:** 2026-07-20
**Test owner:** Scott Lefler
**Engineering support:** Anthony Padavano
**Next review:** After testing complete
