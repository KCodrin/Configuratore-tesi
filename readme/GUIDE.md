# Thesis Configurator Project Guide

This document describes the project's features and structure in detail, step by step.

## Step 1: Thesis and Cover Page Upload

Step 1 is dedicated to uploading the necessary files for the thesis configuration: the main body of the document and the separate cover page.

### 1. Initial Screen and Thesis Upload

-   **Initial Layout:** On startup, the interface presents a single large upload area (drag-and-drop).
-   **Text (Copywriting):** The area invites the user to upload the "main Thesis file," specifying that they can drag the file or click to select it.
-   **Technical Constraint:** The maximum file size limit is explicitly mentioned, set at **100MB**.
-   **Functionality:** The user can upload a valid PDF file. A loading state is displayed during the upload and preview generation.

### 2. Post-Upload Layout

Once the thesis PDF has been successfully uploaded, the interface transforms into a two-column layout:

-   **Left Column (Thesis Preview):**
    -   Shows a preview of the first page of the uploaded PDF.
    -   Displays the file name.
    -   Includes a "Remove file" button to cancel the upload and return to the initial state.

-   **Right Column (Cover Page Upload):**
    -   A new upload area appears, stylistically identical to the previous one.
    -   The text invites the user to upload the "Cover Page file."
    -   **Note:** The 100MB limit is not shown for this section, as it is assumed to be a single-page file of a small size.
    -   Once uploaded, the preview, file name, and "Remove file" button are also displayed here. The two preview boxes are made visually consistent in height.

### 3. Header

The application header is sticky and contains two main elements:

-   **Progress Indicator:** In the center, the text `"Step 1 / 7"` informs the user of their position in the configuration process.
-   **Close Button (`X`):** Positioned on the right, it allows the user to attempt to exit the configuration.

### 4. Exit Modal

-   **Activation:** The modal opens by clicking the `X` button in the header.
-   **Content:**
    -   **Title:** `"Are you sure you want to exit?"`
    -   **Text:** `"All unsaved progress will be lost."`
-   **Actions (Vertical Buttons):**
    -   **Primary Button:** `"Continue configuration"`, which closes the modal and allows the user to stay on the page.
    -   **Secondary Button:** `"Leave configuration"`, stylistically less prominent, which (for now) also closes the modal.

### 5. Footer and Navigation

-   The footer is fixed at the bottom of the page.
-   It contains a single primary button: `"Next Step"`.
-   **Enabling Logic:** The button is **disabled** by default. It becomes clickable only when **both** files (main thesis and cover page) have been successfully uploaded.

### 6. Tips Box

Below the upload area, there is an information box that reassures the user about any imperfections in the cover page (page numbers, low-resolution logos), specifying that they will be manually corrected before the final printing.

## Step 2: Paper and Print Configuration

Step 2 allows the user to define the printing details for the internal pages of the thesis, select the paper type, and specify the desired number of copies.

### 1. Two-Column Layout

The interface is divided into two main sections for better organization of information:

-   **Left Column (Configuration Options):** Contains all the interactive choices for customization.
-   **Right Column (Information and Summary):** Shows a visual preview and a textual summary of the choices made.

### 2. Configuration Options (Left Column)

This area is grouped into a main card and divided into sections:

-   **Print Options:**
    -   **Double-sided printing:** A toggle switch that enables printing on both sides of the sheet, optimizing the number of sheets used.
    -   **Internal cover page:** A second switch to include a copy of the cover page as the first internal page of the thesis.

-   **Paper (internal pages):**
    -   A list of options (radio buttons) to choose the paper weight:
        -   `80g – Standard`: Basic paper.
        -   `100g – Premium`: Higher quality paper.
        -   `120g – Top`: Thicker and more robust paper.
    -   For each option, the costs per page are clearly displayed, both for black and white and color printing.

-   **Number of Copies:**
    -   A numeric input (`input type="number"`) to specify how many identical copies of the thesis are desired.

### 3. Summary and Preview (Right Column)

This column is `sticky` and remains visible during scrolling.

-   **Preview:** Shows the same preview of the first page of the thesis uploaded in Step 1, providing a constant visual reference.
-   **Configuration Summary:**
    -   A collapsible card, **closed by default**, that summarizes the current settings.
    -   Dynamically displays:
        -   The total number of pages (considering the possible addition of the internal cover page).
        -   The calculation of sheets needed for double-sided printing.
        -   The status of the internal cover page (Yes/No).
        -   The selected paper type.
