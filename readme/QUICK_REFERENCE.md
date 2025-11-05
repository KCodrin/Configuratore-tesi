# Quick Reference Guide

This guide contains the most frequently used information in the project for quick access.

## Color Palette (`tailwind.config`)

| Name              | Value          | Usage                                   |
| ----------------- | --------------- | --------------------------------------- |
| `primary`         | `#137fec`       | Main color for buttons, links, accents. |
| `background-light`| `#f6f7f8`       | Main background in light mode.          |
| `background-dark` | `#101922`       | Main background in dark mode.           |
| `card-light`      | `#ffffff`       | Card background in light mode.          |
| `card-dark`       | `#1b2734`       | Card background in dark mode.           |
| `subtle-light`    | `#e5e7eb`       | Borders, dividers in light mode.        |
| `subtle-dark`     | `#374151`       | Borders, dividers in dark mode.         |
- **Text**: `foreground-light/dark`, `muted-light/dark`

## Main `localStorage` Keys

This is a list of the most important keys saved in `localStorage`. For a comprehensive list, see **[DATA_PERSISTENCE.md](./DATA_PERSISTENCE.md)**.

| Key                | Example Value                        | Written By          | Description                                           |
| --------------------- | ---------------------------------------- | ------------------- | ----------------------------------------------------- |
| `totalPages`          | `"120"`                                  | `Step1Upload`       | Total number of pages in the thesis PDF.              |
| `copieFronteRetro`    | `"60"`                                   | `Step2Paper`        | Number of sheets if printing is double-sided.         |
| `cartaInterna`        | `"100g – Premium"`                       | `Step2Paper`        | Selected paper type for the internal pages.           |
| `bnPrice` / `colorPrice` | `"0.20"` / `"0.50"`                      | `Step2Paper`        | Per-page prices based on the chosen paper.            |
| `pageColors`          | `["bw", "color", "color", ...]`          | `Step3PageColors`   | Array mapping the print color for each page.          |
| `pacchetto`           | `"Pacchetto Premium – da €22,50"`        | `Step4Binding`      | Chosen binding package.                               |
| `coloreCopertina`     | `"Dark Blue"`                            | `Step4Binding`      | Cover color/material.                                 |
| `totalCost`           | `"150.75"`                               | `Step4Binding`      | Partial cost after cover configuration.               |
| `finalTotal`          | `"160.75"`                               | `Step5ExtraOptions` | Final cost after adding extra options.                |
| `checkoutForm`        | `"{ "billName": "Mario", ... }"`         | `Step7Checkout`     | JSON data from the billing/shipping form.             |

## Main Helper Functions

| Function               | Source File         | Purpose                                                                  |
| ---------------------- | ------------------- | ------------------------------------------------------------------------ |
| `getLS(...keys)`       | All steps           | Reads a value from `localStorage`, trying multiple keys in order.        |
| `fmtEuro(n)`           | All steps           | Formats a number into a currency string (e.g., `€12.34`).                |
| `compressPageNumbers(indices)` | `Step3PageColors`, `Step7Checkout` | Converts an array of page indices into a compact string (e.g., `1-5, 8`). |
| `normalizePackName(p)` | All steps           | Removes the price from the package name for display.                     |
| `getDiscountPercentage(qty)`| `Step4Binding`      | Calculates the discount percentage based on quantity.                  |

## Key Data Structures

-   **`PageColor[]`**: `('bw' | 'color')[]`
    -   An array where the index corresponds to the page index (0-based) and the value indicates the print type.
    -   This is the central data structure for calculating printing costs.
    -   Generated in `Step3PageColors`.

-   **`Conflict`**: `{ sheet: number; left: number; right: number; ... } | null`
    -   An object that describes a double-sided printing conflict in `Step3PageColors`.
    -   Contains the page numbers and color settings that cause the conflict.
