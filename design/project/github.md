repo: Prakashash18/testComposer
branch: master

## Last sync
date: 2026-09-05T10:36:08Z

### Updated in this project
- Read the existing single-page presentation booking form and its Supabase schema as source material.
- Generalised it into BookSlot: an organiser wizard plus a public booking flow, both driven by real slot generation.
- Kept the upstream data model (availability windows → fixed-length slots, one booking per slot) and the 7–8 September 2026 / 20-minute defaults.
- Replaced the fixed 11-group presentation wording with generic, consultant-facing copy.

## Screen map
| Project screen | Repo files |
| --- | --- |
| Organiser — availability, duration, slots | supabase_setup.sql (presentation_slots, slot seeding) |
| Organiser — dashboard counts | supabase_setup.sql (presentation_bookings) |
| Public — choose day / time | app.js (get_available_presentation_slots, slot formatting), index.html |
| Public — details, review, confirmed | app.js (book_presentation_slot), index.html (name + group fields) |
| Visual shell (all screens) | style.css (superseded — new warm/ochre direction) |
