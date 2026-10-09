# Why Images Look Blurry on Websites: Resolution, Retina Screens, and Responsive Images

A product photograph looks perfectly sharp in your image editor.

You upload it to your website, open the product page, and notice that the details look softer. On a phone, the image seems even less defined. You try exporting it at a higher quality setting, but the problem remains.

The issue may not be compression.

It may be the relationship between **the number of pixels stored in the image, the size at which the website displays it, and the pixel density of the viewer's screen**.

Those are three separate measurements.

Understanding how they work together makes it easier to fix blurry product photographs, profile images, illustrations, and transparent PNG cutouts without uploading unnecessarily enormous files.

## The first clue is the image's actual dimensions

A digital photograph is made from a grid of pixels.

An image measuring 600 × 400 pixels contains 600 columns and 400 rows of pixel information.

An image measuring 1200 × 800 pixels contains four times as many total pixels.

That does not automatically make the larger image better.

The additional pixels are only useful when they contain meaningful detail or support the intended display size.

For example, enlarging an already blurry 600 × 400 photograph to 1200 × 800 does not recreate details that were missing from the original.

The software must estimate new pixel values.

Some enlargement methods produce smoother results than others, but increasing dimensions alone is not evidence that sharpness was recovered.

**Source quality and pixel dimensions both matter.**

Before changing website settings, inspect the original file at a reasonable viewing size.

If the subject is already out of focus, a larger export may not solve the problem.

## Why 600 image pixels do not always equal 600 screen pixels

Web browsers use a measurement called a *CSS pixel*.

The size specified in a webpage's CSS is not always the same as the number of physical pixels used by the screen to display it.

A high-density display can use multiple physical pixels to represent one CSS pixel.

The relationship is commonly described using the device pixel ratio, or DPR.

For example:

| Display situation | Approximate physical pixels per CSS pixel |
|---|---:|
| DPR 1 | 1 × 1 |
| DPR 2 | 2 × 2 |
| DPR 3 | 3 × 3 |

These values describe illustrative display conditions. Actual device pixel ratios can vary, and browser zoom can affect the effective ratio.

Now consider a photograph displayed at 600 CSS pixels wide.

On a DPR 1 display, 600 physical pixels may be available across that width.

On a DPR 2 display, approximately 1200 physical pixels may be available across the same CSS width.

If the website supplies only a 600-pixel-wide image, the browser must display those 600 source pixels across a larger number of physical screen pixels.

Depending on the scaling method and content, the result may look softer than a properly prepared higher-resolution source.

This is why a picture can appear acceptable on one screen and noticeably blurry on another.

## Calculate the approximate resolution you need

For a basic planning estimate, multiply the intended display width by the effective device pixel ratio.

**Suggested source width ≈ displayed CSS width × device pixel ratio**

The same principle applies to height.

Here are several illustrative examples.

| Display width | Display density | Approximate source-width target |
|---|---:|---:|
| 300 CSS px | DPR 1 | 300 px |
| 300 CSS px | DPR 2 | 600 px |
| 600 CSS px | DPR 2 | 1200 px |
| 800 CSS px | DPR 1.5 | 1200 px |
| 800 CSS px | DPR 3 | 2400 px |

These calculations identify a useful upper-detail target for the stated conditions, not a mandatory minimum.

An image can look acceptable below that target depending on its content, the viewing conditions, and the level of detail required.

Nor is it always sensible to serve extremely large images just because a device reports a high DPR.

Larger images can consume more bandwidth, processing time, and device memory.

A practical website balances sharpness against delivery cost.

That is why responsive images are preferable to serving one unnecessarily large file to every visitor.

## A practical example: the sharp thumbnail that became a blurry banner

Consider a fictional online shop selling handmade ceramic cups.

The owner prepares a product image measuring 600 × 600 pixels.

The image is intended for a small product card displayed at 300 CSS pixels wide.

On a DPR 2 display, that is a reasonable resolution match.

The image contains roughly twice as many source pixels as its CSS display width.

Later, the shop reuses the same image on a product-detail page.

The new page displays it at 900 CSS pixels wide.

On a DPR 2 screen, the approximate full-density target becomes 1800 source pixels.

