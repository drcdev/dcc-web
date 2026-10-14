# Contract: career step files

What Don edits. One YAML file per step in `src/content/career/`. The file name (without `.yaml`) is
the step's id; it never appears on the page. Field rules are in `../data-model.md`.

## Shape

```yaml
role: Manager, Enterprise Systems Development
organization: Island Health
start: "2016-09"          # YYYY-MM, quoted
end: "2022-01"            # YYYY-MM, quoted, or: present
scope: Led five cross-functional teams … under 24/7 service commitments, …
decision: Organized database, web, integration and collaboration services into five cross-functional teams, each owning its 24/7 commitments.
# changed: …              # optional: What changed in how I worked
# wish: …                 # optional: What I wish I'd known
# nextMove: …             # optional, never on the current (latest) role
achievements:
  - On-call incidents cut by 40% through ITIL-based incident management
  - COVID-19 vaccine rollout integration delivered with zero deployment delays
leadership:
  - Built and led five teams, 20+ direct reports
# awards:
#   - name: 2024 CCHL Chapter Award for Distinguished Service
#     year: 2024
#     href: https://…      # optional; without it the award shows as plain text
# posts:
#   - starting-something-new   # a post file name in src/content/posts/, published
```

## Editing rules

- Add a reflection part later by adding its key to one file. Nothing else changes.
- Leave a list key out rather than writing an empty list.
- A new role is a new file. Its start date places it; the latest start is the current role.
- Only the three category keys exist: `achievements`, `leadership`, `awards`. Any other key fails
  the build.
- Text is plain, not Markdown.

## Launch files

Exactly the six steps of spec FR-006a, with the file names in `../data-model.md`. Nothing is added
that is not in FR-006a.
