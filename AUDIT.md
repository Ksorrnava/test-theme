# Elfbv Theme — Code & Performance Audit

Generated: 2026-03-10

---

## 🔴 Critical Issues

### 1. `elfbv_preprocess()` runs on EVERY hook (elfbv.theme)

**Problem:** The generic `elfbv_preprocess()` hook fires for every single preprocessed element
on every page — forms, fields, blocks, views, etc. Inside it, a user entity load and an image
style URL build happen on each invocation. This is a serious performance issue.

**Current code:**
```php
function elfbv_preprocess(&$variables, $hook) {
  if (!empty($variables['directory'])) {
    // Loads language_manager, loads user, loads image_style on EVERY hook call
    $user = User::load(\Drupal::currentUser()->id());
    $image_style = \Drupal::entityTypeManager()->getStorage('image_style')->load('thumbnail');
    ...
  }
}
```

**Fix:** Move this logic to `elfbv_preprocess_page()` or `elfbv_preprocess_html()`, where it
runs only once per page request:
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

**Problem:** The bottom of `elfbv.info.yml` contains an invalid block that will be silently
ignored by Drupal. The value `'false'` is not valid for disabling a CSS asset this way, and
the syntax is placed at the wrong level.

**Current (broken) code in elfbv.info.yml:**
```yaml
bootstrap5/global-styling:
  css:
    theme:
      css/style.css: 'false'
```

**Fix:** Move it inside the proper `libraries-override` key with correct boolean `false`:
```yaml
libraries-override:
  bootstrap5/global-styling:
    css:
      theme:
        css/style.css: false
```

---

## 🟡 Medium Issues

### 3. Inline Yandex Metrika script bypasses asset pipeline (elfbv.theme)

**Problem:** The Yandex.Metrika tracking code is injected via `Markup::create()` with raw
inline JavaScript in `elfbv_page_attachments_alter()`. This prevents Drupal's caching and
aggregation from working on it, and will conflict with strict Content Security Policy headers.

**Fix:** Move the script to a dedicated JS file, e.g. `assets/js/yandex-metrika.js`, and
register it in `elfbv.libraries.yml`:
```yaml
yandex-metrika:
  js:
    assets/js/yandex-metrika.js: { attributes: { async: true } }
  header: false
```
Then attach it in `elfbv_page_attachments_alter()`:
```php
function elfbv_page_attachments_alter(array &$attachments) {
  $attachments['#attached']['library'][] = 'elfbv/yandex-metrika';
}
```

---

### 4. N+1 taxonomy entity loads in `elfbv_preprocess_node_taxonomy_translations()` (elfbv.theme)

**Problem:** For every node, this function calls `taxonomy_term` storage `load()` up to twice
with no caching. On a listing page with 20 nodes, that's up to 40 uncached DB queries.

**Fix:** Use a static cache to avoid repeated loads for the same term:
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

### 5. `drupal_menu()` called directly in Twig template (header.html.twig)

**Problem:** `{{ drupal_menu('top-menu') }}` is called directly inside
`templates/layout/header.html.twig`. While the Twig Tweak module makes this work, it bypasses
Drupal's render pipeline and block/cache system, making the menu harder to manage and cache
properly.

**Fix:** Move menu rendering to a block placed in a region, or preprocess the menu in
`elfbv_preprocess_page()` using the menu.link_tree service and pass it as a render array
variable to the template.

---

### 6. Missing `alt` attribute on logo `<img>` (header.html.twig)

**Problem:** The logo image tag has no `alt` attribute, which is an accessibility (a11y)
violation and will fail WCAG 2.1 Level A audits:
```twig
<img src="{{ logo_icon }}">
```

**Fix:**
```twig
<img src="{{ logo_icon }}" alt="{{ 'Site logo'|t }}">
```

---

## 🟢 Low / Minor Issues

### 7. `slick.min.js` missing `minified: true` flag (elfbv.libraries.yml)

**Problem:** Loading a pre-minified file without declaring it can cause Drupal's aggregation
to re-process it unnecessarily.

**Current:**
```yaml
slick-slider-library:
  js:
    assets/js/slick.min.js: { }
```