But the website still provides only 600.

The image now has one-third of that target width.

The browser can enlarge it, but it cannot reconstruct the original fine details of the product's texture.

The image may consequently look soft.

The immediate problem is not the image's filename, color profile, or background color.

It is that **a thumbnail-sized raster image is being asked to fill a much larger display area**.

The values above describe a hypothetical website, not a test performed on a live store.

## CSS can make a small image appear much larger

An HTML image has intrinsic dimensions associated with its source.

But a webpage can display it at a different size.

For example, CSS might instruct a 400-pixel-wide photograph to occupy a container measuring 800 CSS pixels wide.

The browser must scale the image to fit.

That may make the photograph appear blurry or reveal individual pixels.

The reverse situation is different.

A 1200-pixel-wide image displayed at 400 CSS pixels usually has more source detail available than the display requires.

The browser scales it downward.

That may produce a visually clean result, although it does not guarantee that the original photograph was sharp or well compressed.

This distinction explains why simply using `width: 100%` does not guarantee crisp images.

That CSS rule describes layout behavior.

It does not ensure that the source file contains enough detail for the resulting size.

## Why increasing JPEG quality may not solve the problem

Image quality and image resolution are related but different concepts.

A JPEG export quality setting influences how the file is compressed.

Reducing compression artifacts may improve the appearance of a photograph.

However, if the image is only 400 pixels wide and the webpage displays it at 1000 CSS pixels, increasing the JPEG quality setting does not supply the missing spatial detail.

Consider three separate problems.

| Problem | What is happening | More relevant correction |
|---|---|---|
| Blurry source | The camera or original processing did not capture enough detail | Use a sharper original |
| Insufficient resolution | Too few source pixels are being displayed across a large area | Supply an appropriately sized source |
| Compression artifacts | Encoding has introduced visible distortion or blockiness | Adjust encoding quality or format |

It is possible for more than one problem to occur simultaneously.

For example, a low-resolution JPEG might also be heavily compressed.

Fixing one issue will not necessarily solve the other.

A sensible workflow identifies the primary defect before repeatedly exporting new versions.

## Sharpness and color accuracy are separate issues

An image can be sharp while its colors look wrong.

Conversely, its colors can be accurately reproduced while its details appear blurred.

Color changes may involve ICC profiles, sRGB, Display P3, or differences between screens.

Those are important, but they are not the same as having insufficient image resolution.

If the image looks appropriately sharp but changes saturation or hue after export, investigate color management rather than simply increasing its pixel dimensions.

For a separate explanation, see [Why Your Image Colors Change After Export](/journal/why-image-colors-change-after-export-srgb-p3).

Keeping the two problems separate prevents unnecessary edits that introduce new issues without fixing the original one.

## What happens when a background-removal tool exports a PNG?

A transparent-background product image introduces another step.

Suppose the original photograph is processed using a background-removal application.

The result is exported as a PNG.

PNG is capable of storing images without the lossy compression typically associated with JPEG.

It also supports transparency.

But PNG does not guarantee that the subject will remain sharp at every display size.

If the input photograph was blurry, the transparent output can retain that softness.

If the output has relatively small pixel dimensions, placing it inside a large webpage banner can reveal its limited resolution.

And if automatic segmentation produces rough or softened edges, increasing the image dimensions does not automatically correct those edge-quality problems.

These are separate factors:

**Image resolution:** How many pixels are available?

**Source sharpness:** How much actual detail exists?

**Segmentation quality:** Was the subject separated cleanly from its background?

A visually attractive transparent export still needs to be assessed at the size where it will be published.

## How this applies to Anvil Tools Background Remover

The [Anvil Tools Background Remover](/tools/background-remover.html) accepts JPG, PNG, and WebP images.

It uses a browser-based segmentation model to identify the subject, then produces a downloadable transparent PNG.

The tool focuses on removing the background.

It is not advertised as a high-resolution upscaler, image-resizing utility, or responsive-image optimizer.

That means preparing a web-ready image may require additional work outside the tool.

For a product photograph, an appropriate workflow is to:

