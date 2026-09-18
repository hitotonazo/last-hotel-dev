# Site Alteration module

Copy this entire folder into another static site, then load the CSS and JavaScript below. The overlay markup is created automatically; no HTML is required.

```html
<link rel="stylesheet" href="assets/modules/site-alteration/site-alteration.css">
<script src="assets/modules/site-alteration/site-alteration.js" defer></script>
<script src="assets/modules/site-alteration/debug-panel.js" defer></script>
```

Start the effect from any site script:

```js
window.SiteAlteration.play({
  message: 'サイトが改変されました',
  onChange: () => { /* update this site's content/state */ }
});
```

To enable the optional debug panel, initialize it after `debug-panel.js`. `?debug=1` enables it for the current browser tab. `Alt + Shift + A` plays the effect; `Alt + Shift + D` toggles the panel.

```js
window.SiteAlterationDebug.init({
  storagePrefix: 'mySite',
  state: {
    phases: ['normal', 'altered'],
    getPhase: () => currentPhase,
    setPhase: (phase) => { currentPhase = phase; }
  }
});
```

`state` is optional. Without it, the panel provides only effect playback and debug exit. Set a unique `storagePrefix` per site to prevent session-storage key collisions.