**Fix:**
```yaml
slick-slider-library:
  js:
    assets/js/slick.min.js: { minified: true }
```

---

### 8. Deprecated `core/jquery.once` dependency (elfbv.libraries.yml)

**Problem:** `core/jquery.once` is deprecated in Drupal 10 and removed in Drupal 11.
The `visually-impaired` library lists both `core/jquery.once` and `core/once`, which
is redundant and will generate deprecation notices.

**Current:**
```yaml
visually-impaired:
  js:
    assets/js/visually_impaired.js: {}
  dependencies:
    - core/jquery
    - core/jquery.once   # deprecated!
    - core/once
    - core/drupal
    - core/jquery.cookie
    - core/js-cookie
```

**Fix:** Remove `core/jquery.once`:
```yaml
visually-impaired:
  js:
    assets/js/visually_impaired.js: {}
  dependencies:
    - core/jquery
    - core/once
    - core/drupal
    - core/jquery.cookie
    - core/js-cookie
```

---

### 9. Add `defer` to non-critical JS assets (elfbv.libraries.yml)

**Problem:** `scripts.js` and `slick_sliders.js` are loaded without any loading hint, blocking
page render.

**Fix:** Add `defer: true` to non-critical scripts:
```yaml
global-styling:
  js:
    assets/js/scripts.js: { attributes: { defer: true } }
```

---

### 10. `dvh-100` utility class used without fallback (html.html.twig)

**Problem:** `dvh` (dynamic viewport height) is used on `<html>` and `<body>` without a
fallback for older browsers that don't support it. This can cause layout issues on Safari iOS
< 15.4 or older Android browsers.

**Fix:** Add `vh-100` as a fallback class before `dvh-100`, or handle it via CSS:
```twig
<html{{ html_attributes.addClass('h-100') }}>
<body{{ attributes.addClass(body_classes, 'h-100') }}>
```
Then in CSS:
```css
html, body {
  height: 100vh; /* fallback */
  height: 100dvh;
}
```

---

### 11. Hardcoded copyright year via `date('Y')` (elfbv.theme)

**Problem:** In `elfbv_theme_suggestions_region_alter()`, the copyright is set as:
```php
$variables['copyright'] = '© Emigram ' . date('Y');
```
This works but bypasses Drupal's translation/config system and won't update on cached pages
until cache is cleared.

**Fix:** Either make this a theme setting (configurable via `/admin/appearance/settings/elfbv`),
or ensure the region has a proper `max-age` cache metadata set.

---

## ✅ Good Patterns (keep these)

- Preprocess logic for nodes correctly delegated to service handler classes
  (`ForumNodePreprocessHandler`, `BusinessNodePreprocessHandler`, `FaqNodePreprocessHandler`)
- `elfbv_forms_attach_form_id()` recursion is clean and well-structured
- Theme suggestions for nodes, tables, blocks, and pages follow Drupal conventions correctly
- `libraries-extend` for `media_library` UI is properly declared in `info.yml`
- Templates are well-organized into subdirectories by concern (layout, block, content, etc.)

---

## Priority Summary

| # | Priority | File | Issue |
|---|----------|------|-------|
| 1 | 🔴 Critical | elfbv.theme | `elfbv_preprocess()` fires on every hook |
| 2 | 🔴 Critical | elfbv.info.yml | Invalid `libraries-override` syntax |
| 3 | 🟡 Medium | elfbv.theme | Inline Yandex Metrika script |
| 4 | 🟡 Medium | elfbv.theme | N+1 taxonomy loads without cache |
| 5 | 🟡 Medium | header.html.twig | `drupal_menu()` called directly in Twig |
| 6 | 🟡 Medium | header.html.twig | Missing `alt` on logo `<img>` |
| 7 | 🟢 Low | elfbv.libraries.yml | `slick.min.js` missing `minified: true` |
| 8 | 🟢 Low | elfbv.libraries.yml | Deprecated `core/jquery.once` dependency |
| 9 | 🟢 Low | elfbv.libraries.yml | No `defer` on non-critical JS |
| 10 | 🟢 Low | html.html.twig | `dvh-100` without fallback |
| 11 | 🟢 Low | elfbv.theme | Hardcoded `date('Y')` in copyright |
