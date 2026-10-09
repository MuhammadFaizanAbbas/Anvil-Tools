# Why Your Image Colors Change After Export: sRGB, Display P3, and Color Profiles

You finish editing a product photograph. The colors look balanced, the background is clean, and the image appears ready for your website.

Then you export it.

The same photograph looks duller in your browser. The red packaging appears slightly orange on another phone. A colleague opens the file and says the colors look oversaturated.

It is tempting to increase saturation, change brightness, or export at a higher quality.

But the underlying problem may have nothing to do with those settings.

**A digital color is more than three RGB numbers. Its appearance also depends on how those numbers are interpreted and displayed.**

Understanding that relationship helps explain why images sometimes change appearance after editing, conversion, uploading, or displaying them on different devices.

## RGB values need an interpretation

Consider an image containing the RGB value `255, 0, 0`.

The first channel is at its maximum, while the other two are zero.

It is natural to call that red.

But exactly which red does it represent?

The answer depends on the color space used to interpret the values.

A color space defines how numerical color values correspond to colors that can be represented.

The same RGB channel values interpreted in two different RGB color spaces do not necessarily describe the same physical color.

This is the foundation of digital color management.

When software interprets an image using the wrong color space, the result may look different even if the underlying channel numbers have not changed.

## What sRGB means

sRGB is a widely used RGB color space for digital images and web content.

It defines a standardized relationship between RGB values and their intended colors.

Because sRGB has broad support across devices, browsers, and image-editing applications, it remains a sensible default for many ordinary web-publishing workflows.

For example, if you are preparing product thumbnails for a website where visitors may use a wide variety of devices, delivering properly converted sRGB images is usually a practical choice.

However, sRGB is not capable of representing every color visible to the human eye.

It covers a defined range of colors called a *gamut*.

Understanding that limitation explains why other color spaces exist.

## Display P3 can represent a wider range of colors

Display P3 is a wide-gamut RGB color space.

Its gamut includes colors that extend beyond the range available in sRGB, particularly in certain highly saturated regions.

Compatible displays and software can use that additional range to reproduce some vibrant colors that sRGB cannot represent directly.

Imagine photographing a brightly colored product under controlled lighting.

An editing workflow that supports a wider color gamut may retain colors outside the sRGB range.

If you subsequently convert the image to sRGB, those out-of-gamut colors must be represented using colors available within the smaller space.

The resulting appearance can therefore change.

This does not mean sRGB is defective.

It means the destination color space cannot reproduce every color available in the source.

## Gamut is not the same as image quality

A wider gamut is not automatically better for every photograph.

Consider a muted black-and-white product image.

It may contain no colors that benefit from the additional range offered by Display P3.

Delivering it as a wide-gamut image would not necessarily make it look better.

By contrast, a photograph containing highly saturated flowers, painted surfaces, or colorful packaging may include colors outside sRGB.

The practical question is:

**Does the destination benefit from colors outside the ordinary sRGB range, and can the receiving workflow reproduce them correctly?**

For broad web compatibility, a correctly converted sRGB export is often more useful than a wider-gamut file with uncertain support.

For a specialized workflow using compatible software and displays, retaining a wider gamut may be appropriate.

## Four situations that look like the same problem

Users often describe different color-management issues with the same sentence:

“My image changed color.”

But that description can refer to several separate situations.

| What happened | Possible explanation |
|---|---|
| The exported file looks different from the editor preview | Color-profile conversion, export settings, or application color management |
| The same file looks different on two devices | Display gamut, calibration, brightness, operating-system settings, or viewing environment |
| The image differs from a CSS background color | Different color spaces, compositing, profile interpretation, or processing |
| Colors change after browser-based processing | Image decoding, working color space, pixel processing, or export behavior |

These are possible explanations, not diagnoses based on appearance alone.

The fastest way to investigate is to identify which part of the workflow changed.

## Assigning a profile is not converting a profile

This is one of the most important distinctions in color management.

An image editor may offer two operations:

**Assign Profile**

and

**Convert to Profile**

They sound similar but behave differently.

