/**
 * Utility functions for formatting data across the QuickBill POS system.
 */

/**
 * Formats a date string into "DD-MM-YYYY | hh:mm AM/PM"
 * @param {string|Date} dateStr - The date string or Date object to format
 * @returns {string} - Formatted date string
 */
export const formatDateTime = (dateStr) => {
    if (!dateStr) return "--:--";

    try {
        const d = new Date(dateStr);

        // Check if valid date
        if (isNaN(d.getTime())) {
            return "Unknown Date";
        }

        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();

        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";

        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const strTime = `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;

        return `${day}-${month}-${year} | ${strTime}`;
    } catch (error) {
        console.error("Error formatting date:", error);
        return "Unknown Date";
    }
};

/**
 * Standardizes payment method display
 * @param {string} method - The raw payment method string
 * @returns {string} - Standardized payment method (Cash, Card, UPI)
 */
export const formatPaymentMethod = (method) => {
    if (!method) return "Unknown";

    const m = method.toLowerCase().trim();
    if (m === "upi" || m === "mobile_payment") return "UPI";
    if (m === "card" || m === "credit_card" || m === "debit_card") return "Card";
    if (m === "cash") return "Cash";

    // Default: Capitalize first letter
    return m.charAt(0).toUpperCase() + m.slice(1);
};
