import { ethers } from 'ethers';

/**
 * Convert wei to ETH
 * @param {string|number} wei - Amount in wei
 * @returns {string} Formatted ETH amount
 */
export function weiToEth(wei) {
  try {
    if (!wei) return '0';
    const weiBigInt = typeof wei === 'string' ? BigInt(wei) : BigInt(wei);
    const eth = Number(weiBigInt) / 1e18;
    return eth.toFixed(4);
  } catch (error) {
    console.error('Error converting wei to ETH:', error);
    return '0';
  }
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Format JSON with proper indentation
 * @param {object} obj - Object to format
 * @returns {string} Formatted JSON string
 */
export function formatJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return String(obj);
  }
}

/**
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength = 20) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}