### Assigning a profile

Assigning a profile tells the application how to interpret the image's existing color numbers.

The underlying RGB values are not converted into a new color space.

Their interpretation changes.

As a result, the image's visible colors may change significantly.

Assigning a different profile is not an appropriate shortcut for converting an existing image to another color space.

### Converting a profile

Converting to a different profile changes the color values in an effort to preserve the intended appearance.

For example, when converting a correctly interpreted Display P3 image to sRGB, color-management software calculates destination values appropriate for sRGB.

The goal is to reproduce the original appearance as closely as the destination gamut and conversion method allow.

Perfect preservation is not always possible when source colors fall outside the destination gamut.

### The essential difference

| Operation | RGB values | Intended result |
|---|---|---|
| Assign Profile | Generally unchanged | Reinterpret existing values |
| Convert to Profile | Recalculated | Preserve appearance as closely as possible |

If an image suddenly becomes oversaturated or washed out after a profile change, check whether the profile was assigned when conversion was intended.

Do not compensate immediately by changing saturation.

First establish how the software is interpreting the image.

## What if the image has no embedded profile?

Some files do not contain an embedded ICC color profile.

That creates uncertainty about how their RGB values were intended to be interpreted.

Applications may apply assumptions or default color-management behavior when opening untagged images.

Those assumptions are not necessarily identical across all workflows.

For ordinary web content, assuming sRGB is common, but that does not prove that an untagged image was originally created in sRGB.

If you know the source image's original color space, you may be able to assign the correct profile before converting it.

If you do not know, changing profile assignments repeatedly is not a reliable method for recovering the original appearance.

Keep the source file and available editing history whenever possible.

An image that lacks a profile is not automatically corrupted, but it may be harder to reproduce consistently.

## JPEG, PNG, and WebP do not define one universal color appearance

A file format and a color space answer different questions.

JPEG, PNG, and WebP describe how image data is stored and encoded.

Color spaces and profiles describe how color values should be interpreted.

A JPEG is not automatically sRGB simply because it uses the `.jpg` extension.

A PNG is not automatically color-managed correctly just because it supports transparency.

WebP also should not be treated as proof of any particular embedded color profile.

These formats and their processing pipelines can support color information, but the actual result depends on the encoder, file metadata, and receiving software.

For publishing, record both:

- The file format.
- The intended color space or profile.

The format alone is insufficient.

## A color profile is not the same as EXIF camera metadata

Image files can carry several different kinds of metadata.

EXIF may describe camera settings, timestamps, orientation, and location.

Color-profile information describes how image colors should be interpreted.

Removing camera information for privacy does not necessarily mean that removing color-management information is desirable.

An export workflow that indiscriminately strips metadata can affect more than private descriptive details.

For that reason, do not use “remove all metadata” as a universal solution to image color problems.

If you need to remove GPS or other unnecessary information, use an appropriate workflow and preserve the technical information required for reliable display.

Keep an untouched original so the processing can be reviewed or repeated.

## Why two screens can show the same file differently

Suppose you open exactly the same exported JPEG on a laptop and a phone.

The bytes are identical.

Yet the colors appear different.

Several factors can contribute.

The displays may cover different color gamuts.

Their calibration may differ.

One may use a warmer white point.

One may have automatic brightness or ambient-color adjustment enabled.

Different operating-system and application color-management paths can also affect the result.

High dynamic range modes and display settings introduce further variables in some environments.

This means a color difference between two devices is not automatically evidence that the image file is defective.

If you are evaluating an export, first compare it against the original on the same calibrated or consistently configured display using suitable color-managed software.

That helps separate file-processing changes from display differences.

## Why screenshots are unreliable color references

A screenshot captures the rendered output of a particular display or application workflow.

It may be affected by color-space handling, operating-system processing, display settings, or the format in which the screenshot is saved.

A screenshot also does not necessarily preserve the original image's color profile or pixel values.

Suppose you take a screenshot of an image displayed inside an editing application.

Then you compare the screenshot with the original export.

Any difference could involve the screenshot process rather than the original file.

