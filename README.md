# Jumping Game

A Chrome-dino-style jumping game. HTML/CSS and JS are built in parallel, so
this document defines the contract between them.

## Who owns what

| File             | Owner      | Notes                                             |
| ---------------- | ---------- | ------------------------------------------------- |
| `css/styles.css` | Design     | Free to restyle anything not listed below         |
| `js/script.js`   | Logic team | Free to change anything not listed below          |
| `index.html`     | Shared     | Any change is a contract change: say so in the PR |

## The contract

### JS hooks (data attributes)

| Attribute                | Where                   | Meaning                                   |
| ------------------------ | ----------------------- | ----------------------------------------- |
| `data-game`              | game area `<section>`   | Root element; holds the state classes     |
| `data-player`            | the character           | JS moves it and toggles `.is-jumping`     |
| `data-obstacles`         | obstacle container      | JS appends obstacles here                 |
| `data-obstacle-template` | `<template>`            | JS clones its contents to spawn obstacles |
| `data-score`             | `<output>`              | Live score                                |
| `data-final-score`       | `<output>` in game over | Score shown when the game ends            |
| `data-action="restart"`  | restart button          | Starts a new game                         |

### Position: JS writes numbers, CSS decides what they mean

| Custom property | Set on           | Meaning                                               |
| --------------- | ---------------- | ----------------------------------------------------- |
| `--player-y`    | `.player`        | Pixels above the ground. `0` = standing on the ground |
| `--x`           | each `.obstacle` | Pixels travelled from the right edge. Starts at `0`   |

CSS turns these into movement with `transform`. JS must never set `top`,
`left`, `bottom` or `right` directly.

### State classes (JS toggles them, design styles them)

| Class         | Applied to | When                            |
| ------------- | ---------- | ------------------------------- |
| `.is-ready`   | `.game`    | Before the first run            |
| `.is-playing` | `.game`    | While the game is running       |
| `.is-over`    | `.game`    | After a collision               |
| `.is-jumping` | `.player`  | While the character is airborne |

### Obstacle variants (optional feature)

JS may add `obstacle--tall` or `obstacle--small` to a spawned obstacle. Design
must style both.

### Hitboxes

Collision uses `getBoundingClientRect()`, so **the element's CSS box is the
hitbox**. Design: if you resize the player or obstacles, or add padding or
borders, tell the logic team.

## Rules

- JS selects by `data-*` attributes only, never by styling classes.
- CSS styles by classes only, never by `data-*` attributes.
- Work on a branch and open a PR. Don't commit directly to `main`.

## Running it

Open `index.html` in a browser. No build step.
