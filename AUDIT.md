# Elfbv Theme — Code & Performance Audit

Generated: 2026-03-10  
Coverage: `elfbv.info.yml`, `elfbv.libraries.yml`, `elfbv.theme`, `templates/` (all folders), `src/`

---

## 🔴 Critical Issues

### 1. `elfbv_preprocess()` runs on EVERY hook (elfbv.theme)

**Problem:** The generic `elfbv_preprocess()` hook fires for every single preprocessed element
on every page — forms, fields, blocks, views, etc. Inside it, a user entity load and an image
style URL build happen on each invocation. This is a serious performance issue.

**Fix:** Move this logic to `elfbv_preprocess_page()` where it runs only once per page request:
```php
function elfbv_preprocess_page(&$variables) {
  if (!empty($variables['directory'])) {
    $theme_public_path = base_path() . $variables['directory'];
    $variables['path_theme'] = $theme_public_path;
    $variables['path_images'] = $theme_public_path . '/assets/media';

    $language_manager = \Drupal::service('language_manager');
    $languages = [];
    foreach ($language_manager->getLanguages() as $lang) {
      $languages[$lang->getId()] = $lang->getName();
    }
    $variables['languages'] = $languages;
    $variables['defaultlang'] = strtoupper($language_manager->getDefaultLanguage()->getId());

    $user = User::load(\Drupal::currentUser()->id());
    if ($user && !$user->user_picture->isEmpty()) {
      $file_uri = $user->user_picture->entity->getFileUri();
      $image_style = \Drupal::entityTypeManager()->getStorage('image_style')->load('thumbnail');
      $variables['user_picture'] = $image_style->buildUrl($file_uri);
    }
    else {
      $variables['user_picture'] = FALSE;
    }
  }
}
```

---

### 2. Invalid `libraries-override` syntax in `elfbv.info.yml`

**Problem:** The bottom of `elfbv.info.yml` contains an invalid block silently ignored by Drupal.

**Current (broken):**
```yaml
bootstrap5/global-styling:
  css:
    theme:
      css/style.css: 'false'
```

**Fix:** Use the correct `libraries-override` key with boolean `false`:
```yaml
libraries-override:
  bootstrap5/global-styling:
    css:
      theme:
        css/style.css: false
```

---

### 3. Hardcoded absolute SVG path in Twig (node--forum.html.twig)

**Problem:** An icon is loaded using a hardcoded absolute server path:
```twig
{{ source("/themes/custom/elfbv/assets/media/icons/pencil-gray.svg") }}
```
This will break if the theme is ever renamed, moved, or the site runs in a subdirectory.

**Fix:** Use the `path_images` variable already available in the template:
```twig
{{ source(path_images ~ '/icons/pencil-gray.svg') }}
```

---

## 🟡 Medium Issues

### 4. Inline Yandex Metrika script bypasses asset pipeline (elfbv.theme)

**Problem:** The Yandex.Metrika tracking code is injected via `Markup::create()` with raw
inline JavaScript. This prevents Drupal's caching/aggregation and conflicts with CSP headers.

**Fix:** Move to `assets/js/yandex-metrika.js` and register in `elfbv.libraries.yml`:
```yaml
yandex-metrika:
  js:
    assets/js/yandex-metrika.js: { attributes: { async: true } }
  header: false
```
Then attach in `elfbv_page_attachments_alter()`:
```php
function elfbv_page_attachments_alter(array &$attachments) {
  $attachments['#attached']['library'][] = 'elfbv/yandex-metrika';
}
```

---

### 5. N+1 taxonomy loads without cache (elfbv.theme)

**Problem:** `elfbv_preprocess_node_taxonomy_translations()` calls `taxonomy_term` storage
`load()` for each node with no caching — up to 40 uncached DB queries on a listing page.

