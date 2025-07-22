import * as state from './state.js';

/**
 * Get a profile by ID.
 * @param {number} id
 * @returns {object|null}
 */
export function getProfileById(id) {
  return state.getProfiles().find(p => p.id === id) || null;
}

/**
 * Get all profiles.
 * @returns {Array}
 */
export function getAllProfiles() {
  return state.getProfiles();
}

/**
 * Add a new profile.
 * @param {object} profile
 */
export function addProfile(profile) {
  state.addProfiles([profile]);
}

/**
 * Edit a profile by ID.
 * @param {number} id
 * @param {object} newData
 */
export function editProfile(id, newData) {
  state.editProfile(id, newData);
}

/**
 * Delete a profile by ID.
 * @param {number} id
 */
export function deleteProfile(id) {
  state.deleteProfile(id);
}

/**
 * Set the selected profile by ID.
 * @param {number} id
 */
export function setSelectedProfile(id) {
  state.setSelectedProfile(id);
}

/**
 * Get the currently selected profile.
 * @returns {object|null}
 */
export function getSelectedProfile() {
  return state.getSelectedProfile();
}
