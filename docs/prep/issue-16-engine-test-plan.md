# Issue #16 — Engine Test Plan: Comprehensive Evaluation Protocol

**Owner:** Scott Lefler (Lefler Design)
**Prepared by:** Engineering (automated analysis)
**Status:** Ready for testing

---

## Executive Summary

The content engine is live and functional. This document provides a comprehensive test protocol for evaluating the system with real assets, including:
- Step-by-step testing procedures
- Platform-specific evaluation rubrics
- Sample asset specifications
- Feedback templates
- Edge case scenarios
- Success metrics

---

## 1. Test Environment Setup

### Prerequisites

**Dashboard Access:**
- URL: http://localhost:5173 (local dev)
- API health: http://localhost:3000/health (local dev)
- Test brand: Create or use existing brand in the system

**Required Accounts:**
- At least one brand configured in the system
- API keys configured (Settings page)
- At least one asset uploaded successfully

**Browser Requirements:**
- Chrome/Firefox/Safari (latest versions)
- Mobile device or responsive mode (for mobile testing)
- Screen recording tool (optional, for capturing issues)

---

## 2. Test Asset Specifications

### Asset Type 1: Product Shot (Static Image)

**Recommended Source:**
- High-resolution product photography (3000x3000px or larger)
- Professional lighting, clean background
- Product centered with negative space

**Test Scenarios:**
- Square format (1:1) — tests Instagram feed optimization
- Landscape format (16:9) — tests LinkedIn/Twitter optimization
- Portrait format (9:16) — tests Instagram Story/TikTok optimization

**Expected Output:**
- 5 platform variants (Instagram, LinkedIn, X, TikTok, YouTube Shorts)
- Each variant should have platform-appropriate dimensions
- Captions should reference the product and brand voice

**What to Look For:**
- Does the system correctly identify the product?
- Are captions brand-consistent (tone, vocabulary)?
- Are hashtags relevant and platform-appropriate?
- Is the CTA clear and actionable?

### Asset Type 2: Hero Video (Short-form)

**Recommended Source:**
- 30-60 second video (1080p or 4K)
- Multiple scenes/shots
- Clear brand messaging or product demonstration
- Professional production quality

**Test Scenarios:**
- Product demo video — tests extraction of key moments
- Brand story video — tests narrative extraction
- Tutorial/how-to video — tests step-by-step extraction

**Expected Output:**
- 10-15 video fragments (clips)
- 30-90 posts across 5 platforms
- Each post should have a unique angle/hook

**What to Look For:**
- Are the extracted moments high-energy/interesting?
- Do captions vary by platform (LinkedIn = professional, TikTok = casual)?
- Are video clips the right length for each platform?
- Is the brand identity consistent across all outputs?

### Asset Type 3: 3D Render (Complex Visual)

**Recommended Source:**
- Architectural visualization or product render
- Multiple angles/views
- High detail and texture
- Professional lighting

**Test Scenarios:**
- Single angle — tests basic extraction
- Multiple angles — tests scene detection
- Animated render — tests motion extraction

**Expected Output:**
- Static image variants for each platform
- Video variants if animation is present
- Captions should reference the visual complexity

**What to Look For:**
- Does the system handle complex visuals correctly?
- Are captions descriptive and engaging?
- Are the right moments/angles selected?
- Is the output quality consistent with the source?

---

## 3. Step-by-Step Test Protocol

### Phase 1: Upload & Ingestion (5 minutes)

**Steps:**
1. Navigate to http://localhost:5173 (local dev)
2. Click "Upload Asset" (top right)
3. Select test asset (start with product shot)
4. Wait for upload to complete (~5-10 seconds)
5. Verify toast notification appears
6. Confirm redirect to Review tab

**Success Criteria:**
- ✅ Upload completes without error
- ✅ Toast notification shows filename
- ✅ Redirect to Review tab happens automatically
- ✅ Asset appears in Assets list

**Failure Modes:**
- ❌ Upload hangs or times out
- ❌ No toast notification
- ❌ No redirect
- ❌ Asset doesn't appear in list

### Phase 2: Content Generation (30-60 seconds)

**Steps:**
1. Navigate to Review tab
2. Wait for content generation to complete
3. Verify 5 content units appear (one per platform)
4. Check each content unit for:
   - Platform badge (Instagram, LinkedIn, X, TikTok, YouTube Shorts)
   - Caption text
   - Media preview (image or video thumbnail)
   - Approval status (pending)

**Success Criteria:**
- ✅ 5 content units generated
- ✅ Each has correct platform badge
- ✅ Each has unique caption
- ✅ Each has media preview
- ✅ All are in "pending" status

**Failure Modes:**
- ❌ Fewer than 5 units generated
- ❌ Missing platform badges
- ❌ Duplicate captions
- ❌ Missing media previews
- ❌ Wrong approval status

### Phase 3: Content Review (10-15 minutes)

**Steps:**
1. For each content unit, evaluate:
   - **Caption quality** (see rubric below)
   - **Visual quality** (image/video)
   - **Platform appropriateness**
   - **Brand consistency**

