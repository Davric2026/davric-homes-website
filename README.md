# Dav-Ric Homes — Website 2

This folder holds the separate Website 2 build. Website 1 in `davric-homes-website` is left untouched. The site uses plain HTML, CSS and JavaScript, so it has no package install or build step.

## Preview locally

Open `index.html` directly, or serve this folder with a static file server:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Pages and interactions

- `index.html` — home page with a full-bleed film hero, responsive desktop navigation and animated mobile navigation
- `project.html?story=<slug>` — editorial project journals for the five Dav-Ric developments, with chapter navigation, project facts, updates and related stories
- `contact.html` — standalone contact details and enquiry form
- Dav-Ric logo introduction on direct visits and a spinning logo transition between pages
- Light and dark themes, initialized from system preference and remembered after selection
- Portfolio filters, a desktop editorial development grid and a swipeable project rail on smaller screens
- Muted hero film that starts automatically while the hero is in view, plus a still-image fallback
- Viewport-filling mobile hero, image wipes, section reveals and reduced-motion support
- Floating project image layers with pointer parallax, masked heading reveals and staggered feature/process/stat content
- Project journals shaped as editorial chapters with reading time, a Pebblebrooks progress image, active chapter links and a related-project trail
- Desktop project cards with a restrained 3D tilt and light-follow detail, plus a page scroll marker
- Enquiry form prepares the same enquiry for WhatsApp or Mail, for the visitor to review and send

Project details and current published status summaries are based on the existing Dav-Ric Homes site and supplied company profile. Baay Foreshore was intentionally excluded. For the two projects without published photography, the project story uses a graphic editorial treatment rather than another project's render.

The home hero uses illustrative footage by Curtis Adams, hosted on Pexels. It is credited in the hero and can be replaced with an approved Dav-Ric `.mp4` or `.webm` when available. See the [Pexels license](https://www.pexels.com/license/) and [clip page](https://www.pexels.com/video/exterior-design-of-a-modern-house-4301615/).