-   **Price Estimate:**
    -   A card that shows the selected quantity and a "Free Shipping" notice.
    -   The total estimate remains a placeholder (`—`) at this stage.

### 4. Data Persistence

-   All choices made in this step (double-sided, internal cover page, paper type, quantity) are automatically saved in the browser's `localStorage`.

### 5. Footer and Navigation

-   The footer contains the `"Previous Step"` and `"Next Step"` buttons.
-   In Step 2, the `"Next Step"` button is always enabled.

## Step 3: Print Configuration

This step is crucial for defining the final cost of the thesis, allowing the user to specify the print color for each individual page.

### 1. Automatic Color Detection

-   **Core Functionality:** Upon entering the step, the application starts an automatic process that analyzes each page of the PDF to determine if it is black and white or color.
-   **User Feedback:** During the analysis, a loading state ("skeleton loader") is shown. Upon completion, a "toast" notification informs the user that the detection is complete.
-   **Objective:** This function serves to optimize costs by pre-selecting the most economical printing option for each page. The user can always manually change the choice.

### 2. Layout and Interface

This step also maintains a two-column layout:

-   **Left Column (Page Grid and Actions):**
    -   **Title:** `"Print Configuration"` with a description explaining the automatic analysis and the option for manual modification.
    -   **Page Grid:** Shows a preview for each page of the thesis (and the internal cover page, if selected).
        -   Each card shows the preview, page number, and two buttons (`B&W` / `Color`) for manual selection.
        -   Pages set to "Color" are easily recognizable thanks to a static gradient border.
    -   **Quick Actions:** A section with three buttons for bulk changes:
        -   `Automatic`: Reruns the color analysis.
        -   `All Black and White`: Sets all pages to B&W.
        -   `All Color`: Sets all pages to color.

-   **Right Column (Summary and Price Estimate):**
    -   The `sticky` column **no longer contains the thesis preview**.
    -   **Configuration Summary:** In addition to the data from Step 2, it now dynamically displays, and is **closed by default**:
        -   The exact count of "B&W Pages" and "Color Pages".
        -   The "Estimated cost (per copy)," calculated in real-time.
        -   Shows the exact list of pages (e.g., `1-5, 8, 12-15`) for each print type.
    -   **Price Estimate:** Shows the final "Total price estimate," which updates instantly with every change in the left column.

### 3. Double-Sided Conflict Management

-   **Validation Logic:** If the "Double-sided printing" option is active (from Step 2), the system checks that the pages that will go on the same sheet (e.g., pages 2 and 3) have the same color setting.
-   **Warning Banner:** If a conflict is detected, a warning banner appears describing the problem and offering two buttons for a quick resolution ("Both B&W," "Both Color").
-   **Navigation Block:** The `"Next Step"` button is **disabled** until all conflicts are resolved.

### 4. Data Persistence

-   The color selections for each page are saved in `localStorage`.

## Step 4: Binding and Finishes

This step allows for the aesthetic customization of the cover, with a dynamic preview and a detailed price estimate that includes quantity-based discounts.

### 1. Two-Column Layout

-   **Left Column (Configuration Options):** Contains the hierarchical selection for the cover.
-   **Right Column (Preview, Summary, Price Estimate):** The `sticky` column shows the visual result and the cost breakdown.

### 2. Configuration Options (Left Column)

The user chooses the cover's characteristics through a series of guided steps:

-   **Binding Type:** Currently locked on "Hardcover."
-   **Choose package:** The user selects a package (e.g., "Base," "Premium," "Gold").
-   **Choose the type of cover material:** Based on the package, the material categories are shown.
-   **Choose the color type:** The available color swatches are displayed.
-   **Choose the lamination type:** The user selects the color of the hot foil stamping for the cover page text.

### 3. Dynamic Preview (Right Column)

-   **Textured Background:** The preview area shows the texture of the chosen material and color in real-time.
-   **Laminated Cover Page:** The cover page uploaded in Step 1 is overlaid on the texture, with a CSS filter that simulates the chromatic effect of the lamination.
-   **Immediate Feedback:** Each selection instantly updates the preview.

### 4. Summary and Price Estimate (Right Column)

-   **Configuration Summary:** A collapsible card, **closed by default**, that summarizes all choices made up to this point.
-   **Detailed Price Estimate:**
    -   Shows a clear breakdown of costs: internal printing, cover cost, and discounts.
    -   **Cover discount:** A dynamic discount is applied **only to the cost of the covers** based on the quantity (2% for 2 copies, 3% for 3-4, etc.).
    -   The **"Total price estimate"** is updated in real-time.

