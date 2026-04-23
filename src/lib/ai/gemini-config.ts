// Centralized Gemini API configuration
// Update these model IDs if your Google AI API requires different versions

export const GEMINI_TEXT_MODEL = 'gemini-3-flash-preview';
export const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export const GEMINI_TEXT_API = `${BASE_URL}/${GEMINI_TEXT_MODEL}:generateContent`;
export const GEMINI_IMAGE_API = `${BASE_URL}/${GEMINI_IMAGE_MODEL}:generateContent`;