For a meaningful export comparison, use the original file and exported file directly.

Avoid using screenshots as a substitute for source-image inspection.

## When a product photo does not match your website background

Imagine placing a product photograph on a webpage.

The surrounding page uses a CSS background color.

The background area inside the photo was intended to match that CSS color, but a visible rectangle appears around the image.

This may be caused by several different issues.

The image and CSS may use different color values.

The image may have undergone profile conversion.

Its background may contain lighting variations or compression artifacts.

The image could also include a subtle shadow that is difficult to see in isolation.

A useful diagnostic approach is to compare a known flat-color region from the image with the intended CSS background.

However, be careful about the meaning of the values being compared.

Most traditional CSS hexadecimal colors are interpreted in sRGB.

A wide-gamut image may have color values defined in another space.

Matching the same numerical RGB values does not guarantee matching visible colors when the color spaces differ.

If exact visual continuity is essential, prepare the image and page background within a coordinated color workflow.

## Why CSS can use colors beyond ordinary sRGB

Modern CSS supports explicitly defined color spaces.

For example, the familiar hexadecimal value `#ff0000` represents red in sRGB.

CSS can also express colors using the `color()` function, including values in Display P3.

An example is `color(display-p3 1 0 0)`.

That Display P3 value represents a different, more saturated red than sRGB `#ff0000`.

The two declarations should not be treated as interchangeable simply because both appear to request maximum red and zero green and blue.

Browsers and devices that support wider gamuts can display some colors beyond the ordinary sRGB range.

Where support is limited, gamut mapping or fallback behavior may be involved.

This matters when web designs combine wide-gamut images, traditional CSS colors, and advanced CSS color functions.

For a straightforward product website, using a consistent sRGB workflow remains a practical starting point.

## Browser canvas processing introduces another boundary

Some browser tools use the Canvas API to draw, process, or export images.

Browser canvas operations can involve color-space interpretation and conversion.

Modern canvas APIs expose color-space options in some contexts, and support varies by feature and browser.

Export methods such as `toBlob()` can generate PNG or other supported image formats.

But creating a new image from canvas pixels should not be interpreted as a guarantee that the exported file retains every property of the source.

The output may differ in:

- Pixel dimensions.
- Alpha information.
- Color representation.
- Metadata.
- Encoding.
- Compression.

Which differences occur depends on the actual application, canvas configuration, browser, and export process.

For that reason, a browser tool's downloaded output should be treated as a new file that deserves inspection.

## How this relates to Anvil Tools Background Remover

The Anvil Tools Background Remover accepts supported image files and uses a browser-based model to isolate the foreground subject.

It provides a downloadable PNG with transparency.

The operation focuses on foreground segmentation.

It is not advertised as a color-profile editor, calibration utility, or color-accuracy certification system.

When preparing a product image, there are therefore two separate quality questions.

**Was the background removed cleanly?**

And:

**Does the downloaded image reproduce the intended colors acceptably?**

A successful transparent cutout does not automatically answer the second question.

If color accuracy matters, compare the exported PNG with the source in suitable viewing software, taking into account that the background itself has changed.

Do not assume every visible difference is caused by the segmentation model.

The browser's image decoding, export path, color-management settings, and display environment may also contribute.

## Why increasing image quality does not always fix color

Suppose a JPEG looks less saturated after export.

The first reaction may be to increase its quality setting from 80 to 95.

But JPEG quality settings primarily affect compression behavior.

They do not directly determine whether the image's color profile is correct.

Higher-quality encoding may reduce visible compression artifacts.

It does not automatically repair an incorrect profile assignment or restore colors lost through gamut conversion.

Likewise, exporting as PNG instead of JPEG may preserve lossless pixel data, but it does not independently guarantee correct color management.

Choose the file format based on the image's needs.

Investigate color-space issues separately.

## An export investigation that avoids guesswork

When the exported image differs from the original, collect a few facts before editing it again.