### 5. Data Persistence

-   All choices related to the cover are saved in `localStorage`.

## Step 5: Extra Options

This step allows for adding final accessories and graphic customizations to the cover.

### 1. Layout and Interface

The interface is divided into two columns:

-   **Left Column (Configuration Options):** Contains the cards for selecting options.
-   **Right Column (Summary and Price Estimate):** A `sticky` column that updates costs in real-time. **There is no preview** in this step.

### 2. Configuration Options (Left Column)

-   **Standard Options:**
    -   **Headbands:** An informational card specifying that they are always included in the price.
    -   **Metal corners:** A card with a toggle switch to add corner protection at a fixed cost.

-   **Custom Application:**
    -   A dedicated section with a clear title.
    -   **Visual Grid:** Presents a series of options (e.g., "Sunflower," "Cherry Blossom") as "product cards." Each card shows an image of the application, its name, and price.
    -   **Exclusive Selection Logic:** The user can choose **only one** custom application at a time. Selecting a new option automatically deselects the previous one (behavior similar to a radio button). It is also possible to deselect the active option by clicking it again to have no application.

### 3. Summary and Price Estimate (Right Column)

-   **Configuration Summary:** The collapsible card, **closed by default**, now also includes the selected extra options (Metal corners, Custom application).
-   **Price Estimate:**
    -   Shows the base cost calculated in the previous steps.
    -   Dynamically adds the cost items for the selected extra options.
    -   The final **"Total price estimate"** is updated in real-time to reflect the sum of all costs.

### 4. Data Persistence

-   Choices related to extra options are saved in `localStorage`.

## Step 6: Final Review and Preview

This step offers a complete and interactive preview of the final product, allowing the user to virtually flip through the bound thesis.

### 1. Layout and Functionality

-   **Left Column (Preview Area):**
    -   Presents a static area with an invitation to open the full-screen preview.
    -   The `"Open full-screen preview"` button starts the interactive experience.
-   **Right Column (Summary and Price Estimate):**
    -   The `sticky` column shows the complete summary and the final price estimate, identical to what will be visible in the checkout step.

### 2. Interactive Modal (Flipbook)

-   **Activation:** Clicking the button opens a full-screen modal.
-   **Initial View:** Shows the front cover, rendered with the texture, color, and lamination effect chosen in Step 4.
-   **Navigation:**
    -   The user can "flip" through the thesis using the keyboard arrows or by clicking on the sides of the virtual book.
    -   The first "flip" opens the cover and reveals the first internal page.
-   **Page Content:**
    -   Each page shows the preview generated from the PDF.
    -   The color filter (B&W or Color) set in Step 3 is applied to each page.
    -   If double-sided printing was chosen, the blank pages on the back of odd-numbered sheets are displayed correctly.
-   **Purpose:** To offer a final, realistic review of the layout, colors, and overall appearance before proceeding to payment.

## Step 7: Details and Payment

The final step of the process, where the user enters billing, shipping, and payment details.

### 1. Two-Column Layout

-   **Left Column (Forms):** Contains all the necessary fields to finalize the order.
-   **Right Column (Summary and Payment):** A `sticky` column that shows the final summary and the fields for card details.

### 2. Input Forms (Left Column)

-   **Billing Details:** Fields for First Name, Last Name, Email, Phone.
-   **Shipping Details:** Fields for Street, Postal Code, City, and Province.
-   **Alternate Address:** A checkbox `"Ship to a different address?"` which, if activated, shows a second set of fields for the shipping address.
-   **Notes:** A text area for any additional comments.

### 3. Summary and Payment (Right Column)

-   **Order Summary:** A non-collapsible card that shows in detail **all the choices** made by the user in every previous step, including the details of color and B&W pages.
-   **Payment:**
    -   Fields for entering credit card details (Number, Expiry, CVV).
    -   Checkbox for accepting the Privacy Policy and Terms of Service.
    -   Optional checkbox for subscribing to the newsletter.

### 4. Footer and Navigation

-   In Step 7, the `"Next Step"` button in the footer is replaced by `"Proceed to Payment"`.
-   **Enabling Logic:** This button is **disabled** until the privacy policy checkbox is checked.

### 5. Data Persistence

-   All data entered in the forms is saved in `localStorage` to prevent loss of information if the page is reloaded.