2. For each unit, click "Approve" or "Reject"
3. Verify status updates immediately
4. Check that approved/rejected counts update

**Success Criteria:**
- ✅ Can approve/reject each unit
- ✅ Status updates immediately
- ✅ Counts update correctly
- ✅ No errors during approval process

**Failure Modes:**
- ❌ Approval/rejection fails
- ❌ Status doesn't update
- ❌ Counts don't update
- ❌ Errors during approval

### Phase 4: Platform-Specific Evaluation (15-20 minutes)

**For each platform, evaluate:**

#### Instagram (Feed)
- Caption length: 150-300 characters (optimal)
- Hashtags: 5-10 relevant tags
- CTA: Clear and actionable
- Visual: Square format (1080x1080)
- Tone: Visual-first, lifestyle-oriented

#### Instagram (Reels)
- Caption length: 100-200 characters
- Hashtags: 3-5 relevant tags
- CTA: Engaging (comment, share, save)
- Video length: 15-30 seconds
- Tone: Trendy, fast-paced

#### LinkedIn
- Caption length: 200-400 characters
- Hashtags: 3-5 professional tags
- CTA: Professional (learn more, connect, share)
- Visual: Landscape (1200x627)
- Tone: Professional, thought-leadership

#### X (Twitter)
- Caption length: 100-200 characters
- Hashtags: 1-3 relevant tags
- CTA: Direct (click, retweet, reply)
- Visual: Landscape (1600x900)
- Tone: Concise, punchy

#### TikTok
- Caption length: 50-150 characters
- Hashtags: 3-5 trending tags
- CTA: Engaging (follow, duet, comment)
- Video length: 15-60 seconds
- Tone: Casual, trendy, authentic

### Phase 5: Edge Case Testing (10 minutes)

**Test these scenarios:**

1. **Very large file (>50MB)**
   - Does upload succeed?
   - Is there a size limit?
   - What's the error message?

2. **Unsupported format (.gif, .webp)**
   - Is upload blocked?
   - Is error message clear?

3. **Corrupt file**
   - Does system detect corruption?
   - Is error message helpful?

4. **Multiple rapid uploads**
   - Can you upload 3 assets in quick succession?
   - Does system handle concurrent generation?

5. **Empty caption generation**
   - What happens if AI fails to generate caption?
   - Is there a fallback?

---

## 4. Content Quality Rubric

### Caption Evaluation (1-5 scale)

**1 — Poor:**
- Generic, boring, no brand voice
- Irrelevant hashtags
- No clear CTA
- Grammar/spelling errors

**2 — Below Average:**
- Somewhat generic
- Hashtags partially relevant
- Weak CTA
- Minor errors

**3 — Average:**
- Acceptable but not distinctive
- Relevant hashtags
- Clear CTA
- No errors

**4 — Good:**
- Brand-consistent tone
- Highly relevant hashtags
- Strong CTA
- Engaging copy

**5 — Excellent:**
- Perfect brand voice match
- Optimal hashtag strategy
- Compelling CTA
- Viral potential

### Visual Quality Evaluation (1-5 scale)

**1 — Poor:**
- Wrong dimensions
- Blurry or pixelated
- Cropped poorly
- Not platform-appropriate

**2 — Below Average:**
- Right dimensions but low quality
- Acceptable cropping
- Minor issues

**3 — Average:**
- Correct dimensions
- Good quality
- Acceptable cropping
- Platform-appropriate

**4 — Good:**
- High quality
- Excellent cropping (subject centered)
- Platform-optimized
- Visually appealing

**5 — Excellent:**
- Perfect quality
- Perfect cropping (entropy-based)
- Platform-native feel
- Scroll-stopping

### Platform Appropriateness (1-5 scale)

**1 — Poor:**
- Same content across all platforms
- No platform-specific optimization
- Wrong tone for platform

**2 — Below Average:**
- Minimal platform differentiation
- Some optimization but inconsistent
- Tone partially matches platform

**3 — Average:**
- Basic platform differentiation
- Consistent optimization
- Tone mostly matches platform

**4 — Good:**
- Clear platform differentiation
- Strong optimization
- Tone matches platform well

**5 — Excellent:**
- Each platform feels native
- Perfect optimization for each
- Tone perfectly matches platform
- Could pass as human-created for that platform

---

## 5. Feedback Template

### For Each Content Unit

```
**Platform:** [Instagram/LinkedIn/X/TikTok/YouTube Shorts]
**Caption:** [paste caption here]

**Caption Quality:** [1-5]
- Brand voice: [Yes/No]
- Relevant hashtags: [Yes/No]
- Clear CTA: [Yes/No]
- Engaging: [Yes/No]

**Visual Quality:** [1-5]
- Correct dimensions: [Yes/No]
- Good cropping: [Yes/No]
- High quality: [Yes/No]

**Platform Appropriateness:** [1-5]
- Native feel: [Yes/No]
- Right tone: [Yes/No]
- Optimized for platform: [Yes/No]

**Overall Score:** [1-5]

**Approve/Reject:** [Approve/Reject]

**Notes:**
[What works well]
[What needs improvement]
[Specific suggestions]
```

### Aggregate Feedback