1. Start with the highest-quality useful original available.
2. Remove the background using the browser tool.
3. Download the transparent result.
4. Inspect the downloaded PNG's actual dimensions.
5. Compare it with the required display dimensions.
6. Use a suitable image editor or image-processing pipeline if additional resizing or export preparation is needed.
7. Inspect the finished image on the actual website.

Do not assume the downloaded PNG has a particular resolution without checking the file.

Also, do not assume the background remover can reconstruct detail absent from the input.

Its main task is foreground segmentation, not photographic restoration.

## How responsive images solve the resolution problem

A responsive website does not have to serve one image size to every device.

HTML supports supplying multiple image candidates.

The browser can choose an appropriate source based on factors such as display dimensions, pixel density, and the page's layout.

Two particularly important HTML attributes are `srcset` and `sizes`.

### Using density descriptors

For an image displayed at a relatively consistent CSS size, a webpage can offer different density versions.

Consider two prepared files:

| File | Actual dimensions | Candidate description |
|---|---|---|
| `cup-600.jpg` | 600 × 400 pixels | `1x` |
| `cup-1200.jpg` | 1200 × 800 pixels | `2x` |

If the intended display size is 600 × 400 CSS pixels, the larger file can support a denser display.

The `srcset` attribute can describe the candidates using `1x` and `2x`.

The browser then decides which resource is appropriate.

These descriptors must describe the intended relationship between the image candidates and display size.

They are not image-quality labels.

Calling a 600-pixel image `2x` does not magically give it 1200 pixels of detail.

### Using width descriptors

Websites with responsive layouts often need more flexibility.

A product image might occupy the full width of a phone screen but only one column on a desktop layout.

For that situation, `srcset` can offer candidates with actual widths such as `480w`, `960w`, and `1440w`.

The `sizes` attribute describes the image's expected display slot under different layout conditions.

Using those hints and other available information, the browser can select a suitable file.

When using width descriptors, the stated width must correspond to the candidate image's actual intrinsic pixel width.

Do not combine `w` and `x` descriptors within the same `srcset` list.

A responsive-image setup should be tested in the real layout rather than judged from the filenames alone.

MDN's [Using Responsive Images in HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images) explains both approaches with working examples.

## Why one enormous image is not the ideal solution

A straightforward response to blurry pictures is to upload the largest image available.

That can sometimes improve sharpness.

But it introduces another problem.

Imagine a product card displayed at 250 CSS pixels wide on a mobile device.

If the website always sends a 4000-pixel-wide photograph, most of those source pixels may not be useful for that presentation.

The visitor still has to transfer and decode the image.

A larger file can increase bandwidth use and potentially affect page performance.

The best option is usually not the smallest possible file or the largest possible file.

It is an appropriately sized, properly encoded file that retains sufficient detail.

Responsive delivery allows different devices and layouts to use different sources.

This is especially valuable for websites with many product photographs, article covers, or catalog images.

## The hidden thumbnail problem

Some publishing systems automatically generate smaller images when a file is uploaded.

That is useful for thumbnails and responsive delivery.

But a template can accidentally select the wrong version.

For example:

- The original upload is 1600 pixels wide.
- The content-management system creates a 320-pixel thumbnail.
- The product card displays the thumbnail at 160 CSS pixels.
- A larger product-detail page accidentally uses that same 320-pixel file at 800 CSS pixels.

The source exists in high resolution, but the webpage is delivering the thumbnail.

Uploading an even larger original may not fix the issue if the template still selects the small derivative.

The correct investigation is to determine **which image file the browser is actually downloading**.

That is why checking the live webpage matters more than checking the image in the media library alone.

## How to check the image actually delivered by your website

Most modern desktop browsers provide developer tools that can help inspect image loading.

A practical investigation can follow this sequence.

**First, open the affected page.**

Use the layout and device on which the problem is visible.

**Second, inspect the image element.**

Check its displayed dimensions and whether CSS is enlarging it beyond the intended size.

**Third, inspect the network request.**

Find the image resource the browser actually downloaded.

If the page uses responsive images, verify which candidate was selected.

**Fourth, inspect the downloaded asset.**

Compare its actual pixel dimensions with the size at which it is being displayed.

**Fifth, test a different source.**

Replace the small source with an appropriately sized original or derivative, without changing unrelated settings.

