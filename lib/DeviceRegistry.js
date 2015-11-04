import {DeviceGroup} from 'fivetwelve/es5';

import 'array.from';


/**
 * The device-registry is used to allow random access to a bigger collection
 * of devices. This borrows the simple idea of ids and classnames from the DOM
 * to make devices selectable. Every device added to the registry is associated
 * with an id and a list of classnames. Devices or devicegroups are then
 * selected using css-selector syntax.
 */
export default class DeviceRegistry {
  /**
   * Creates a DeviceRegistry.
   */
  constructor() {
    /**
     * @type {Array.<DmxDevice>}
     */
    this.devices = [];
    /**
     * @type {Object.<String, Array.<DmxDevice>>} maps device-names to devices
     *   having that device-name.
     */
    this.devicesByClass = {};
    /**
     * @type {Object.<String, DmxDevice>} maps device-ids to devices.
     */
    this.devicesById = {};
  }

  /**
   * Returns a device-group containing all registered devices.
   * @returns {DeviceGroup} that group.
   */
  getAll() {
    return new DeviceGroup(this.devices);
  }

  /**
   * Selects a list of fixtures.
   * @param {String} selector A selector-string. Only class and id-selectors
   *   are implemented for now.
   * @returns {DmxDevice|DeviceGroup} The selected device or device-group.
   */
  select(selector) {
    if (selector === '*') {
      return new DeviceGroup(this.devices);
    }

    if (!selector.match(/([\.#][\w]+)+/)) {
      throw new Error('unsupported selector-type');
    }

    if (selector.charAt(0) === '#') {
      return this.devicesById[selector.slice(1)];
    }

    // selector lookup, only same-element class-selectors here
    let classes, devices;

    classes = selector.split('.').slice(1);
    devices = intersect(classes.map(cls => this.devicesByClass[cls] || []));

    return new DeviceGroup(devices);
  }

  /**
   * Adds a device to the registry.
   * @param {DmxDevice} device
   * @param {String} id
   * @param {Array.<String>} classList
   */
  add(device, id, classList = []) {
    this.devices.push(device);
    this.devicesById[id] = device;

    classList.forEach(c => {
      if (!this.devicesByClass[c]) {
        this.devicesByClass[c] = [];
      }

      this.devicesByClass[c].push(device);
    });
  }
}


/**
 * get an array of all elements found in all of the passed arrays.
 * @template T
 * @param {Array.<Array.<T>>} arrays a list of arrays to intersect.
 * @returns {Array.<T>} the elements found in all arrays.
 */
function intersect(arrays) {
  if (arrays.length < 2) {
    return arrays[0] || [];
  }

  let res = [];
  arrays[0].forEach(el => {
    if (arrays.every(arr => arr.indexOf(el) !== -1)) {
      res.push(el);
    }
  });

  return res;
}
