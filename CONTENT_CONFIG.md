# Content Config Guide

This site keeps Framer layout and animation untouched, and only changes content through `site-config.json`.

## Safe Editing Rules
- Edit content in `site-config.json` only.
- Do not edit `framer-*` DOM structure in exported HTML files.
- Keep the file encoding as UTF-8.

## Supported Keys
- `meta`: update title/description.
- `textReplacements`: global text replacement.
- `linkReplacements`: replace href values.
- `selectorOverrides`: precise DOM override/remove.
- `projectOperations`: add/remove/update project items without touching layout CSS/animation.
- `autoRetiredProjectPatterns`: optional.
  - `false`: disable built-in retired project auto-removal.
  - `string[]`: custom regex patterns (case-insensitive).

## Project Operations Example
```json
{
  "projectOperations": [
    {
      "type": "remove",
      "matchHref": "./new-projects/inspace",
      "closest": "[data-framer-component-type='RichTextContainer']"
    },
    {
      "type": "update",
      "matchHref": "./new-projects/voyage-ai",
      "text": "Voyage AI 2.0",
      "newHref": "./new-projects/voyage-ai"
    },
    {
      "type": "add",
      "cloneFromHref": "./new-projects/voyage-ai",
      "insertAfterHref": "./new-projects/voyage-ai",
      "href": "./new-projects/new-demo",
      "text": "New Demo"
    }
  ]
}
```

## Notes
- For remove/update, prefer matching by href over `containsText`.
- For add, cloning from an existing project item keeps original spacing/typography/motion behavior.
- If your new project should stay visible while matching old retired patterns, set:

```json
{
  "autoRetiredProjectPatterns": false
}
```