**Fix:** Use a static cache:
```php
function elfbv_preprocess_node_taxonomy_translations(&$variables) {
  $language = \Drupal::languageManager()->getCurrentLanguage()->getId();
  $term_storage = \Drupal::entityTypeManager()->getStorage('taxonomy_term');
  static $term_cache = [];

  foreach (['topic_category', 'category'] as $key) {
    if (isset($variables[$key]['title']) && isset($variables[$key]['term_id'])) {
      $term_id = $variables[$key]['term_id'];
      if (!isset($term_cache[$term_id])) {
        $term_cache[$term_id] = $term_storage->load($term_id);
      }
      $term = $term_cache[$term_id];
      if ($term && $term->hasTranslation($language)) {
        $variables[$key]['title'] = $term->getTranslation($language)->getName();
      }
    }
  }
}
```

---

### 6. `drupal_menu()` called directly in Twig (header.html.twig)

**Problem:** `{{ drupal_menu('top-menu') }}` is called directly inside the header template.
While Twig Tweak makes this work, it bypasses Drupal's block/cache system.

**Fix:** Place the menu as a block in a region, or preprocess it via the `menu.link_tree`
service in `elfbv_preprocess_page()` and pass it as a render array variable.

---

### 7. Missing `alt` attribute on logo `<img>` (header.html.twig)

**Problem:** Fails WCAG 2.1 Level A:
```twig
<img src="{{ logo_icon }}">
```

**Fix:**
```twig
<img src="{{ logo_icon }}" alt="{{ 'Site logo'|t }}">
```

---

### 8. Empty block template file (block--mobile-forum-branding-block.html.twig)

**Problem:** `templates/block/block--mobile-forum-branding-block.html.twig` is a completely
empty file (0 bytes). An empty template override will render nothing but still gets loaded
and parsed by Twig on every relevant page, wasting cycles.

**Fix:** Either add valid markup, or delete the file entirely if the block should not render.
If the intent is to hide the block, use Drupal's block visibility settings instead.

---

### 9. `$this->entity` used without null-safety in ForumNodePreprocessHandler (src/)

**Problem:** In `ForumNodePreprocessHandler::preprocess()`, `$this->entity` is set in
`isApplicable()` but used directly in `preprocess()` without a null check:
```php
$variables['topic_comments_count'] = $this->entity->getCommentsCount() ?? 0;
```
If `preprocess()` is ever called without `isApplicable()` having run first (e.g. during
testing or future refactoring), this will throw a fatal error.

**Fix:** Add a guard at the top of `preprocess()`:
```php
public function preprocess(array &$variables): void {
  if (!isset($this->entity)) {
    return;
  }
  // ... rest of method
}
```

---

### 10. `->render()` called directly on translatable string (ForumNodePreprocessHandler.php)

**Problem:**
```php
$variables['topic_comments_count_label'] = $this->formatPlural(...)->render();
```
Calling `->render()` on a `TranslatableMarkup` object eagerly renders it outside the render
pipeline, preventing Drupal from applying cache metadata and language negotiation properly.

**Fix:** Pass the object directly and let Drupal render it lazily:
```php
$variables['topic_comments_count_label'] = $this->formatPlural(
  $comments_count,
  '1 комментарий',
  '@count комментариев',
  ['@count' => $comments_count]
);
```

---

### 11. Duplicate comment templates with identical SHA (templates/content/)

**Problem:** `comment--comment-business.html.twig` and `comment--comment-forum.html.twig`
have the **exact same SHA** (`a4de74063d74f3669fe2541e07a09c87f6639a7e`), meaning they are
byte-for-byte identical. This is a maintenance hazard — any future changes must be applied
to both files manually.

**Fix:** Extract the shared markup into a dedicated include partial, e.g.
`templates/content/comment--base.html.twig`, and use `{% include %}` in both:
```twig
{# comment--comment-forum.html.twig #}
{% include '@elfbv/templates/content/comment--base.html.twig' %}
```

---

## 🟢 Low / Minor Issues

### 12. `slick.min.js` missing `minified: true` flag (elfbv.libraries.yml)