If the image becomes sharper, that supports a resolution-related explanation.

If it remains soft, inspect the original image, compression, and image-processing history.

This method is more dependable than repeatedly changing CSS or export settings without identifying the delivered file.

## Be careful when interpreting naturalWidth

JavaScript provides image properties such as `naturalWidth` and `naturalHeight`.

These can be useful when investigating how a browser handles an image.

However, `naturalWidth` is defined in density-corrected CSS pixels.

It is not always identical to the raw width stored inside the downloaded image file.

For example, responsive image selection and density information can affect how intrinsic dimensions are reported.

Some browsers may also apply image-processing interventions under certain device conditions.

Therefore, when you need to determine the exact pixel dimensions of a delivered file, inspect the file itself or the relevant network resource.

Use the browser's layout information to determine the displayed CSS size.

Keeping those measurements separate avoids misleading comparisons.

MDN documents the distinction in its [naturalWidth reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/naturalWidth).

## Why changing CSS image-rendering is usually not the fix for photographs

CSS includes an `image-rendering` property that influences how scaled images are sampled.

That sounds like an obvious solution for blurry photographs.

But the property is not a general-purpose image-enhancement tool.

Some values are intended for special cases such as pixel art, where preserving distinct block-like pixels is more important than smooth interpolation.

Using `image-rendering: pixelated` on a product photograph generally produces an intentionally pixelated appearance rather than recovering realistic detail.

Other rendering values cannot reconstruct photographic details that the source file never contained.

For normal photographs, the most reliable starting point is an adequately detailed source image and appropriate display sizing.

The MDN [image-rendering documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/image-rendering) explains the intended use of the available values.

## Why object-fit cannot restore missing image detail

Another common CSS property is `object-fit`.

It controls how replaced content, such as an image, fits inside a specified box.

For example, `object-fit: cover` can scale and crop an image so that it fills the container.

This is useful for consistent thumbnail layouts.

But it does not add new source detail.

If a small image is scaled up to fill a large card, changing its object-fit value may alter the crop without solving the underlying resolution issue.

Likewise, `object-fit: contain` can show the whole image without cropping, but that does not guarantee high sharpness.

Treat layout and source resolution as separate decisions.

Choose the crop needed for the design.

Then supply an image with sufficient resolution for that display.

## The difference between screen resolution and print resolution

Image-editing programs often show a resolution field labeled DPI or PPI.

That can be confusing when preparing website images.

For ordinary web display, the number of image pixels and the CSS display size are usually more directly relevant than a stored print-resolution value.

Consider a 1200 × 800-pixel image.

Changing its print-resolution metadata from 72 PPI to 300 PPI without resampling does not create additional pixels.

The file still contains 1200 × 800 pixels.

An ordinary webpage displaying it at 600 × 400 CSS pixels does not automatically become sharper simply because the PPI label changed.

For printing, PPI can help describe how many image pixels are allocated to each inch of output.

For websites, focus first on the actual pixel dimensions, chosen image candidate, CSS size, and display density.

If the image-editing application offers a "resample" option, distinguish that operation from changing the print-resolution metadata alone.

Resampling actually changes the pixel dimensions.

Changing only the metadata does not.

## When a sharp file still looks blurry

Not every blurry-looking image is caused by insufficient source resolution.

Other possibilities include:

| Observation | What to investigate |
|---|---|
| Image is soft even at its original size | Focus, motion blur, source processing, or lack of detail |
| Image is sharp locally but soft on the website | Delivered file, thumbnail selection, CSS scaling, or server-side transformations |
| Fine details have blocky artifacts | Compression settings or repeated lossy exports |
| Image looks soft only briefly while loading | Whether a low-resolution preview is displayed before the final asset |
| Image appears blurry only at certain zoom levels | Scaling and browser/device rendering behavior |
| Subject edges look rough after background removal | Segmentation quality rather than only resolution |
| Image colors change but details remain sharp | Color-management workflow rather than image resolution |

This table is a diagnostic starting point.

The symptoms do not establish a cause without inspecting the actual files and webpage behavior.

A useful test changes one factor at a time.

For example, if the webpage displays a low-resolution thumbnail, replace only that source while leaving layout and compression settings unchanged.

