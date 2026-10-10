# Data model: Remove the project placeholder picture option

Delta against `specs/014-project-four-part-story/data-model.md` ("Visual" / "PartPicture"),
which stays as the historical record.

## Project picture (list `visual` and each `visuals` entry)

Discriminated on `kind`. Every shape is strict: any key not listed fails the build naming the
file and the key.

### kind: image

| Field | Type | Required | Notes |
|---|---|---|---|
| `kind` | `"image"` | yes | |
| `src` | image path | yes | validated by Astro's `image()` helper |
| `alt` | text | yes | |
| `part` | `problem` \| `options` \| `build` \| `lessons` | no | story pictures (`visuals`) only |

### kind: diagram

| Field | Type | Required | Notes |
|---|---|---|---|
| `kind` | `"diagram"` | yes | |
| `src` | image path | yes | |
| `alt` | text | yes | |
| `description` | text | yes | shown as the visible figcaption |
| `part` | part id | no | story pictures only |

### Removed

| Field | Was | Now |
|---|---|---|
| `placeholder` | optional boolean; `true` showed a "Placeholder" mark | unknown key: `true` and `false` both fail the build, naming the file and `placeholder` |

## Validation rules

- V1: `placeholder` anywhere on a picture (list or story, image or diagram) → schema error whose
  issue path ends in the picture (`visual` or `visuals.<name>`) and whose message names
  `placeholder`.
- All other picture rules (S08 picture names, N01 part ids, N02 one picture per part, R03 no
  `clip` kind) are unchanged.

No state transitions; no stored data.