**Fix:**
```yaml
slick-slider-library:
  js:
    assets/js/slick.min.js: { minified: true }
```

---

### 13. Deprecated `core/jquery.once` dependency (elfbv.libraries.yml)

`core/jquery.once` is removed in Drupal 11. Remove it from `visually-impaired`, keeping only
`core/once`.

---

### 14. Add `defer` to non-critical JS assets (elfbv.libraries.yml)

```yaml
global-styling:
  js:
    assets/js/scripts.js: { attributes: { defer: true } }
```

---

### 15. `dvh-100` without CSS fallback (html.html.twig)

**Problem:** `dvh` (dynamic viewport height) is unsupported on Safari iOS < 15.4.

**Fix:** Handle in CSS:
```css
html, body {
  height: 100vh; /* fallback */
  height: 100dvh;
}
```
And remove the utility class from the Twig template.

---

### 16. Hardcoded copyright year via `date('Y')` bypasses cache (elfbv.theme)

`$variables['copyright'] = '© Emigram ' . date('Y');` won't update on cached pages.
Make it a theme setting or add proper cache `max-age` to the region.

---

### 17. `views-view-unformatted--business.html.twig` and `--leaf-child.html.twig` are identical

Same as issue #11 — both templates share the same SHA. Extract shared markup into a base include.

---

## ✅ Good Patterns (keep these)

- Preprocess logic for nodes correctly delegated to service handler classes
  (`ForumNodePreprocessHandler`, `BusinessNodePreprocessHandler`, `FaqNodePreprocessHandler`)
- `#lazy_builder` used in `ForumNodePreprocessHandler` for view counts — excellent pattern
  that correctly defers uncacheable statistics rendering
- `TrustedCallbackInterface` correctly implemented for the lazy builder
- Constructor injection (not `\Drupal::service()`) used in all HookHandler classes
- `elfbv_forms_attach_form_id()` recursion is clean and well-structured
- Theme suggestions for nodes, tables, blocks, pages follow Drupal conventions
- `libraries-extend` for `media_library` UI correctly declared in `info.yml`
- Templates organized into subdirectories by concern
- `visually_impaired.html.twig` implemented as a proper accessible toolbar

---

## Priority Summary

| # | Priority | File | Issue |
|---|----------|------|-------|
| 1 | 🔴 Critical | elfbv.theme | `elfbv_preprocess()` fires on every hook |
| 2 | 🔴 Critical | elfbv.info.yml | Invalid `libraries-override` syntax |
| 3 | 🔴 Critical | node--forum.html.twig | Hardcoded absolute SVG path |
| 4 | 🟡 Medium | elfbv.theme | Inline Yandex Metrika script |
| 5 | 🟡 Medium | elfbv.theme | N+1 taxonomy loads without cache |
| 6 | 🟡 Medium | header.html.twig | `drupal_menu()` called directly in Twig |
| 7 | 🟡 Medium | header.html.twig | Missing `alt` on logo `<img>` |
| 8 | 🟡 Medium | block--mobile-forum-branding-block.html.twig | Empty template file |
| 9 | 🟡 Medium | ForumNodePreprocessHandler.php | `$this->entity` used without null-safety |
| 10 | 🟡 Medium | ForumNodePreprocessHandler.php | `->render()` called on TranslatableMarkup |
| 11 | 🟡 Medium | comment--comment-*.html.twig | Duplicate identical templates |
| 12 | 🟢 Low | elfbv.libraries.yml | `slick.min.js` missing `minified: true` |
| 13 | 🟢 Low | elfbv.libraries.yml | Deprecated `core/jquery.once` dependency |
| 14 | 🟢 Low | elfbv.libraries.yml | No `defer` on non-critical JS |
| 15 | 🟢 Low | html.html.twig | `dvh-100` without CSS fallback |
| 16 | 🟢 Low | elfbv.theme | Hardcoded `date('Y')` in copyright |
| 17 | 🟢 Low | views templates | Duplicate identical view templates |
