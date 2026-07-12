---
name: verify-local-change
description: Run the full local-verification loop for this site (NathanO-Brien.github.io) after ANY edit to src/ (components, layouts, pages, styles, copy) — restart the dev server, confirm the change mechanically via the DOM, then actually look at a screenshot and judge whether it matches what was asked, before telling the user it's done. Use this proactively, without being asked, as the default last step of any visual/layout/copy change on this site — don't just eyeball a screenshot or assume an edit worked. This project's OneDrive-synced folder breaks Astro/Vite's hot-reload (stale CSS/markup even after a hard reload) and the Browser-pane screenshot tool has a known rendering glitch at certain viewport sizes (e.g. 1280×800) — this skill covers both so you don't misdiagnose either as a real bug.
---

# Verifying a local change to this site

This skill owns the whole verification loop: restart → confirm the change
took effect mechanically → confirm it actually looks right → report back
with specifics. Run all of it by default after editing anything under
`src/` that affects what the page looks like — don't wait to be asked, and
don't stop after step 1 or 2 and call it done. A change isn't verified
until you've *looked at it* and checked it against what was actually
requested (right color, right spacing, right wording, embellishment placed
sensibly, nothing overlapping) — mechanical checks alone can't catch "this
technically applied but looks wrong."

## Step 1: Restart the dev server

This project lives in a OneDrive-synced folder. OneDrive's file-sync/
locking behavior interferes with Vite's file watcher, so after editing a
file the running `npm run dev` server will often keep serving the
*previous* version of the CSS or markup — even across a hard reload
(`location.reload(true)`). Assume this will happen after most edits;
don't rely on HMR having picked it up.

```powershell
$conn = Get-NetTCPConnection -LocalPort 4321 -State Listen -ErrorAction SilentlyContinue
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Milliseconds 500
Set-Location "C:\Users\natha\OneDrive\Documents\GitHub\NathanO-Brien.github.io"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k","npm run dev" -WindowStyle Normal
```

Running it via `cmd.exe /k` in a normal (not hidden) window is deliberate
— it leaves the user a visible terminal they can glance at or Ctrl+C
themselves, matching how they run it manually.

If the dev server is printing a different port than 4321, use that port
instead for the rest of this skill.

Then poll until it actually answers before checking anything — checking
too early just reproduces the stale-content problem from a different
cause:

```bash
sleep 4; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321
```

Retry (with another short sleep) if you don't get a `200`.

## Step 2: Confirm the change mechanically via the DOM

Navigate the Browser pane to `http://localhost:4321` (or the specific
route you changed). Use `javascript_tool`, not a screenshot, for this
part — it's exact and immune to the screenshot bug described in Step 3.

Check the specific thing you changed:

- Style applied? `getComputedStyle(el).<property>`
- Two elements aligned? Compare `getBoundingClientRect().left` (or
  `.top`) between them — diffs under ~1px are sub-pixel rounding, not a
  bug.
- No unwanted scrollbar (the About page is designed to fit one viewport,
  no scroll)? Compare `document.body.scrollHeight` to `window.innerHeight`.
- Color/filter/background change applied? Read the specific computed
  property back and compare it to the value you set.

Example shape (adapt selectors/properties to what actually changed):

```js
(() => {
  const a = document.querySelector('.some-el').getBoundingClientRect();
  const b = document.querySelector('.other-el').getBoundingClientRect();
  return JSON.stringify({
    aLeft: a.left, bLeft: b.left, diff: a.left - b.left,
    scrollHeight: document.body.scrollHeight,
    innerHeight: window.innerHeight,
  });
})()
```

If a computed value still shows the *old* value after the restart, the
restart didn't take — go back to Step 1 rather than assuming your CSS is
wrong. This has happened repeatedly on this project; a second restart
always resolved it.

Don't stop here — a passing DOM check only proves the CSS/markup applied,
not that it looks right. Continue to Step 3.

## Step 3: Get a clean screenshot and actually look at it

The Browser-pane's screenshot tool has an intermittent rendering bug at
certain exact viewport sizes (1280×800 reliably triggers it in this
project) where the captured image shows the page squished into a tiny
top-left region, even though the real page is laid out correctly.

- Take the screenshot at whatever size you were testing.
- If it looks visually broken but your Step 2 DOM checks passed, don't
  assume the layout is actually broken — resize slightly (e.g. 1280×800
  → 1300×780 or 1000×700) and re-screenshot. This reliably produces a
  clean capture in this project.
- Trust the DOM measurements over screenshot pixels if they ever disagree.

Once you have a clean screenshot, actually evaluate it against the
original request — this is the step that catches things DOM checks
can't:

- Does the color read as the color that was asked for (not just "a
  color got applied")?
- Does the spacing/sizing look intentional and balanced, not cramped or
  too sparse?
- Is text present, correctly worded, and not overlapping or clipped?
- If there's a decorative/artistic element (an underline, an animation,
  an embellishment), does it actually look good and placed sensibly —
  not just technically rendered?
- Check both a wide desktop size and a mobile size (375×812) if the
  change could plausibly affect either.

If something looks off, fix it and re-run this whole skill — don't report
partial success.

## Step 4: Tell the user what you actually verified

Report concretely: what you checked mechanically (with the actual
numbers/values), and what you confirmed visually. E.g. "confirmed via
computed style that the button background is now rgb(104,120,154);
confirmed nav__home and hero text share the same left edge at 1300px and
1600px (0px diff); screenshot at 1300×780 confirms the button color reads
correctly and spacing looks balanced" — not just "looks good."
