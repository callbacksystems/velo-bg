# velo-bg

Low-poly faceted gradient backgrounds, like the lid of a VELO can, as a `<velo-bg>` custom element.

```html
<velo-bg gradient="160deg, #e84a5f, #a51c3a">
  <h1>VELO</h1>
</velo-bg>
```

The element paints a canvas behind its children and repaints on resize or attribute change.

## Attributes

| Attribute  | Default                      | What it does                                                   |
| ---------- | ---------------------------- | -------------------------------------------------------------- |
| `gradient` | `160deg, #e84a5f, #a51c3a`   | Arguments of a CSS `linear-gradient` (angle optional, stops optional) |
| `cell`     | `72`                         | Approximate facet size in CSS pixels                           |
| `jitter`   | `0.6`                        | How far vertices stray from the grid, `0` to `1`               |
| `depth`    | `0.5`                        | Strength of the facet shading, `0` to `1`                      |
| `grain`    | `0.08`                       | Opacity of the film grain, `0` to `1`                          |
| `seed`     | `1`                          | Integer; the same seed always draws the same mesh              |

Any CSS colour works as a stop: `gradient="45deg, tomato 10%, rgb(120 20 40) 90%"`. A full `linear-gradient(...)` string is accepted too.

## Install

### Import map

```html
<script type="importmap">
  { "imports": { "velo-bg": "./vendor/velo-bg/index.js" } }
</script>
<script type="module">import "velo-bg"</script>
```

`index.js` imports the modules in `src/` with relative paths, so keep the folder together.

### Rails with importmap-rails

Copy `dist/velo-bg.js` (a single-file build) into `vendor/javascript/` and pin it:

```ruby
pin "velo-bg" # vendor/javascript/velo-bg.js
```

```js
import "velo-bg"
```

## Development

```bash
npm install
npm run serve   # open http://localhost:4173
npm run lint
npm run build   # regenerates dist/velo-bg.js
```
