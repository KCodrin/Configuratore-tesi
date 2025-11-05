# Data Persistence Schema (`localStorage`)

## Introduction

The browser's `localStorage` is the **central state management and persistence mechanism** for the entire "Thesis Configurator" application. It acts as a client-side "database," allowing it to:

1.  **Pass data between steps**: Each step is an isolated component that reads the configurations of previous steps from `localStorage` and writes its own choices for subsequent steps.
2.  **Maintain state between sessions**: A user can close the page and, upon reopening, find their configuration exactly as they left it.

This document provides a complete and detailed map of all the keys used, their meaning, and which components are responsible for reading and writing them.

---

## `localStorage` Keys Table

| Key                | Data Type | Example Value                        | Written By          | Primarily Read By      | Description                                                                 |
| --------------------- | --------- | ---------------------------------------- | ------------------- | ---------------------------- | --------------------------------------------------------------------------- |
| **--- Step 1 ---**    |           |                                          |                     |                              |                                                                             |
| `totalPages`          | `string`  | `"120"`                                  | `Step1Upload`       | `Step2Paper`, `Step3...`     | Total number of pages of the thesis PDF, extracted on upload.             |
| **--- Step 2 ---**    |           |                                          |                     |                              |                                                                             |
| `copieFronteRetro`    | `string`  | `"60"`                                   | `Step2Paper`        | `Step3PageColors`, Summaries | Number of physical sheets if printing is double-sided. Empty string if not active. |
| `frontespizioInterno` | `string`  | `"Sì"` or `"No"` (`"Yes"` or `"No"`)       | `Step2Paper`        | `Step3PageColors`, Summaries | Indicates if an internal cover page has been added.                         |
| `cartaInterna`        | `string`  | `"100g – Premium"`                       | `Step2Paper`        | Summaries                    | The name of the paper type selected for the internal pages.                 |
| `quantita`            | `string`  | `"3"`                                    | `Step2Paper`        | `Step4Binding`, Summaries    | The number of thesis copies to order.                                       |
| `bnPrice` / `colorPrice` | `string`  | `"0.20"` / `"0.50"`                    | `Step2Paper`        | `Step3PageColors`            | Per-page prices (B&W and color) based on the chosen paper.                  |
| **--- Step 3 ---**    |           |                                          |                     |                              |                                                                             |
| `pageColors`          | `string`  | `["bw", "color", ...]` (JSON)            | `Step3PageColors`   | `Step4Binding`, `Step6Review`  | JSON array that maps each page to its print color (`bw` or `color`).        |
| `bnPages` / `colorPages`| `string`  | `"80"` / `"40"`                          | `Step3PageColors`   | Summaries                    | Total count of B&W and color pages.                                         |
| **--- Step 4 ---**    |           |                                          |                     |                              |                                                                             |
| `rilegatura`          | `string`  | `"Rigide"` (`"Hardcover"`)                 | `Step4Binding`      | Summaries                    | Type of binding (currently fixed).                                          |
| `pacchetto`           | `string`  | `"Pacchetto Premium – da €22,50"`        | `Step4Binding`      | Summaries                    | Chosen binding package, includes the base price.                            |
| `rivestimentoGruppo`  | `string`  | `"Stile"` (`"Style"`)                      | `Step6Review`, Summaries    | Cover material group (e.g., "Metallic", "Leather").                         |
| `coloreCopertina`     | `string`  | `"Dark Blue"`                            | `Step4Binding`      | `Step6Review`, Summaries     | Specific cover color/material.                                              |
| `laminazione`         | `string`  | `"Oro"` (`"Gold"`)                         | `Step4Binding`      | `Step6Review`, Summaries     | Lamination color for the cover page text.                                   |
| `totalCost`           | `string`  | `"150.75"`                               | `Step4Binding`      | `Step5ExtraOptions`          | Total cost calculated after cover configuration (pages + cover).            |
| **--- Step 5 ---**    |           |                                          |                     |                              |                                                                             |
| `optAngoli`           | `string`  | `"1"` or `"0"`                           | `Step5ExtraOptions` | Summaries                    | `1` if metal corners have been added, otherwise `0`.                        |
| `optGirasole` (etc.)  | `string`  | `"1"` or `"0"`                           | `Step5ExtraOptions` | Summaries                    | `1` if the custom application was chosen. There is a key for each option.     |
| `finalTotal`          | `string`  | `"160.75"`                               | `Step5ExtraOptions` | `Step6Review`, `Step7Checkout` | Final order total, including all options.                                   |
| **--- Step 7 ---**    |           |                                          |                     |                              |                                                                             |
| `checkoutForm`        | `string`  | `"{ "billName": "Mario", ... }"` (JSON)  | `Step7Checkout`     | `Step7Checkout`              | JSON object containing all data entered in the checkout form.               |
