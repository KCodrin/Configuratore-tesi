# Thesis Configurator - Complete Developer Documentation

**Thesis Configurator** is a single-page web application (SPA) built with React and TypeScript that guides university students through the process of configuring, customizing, and ordering the printing of their thesis.

---

## Table of Contents

- [About The Project](#about-the-project)
- [Technology Stack](#technology-stack)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Component Analysis (Step by Step)](#component-analysis-step-by-step)
  - [App.tsx](#apptsx)
  - [Step 1: Upload](#step-1-upload)
  - [Step 2: Paper and Print](#step-2-paper-and-print)
  - [Step 3: Page Colors](#step-3-page-colors)
  - [Step 4: Binding](#step-4-binding)
  - [Step 5: Extra Options](#step-5-extra-options)
  - [Step 6: Final Review](#step-6-final-review)
  - [Step 7: Checkout](#step-7-checkout)
- [Related Guides](#related-guides)

## About The Project

The goal is to provide a smooth and intuitive user experience, offering immediate visual feedback (such as PDF and cover previews) and a price estimate that updates in real-time with every choice. The application does not require a backend and leverages the browser's `localStorage` for data persistence.

## Technology Stack

-   [React 19](https://react.dev/)
-   [TypeScript](https://www.typescriptlang.org/)
-   [TailwindCSS](https://tailwindcss.com/)
-   [pdf.js](https://mozilla.github.io/pdf.js/)

## Key Features

-   **7-Step Guided Flow**: A clear and defined path for the user.
-   **PDF Upload and Preview**: Users can upload their thesis and cover page files, with previews generated instantly in the browser.
-   **Real-time Price Estimate**: The total cost updates with every single change, providing full transparency.
-   **Automatic Color Detection**: Analysis of each PDF page to suggest the most economical printing option (B&W or Color).
-   **Double-Sided Conflict Management**: An intelligent validation system that prevents print configuration errors.
-   **Interactive Cover Preview**: A dynamic visualization of the cover that updates in real-time with material textures and lamination colors.
-   **Final "Flipbook" Preview**: An interactive 3D simulation of the finished book for a complete review before purchase.
-   **Full Persistence**: The entire configuration is saved in `localStorage`.

## Project Structure

```
/
├── public/
│   └── textures/         # Images for the covers
├── src/
│   ├── components/
│   │   ├── steps/
│   │   │   ├── Step1Upload.tsx
│   │   │   ├── ... (up to Step7)
│   │   │   └── ...
│   │   ├── ToggleSwitch.tsx
│   │   └── Toast.tsx
│   ├── App.tsx             # Root component, manages step navigation
│   ├── index.tsx           # React entry point
│   └── ...
├── index.html            # HTML shell, includes CDNs and Tailwind config
├── ARCHITECTURE.md
├── GUIDE.md
└── ... (other documentation files)
```

## Component Analysis (Step by Step)

### `App.tsx`

-   **Role**: Main container and orchestrator.
-   **Responsibilities**:
    -   Maintains the state of the current step (`currentStep`).
    -   Renders the active step's component.
    -   Manages the state of uploaded files (`thesisFile`, `frontispieceFile`).
    -   Renders the header, footer, and exit modal.
    -   Controls the enabling logic for navigation buttons.

### Step 1: Upload

-   **Component**: `Step1Upload.tsx`
-   **Responsibilities**:
    -   Handle the upload (drag-and-drop or selection) of the thesis and cover page PDF files.
    -   Use `pdf.js` to generate a preview of the first page of each file.
    -   Extract the total number of pages from the thesis and pass it to `App.tsx`.
    -   Validate that both files are present before enabling the next step.

### Step 2: Paper and Print

-   **Component**: `Step2Paper.tsx`
-   **Responsibilities**:
    -   Allow selection of paper type, printing options (double-sided, internal cover page), and quantity.
    -   Read `totalPages` from `localStorage`.
    -   Dynamically calculate the required number of sheets for double-sided printing.
    -   Save all choices and per-page costs (B&W and color) to `localStorage`.

### Step 3: Page Colors

-   **Component**: `Step3PageColors.tsx`
-   **Responsibilities**:
    -   On mount, analyze each page of the PDF to determine if it is color or B&W.
    -   Display a grid of previews for all pages.
    -   Allow the user to manually change the choice for each page.
    -   Implement validation logic for double-sided conflicts.
    -   Calculate the total printing cost per copy and the final estimate.
    -   Save the `pageColors` array to `localStorage`.

### Step 4: Binding

-   **Component**: `Step4Binding.tsx`
-   **Responsibilities**:
    -   Guide the user through the cascading selection of package, cover material, color, and lamination.
    -   Generate a dynamic preview of the cover, combining a background texture with the cover page image (made transparent) and a CSS filter to simulate lamination.
    -   Calculate the cost of the covers, applying quantity-based discounts.
    -   Save the choices to `localStorage`.

### Step 5: Extra Options

-   **Component**: `Step5ExtraOptions.tsx`
-   **Responsibilities**:
    -   Manage the selection of additional options like metal corners.
    -   Implement exclusive selection logic (radio-button style) for custom applications.
    -   Add the costs of extra options to the total and save the `finalTotal` to `localStorage`.

### Step 6: Final Review

-   **Component**: `Step6Review.tsx`
-   **Responsibilities**:
    -   Provide a final review point before payment.
    -   On click, open a full-screen modal with a "flipbook" preview.
    -   Dynamically generate previews of all pages (if not already done), applying the correct color filters.
    -   Simulate flipping through the bound book, showing the cover and internal pages.

### Step 7: Checkout

-   **Component**: `Step7Checkout.tsx`
-   **Responsibilities**:
    -   Display a complete and detailed summary of all chosen options.
    -   Provide forms for entering billing, shipping, and payment details.
    -   Manage the logic for an alternative shipping address.
    -   Validate the acceptance of the privacy policy to enable the final payment button.
    -   Save the form data to `localStorage`.

## Related Guides

For more details, please consult the following documents:

-   **[Documentation Index](./DOCUMENTATION_INDEX.md)**: The starting point for all documentation.
-   **[Project Architecture](./ARCHITECTURE.md)**: Diagrams and data flow.
-   **[Style Guide](./STYLE_GUIDE.md)**: Code and style conventions.
-   **[Data Persistence Schema](./DATA_PERSISTENCE.md)**: Details on `localStorage`.
-   **[Local Development Guide](./LOCAL_DEVELOPMENT.md)**: How to run the project.