| Property | Source image | Exported image |
|---|---|---|
| File format | Record | Record |
| Pixel dimensions | Record | Record |
| Embedded color profile | Inspect | Inspect |
| Intended color space | Identify | Identify |
| Viewing application | Record | Record |
| Display used | Record | Record |
| Conversion performed | Identify | Identify |

The table deliberately contains no invented measurements.

Its purpose is to separate what is known from what is assumed.

Begin with the source and output in the same color-managed application on the same display.

If they differ, inspect the export settings and profiles.

If they match there but differ on another device, investigate the receiving display and application.

If the exported file has no profile, determine whether that absence matters in the intended workflow.

This prevents unnecessary saturation adjustments that may make the image look correct in one environment while making it worse in another.

## Choosing a sensible workflow for web images

For general web publishing, a useful workflow is:

1. Preserve the original image.
2. Open it in an application that correctly interprets its existing profile.
3. Complete the intended edits.
4. If broad web compatibility is the goal, convert a copy to sRGB using an appropriate color-management operation.
5. Save in a suitable image format with the intended color information.
6. Inspect the exported file independently.
7. Test the actual webpage on more than one representative device.
8. Avoid adjusting the source merely to compensate for one uncalibrated screen.

This workflow does not guarantee visually identical results on every display.

No single file can force every device to reproduce colors in exactly the same way.

The goal is to establish a controlled, reproducible starting point and reduce avoidable differences.

## When keeping Display P3 may be appropriate

Converting every image to sRGB is not mandatory.

If a project specifically targets compatible wide-gamut displays or uses an established color-managed workflow, Display P3 may be suitable.

The requirements should be clear.

The editor should know the source space.

The output should carry appropriate color information.

The receiving applications should support the intended workflow.

Any colors outside the destination device's capabilities will still need to be represented as closely as possible within its supported gamut.

For ordinary website content distributed to an unknown mix of devices, the trade-off often favors sRGB.

For specialized visual work, preserving a wider gamut may be beneficial.

The correct choice depends on the destination, not simply on which color space has the larger name or gamut.

## Color accuracy is not the same as color accessibility

A color-managed image may reproduce its intended colors accurately and still be difficult for some users to interpret.

For example, two labels may have insufficient visual contrast even when their colors are displayed exactly as designed.

Color management is concerned with consistent color interpretation and reproduction.

Accessibility involves additional questions about readability, contrast, and how information is communicated.

A correct color profile does not certify accessibility.

Likewise, an accessible color combination does not establish that an image export preserved the source photograph's intended colors.

These are related but distinct aspects of visual quality.

## The final image should be evaluated at its destination

The editing preview is only one stage of an image's life.

The final image may be displayed on a product page, inside an application, on a presentation slide, or in a downloaded document.

A reliable review uses the actual destination whenever possible.

For a website image, inspect the published page.

For a background-removal result, inspect the exported PNG on the intended background.

For a professional color workflow, use the required profile and proofing procedures.

And when something looks wrong, determine whether the cause is the source, conversion, export, viewer, or display before changing the color values.

**The correct question is not simply whether an image looks identical everywhere.**

It is whether the image was prepared with an appropriate color space, interpreted correctly, and verified in the environment where people will actually see it.

## Try the relevant image tool

Need to remove the background from a photograph before placing it into a website or design?

Try the [Anvil Tools Background Remover](/tools/background-remover.html).

The tool produces a transparent PNG using local browser processing. For color-profile inspection, conversion, or calibrated proofing, use an appropriate dedicated image-editing application and check the final exported file.

## Further reading

- [Adobe — Change a Document's Color Profile](https://helpx.adobe.com/photoshop/desktop/adjust-color/color-profiles/change-a-documents-color-profile.html)
- [Adobe — Manage Document Colors for Online Viewing](https://helpx.adobe.com/photoshop/desktop/adjust-color/color-profiles/manage-documents-colors-for-online-viewing.html)
- [MDN — Color Gamut](https://developer.mozilla.org/en-US/docs/Glossary/Gamut)
- [MDN — CSS color-gamut Media Feature](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/color-gamut)
- [MDN — HTMLCanvasElement.toBlob()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
- [W3C — CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/)