That isolates the effect of source resolution.

## A sensible image-preparation workflow

For a site that uses product photographs, article covers, and transparent cutouts, a reliable process has four stages.

### Stage 1: Preserve the best original

Keep the highest-quality useful source file before resizing, cropping, or background removal.

Do not rely on a small social-media download as your archival original when a better source is available.

### Stage 2: Determine the intended display sizes

Identify the actual CSS dimensions of the product card, article image, or banner.

Remember that different responsive layouts may display the same image at different sizes.

### Stage 3: Prepare appropriate image candidates

Create suitably sized versions using an image editor or a publishing pipeline that supports resizing and export.

Retain the required aspect ratio, subject detail, and visual quality.

Use a suitable file format rather than selecting solely by extension.

### Stage 4: Check the published result

Inspect the image in its final page layout.

Compare at least one ordinary-density condition and one higher-density condition when those are relevant to your audience.

Check which image resource was delivered and whether it contains enough detail.

For a background-removal result, also inspect transparency and subject edges.

The final published page is the meaningful destination, not merely the editing application's preview.

## Choosing a format without confusing it with resolution

JPEG, PNG, and WebP are common image formats, but the format itself does not guarantee sharpness.

A 500-pixel JPEG and a 500-pixel PNG both have 500 source pixels across their width.

Their compression behavior and stored information may differ, but neither automatically provides the detail of a genuinely sharp 1500-pixel source.

JPEG is commonly useful for photographs.

PNG supports transparency and lossless pixel-data compression.

WebP supports both lossy and lossless encoding, as well as transparency.

The most appropriate choice depends on the content, output requirements, browser support, and delivery pipeline.

For transparent product cutouts, PNG is often a practical intermediate format.

For website delivery, additional format conversion or optimization may be appropriate using tools designed for that purpose.

Keep the original source so each derivative can be recreated without repeatedly degrading the same working file.

## A publication checklist for product images and article covers

Before publishing, confirm the following:

- The original source is sharp enough for the intended use.
- The final displayed size is known.
- The chosen image file has reasonable dimensions for the target display density.
- The webpage is not accidentally using a tiny thumbnail in a large container.
- Responsive image candidates describe the files correctly.
- The image is not being stretched into the wrong aspect ratio.
- Compression has not introduced unacceptable artifacts.
- The published page shows the intended image rather than an outdated cached derivative.
- The result is acceptable on the devices and layouts that matter to your audience.

If something fails, fix that specific stage rather than changing every export setting at once.

That produces more dependable results and makes the workflow easier to repeat for future images.

## Final takeaway: inspect the delivered image, not just the original

A photograph can be perfectly sharp in an editor and still appear blurry on a website.

The problem may arise because a small image is displayed too large, a high-density screen needs more source detail, or the page is downloading an unintended thumbnail.

Compression, source focus, and image processing introduce additional possibilities.

The most useful diagnostic question is therefore:

**How many meaningful source pixels does this webpage actually provide for the size at which the image is displayed?**

Start with that comparison.

Then check the original quality, responsive-image configuration, and final browser rendering.

You do not need the largest possible image for every page.

You need an image that is sufficiently detailed for its actual destination and delivered efficiently to the people viewing it.

## Try the relevant image tool

Preparing a product photograph or profile image with a transparent background?

Use the [Anvil Tools Background Remover](/tools/background-remover.html) to isolate the foreground subject and download a transparent PNG.

After exporting, inspect the file's actual dimensions and test it at the intended website size.

For resizing, responsive delivery, or higher-resolution reconstruction, use an image editor or publishing system designed for those additional tasks.

For help checking cutout edges and transparency, see [Background Removal for Design and Product Photography](/journal/best-practices-for-background-removal-when-working-with-design).

## Further reading

- [MDN — Using Responsive Images in HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images)
- [web.dev — Responsive Images](https://web.dev/learn/design/responsive-images)
- [MDN — HTML Image Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img)
- [MDN — HTMLImageElement.naturalWidth](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/naturalWidth)
- [MDN — CSS image-rendering Property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/image-rendering)
- [MDN — CSS object-fit Property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/object-fit)