```
**Test Date:** [YYYY-MM-DD]
**Asset Type:** [Product shot/Hero video/3D render]
**Asset Name:** [filename]

**Total Content Units:** [number]
**Approved:** [number]
**Rejected:** [number]

**Average Caption Quality:** [1-5]
**Average Visual Quality:** [1-5]
**Average Platform Appropriateness:** [1-5]

**Overall System Score:** [1-5]

**Strengths:**
- [What the system does well]

**Weaknesses:**
- [What needs improvement]

**Recommendations:**
- [Specific changes to make]

**Would a client accept these as drafts?** [Yes/No/Maybe]
```

---

## 6. Success Metrics

### Quantitative Metrics

**Upload Success Rate:**
- Target: 100% (all uploads succeed)
- Acceptable: 95%+

**Generation Success Rate:**
- Target: 100% (all assets generate 5 content units)
- Acceptable: 90%+

**Approval Rate:**
- Target: 70%+ of generated content is approved
- Acceptable: 50%+

**Platform Quality Score:**
- Target: 4.0+ average across all platforms
- Acceptable: 3.5+

### Qualitative Metrics

**Brand Consistency:**
- Does the content feel like it came from the brand?
- Is the tone consistent across all outputs?

**Platform Native Feel:**
- Could this pass as human-created for each platform?
- Does it follow platform best practices?

**Client Acceptance:**
- Would a client approve these as drafts?
- Would they need significant edits?

---

## 7. Common Issues & Troubleshooting

### Issue: Content generation fails

**Symptoms:**
- No content units appear after upload
- Error message in console

**Troubleshooting:**
1. Check API health: http://localhost:3000/health (local dev)
2. Check browser console for errors
3. Verify API keys are configured (Settings page)
4. Try uploading a different asset

### Issue: Captions are generic/boring

**Symptoms:**
- All captions sound the same
- No brand voice
- Generic hashtags

**Troubleshooting:**
1. Check brand identity settings (Identity page)
2. Verify Natural Center is configured
3. Try a different asset with more visual interest
4. Check AI provider settings (Settings page)

### Issue: Visual quality is poor

**Symptoms:**
- Images are blurry
- Cropping is bad
- Wrong dimensions

**Troubleshooting:**
1. Check source asset quality (should be high-res)
2. Verify design-resizer service is running
3. Check entropy-based cropping settings
4. Try a different source asset

### Issue: Platform appropriateness is low

**Symptoms:**
- Same content across all platforms
- Wrong tone for platform
- Not optimized for platform

**Troubleshooting:**
1. Check platform adapter configurations
2. Verify platform-specific prompts are working
3. Check AI provider settings
4. Review platform best practices in code

---

## 8. Test Scenarios Checklist

### Basic Functionality
- [ ] Upload product shot → 5 content units generated
- [ ] Upload hero video → 5 content units generated
- [ ] Upload 3D render → 5 content units generated
- [ ] Approve/reject content units
- [ ] View content detail page
- [ ] Re-generate content

### Platform-Specific
- [ ] Instagram: Square format, lifestyle tone
- [ ] Instagram Reels: Vertical video, trendy tone
- [ ] LinkedIn: Landscape, professional tone
- [ ] X: Landscape, concise tone
- [ ] TikTok: Vertical video, casual tone

### Edge Cases
- [ ] Large file (>50MB)
- [ ] Unsupported format
- [ ] Corrupt file
- [ ] Multiple rapid uploads
- [ ] Empty caption generation

### Quality
- [ ] Caption quality ≥ 4/5
- [ ] Visual quality ≥ 4/5
- [ ] Platform appropriateness ≥ 4/5
- [ ] Brand consistency ≥ 4/5

---

## 9. Recommended Test Order

### Day 1: Basic Functionality (30 minutes)
1. Upload product shot
2. Review generated content
3. Approve/reject units
4. Document feedback

### Day 2: Video Testing (45 minutes)
1. Upload hero video
2. Review generated content
3. Evaluate video clips
4. Document feedback

### Day 3: Platform Deep Dive (60 minutes)
1. Test each platform individually
2. Evaluate platform-specific quality
3. Compare across platforms
4. Document feedback

### Day 4: Edge Cases (30 minutes)
1. Test large files
2. Test unsupported formats
3. Test error handling
4. Document feedback

### Day 5: Final Evaluation (30 minutes)
1. Aggregate all feedback
2. Calculate success metrics
3. Write final report
4. Recommend next steps

---

## 10. Next Steps After Testing

### If Tests Pass (Score ≥ 4.0)
1. Share results with Scott
2. Identify 3 pilot clients
3. Begin pilot program
4. Collect real-world feedback

### If Tests Fail (Score < 3.5)
1. Document specific failures
2. Prioritize fixes
3. Re-test after fixes
4. Iterate until passing

### If Tests Are Mixed (Score 3.5-4.0)
1. Identify specific weaknesses
2. Fix high-priority issues
3. Re-test weak areas
4. Accept with known limitations

---

**Document prepared:** 2026-07-20
**Test owner:** Scott Lefler
**Engineering support:** Anthony Padavano
**Next review:** After testing complete
