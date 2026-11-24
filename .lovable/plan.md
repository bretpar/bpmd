# Add CodeFinder to "Beyond the Clinic"

Add a third card to the "Other Projects" section on the About page, matching the PaycheckMD and OurFamilyCalendar cards.

- Name: CodeFinder
- Link: https://codefinder.brendanparkermd.com (opens in a new tab)
- Tag: "Medical Coding"
- Description: "A quick lookup tool for finding the right medical billing and diagnosis codes." (placeholder; edit as needed)

## Technical details
- `src/pages/About.tsx`: add the new item to the `projects` array.
- Change the grid to `md:grid-cols-2 lg:grid-cols-3` so all three cards sit in one row on desktop and stack on mobile.
