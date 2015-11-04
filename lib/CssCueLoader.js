import rework from 'rework';

// this is a 100% hacked implementation, if you're having WTF-moments
//reading this you are probably right :)

/**
 * The cue-loader manages parsing of css-text and applying cues to devices
 * stored in the registry.
 */
export default class CssCueLoader {
  constructor(registry, cssText = '') {
    this.registry = registry;
    this.currentCue = '';
    this.cues = null;

    if (cssText.length > 0) {
      this.loadCss(cssText);
    }
  }

  loadCss(cssText) {
    this.cues = this.parseCss(cssText);

    if (this.currentCue !== '') {
      this.setCue(this.currentCue);
    }
  }

  setCue(selector) {
    this.currentCue = selector;

    if (!this.cues) {
      return;
    }

    // this would normally be a sorted list of cues matching the given selector,
    // sorted by specifity and source-order.
    let activeCues = [];

    // iterating through selectors in ascending specifity-order
    let cueSelectors = Object.keys(this.cues);
    cueSelectors.sort(CssCueLoader.compareSpecificity);

    cueSelectors.forEach(cueSelector => {
      if (!this.selectorMatches(selector, cueSelector)) {
        return;
      }

      activeCues.push(this.cues[cueSelector]);
    });

    // as devices might be members of multiple groups, it is not that easy to
    // build up a computed style per device. However, if we just apply all
    // active selectors in ascending order of specifity, we will end up with
    // all devices having the proper values set, as all of this happens
    // synchronously we also don't need to worry about temporarily writing the
    // wrong values to the device
    activeCues.forEach(cue => {
      // specifity is for now just the number of classes in the declaration (we
      // don't support anything else than class-selectors). (sorting is stable,
      // so source-order is preserved.
      cue.sort((a, b) => {
        return a.deviceSelector.split('.').length -
          b.deviceSelector.split('.').length;
      });

      cue.forEach(setting => {
        setting.deviceGroup.setParams(setting.declaredParams);
      });
    });
  }

  selectorMatches(selector, cueSelector) {
    let selectorClasses = selector.split('.').slice(1),
      cueClasses = cueSelector.split('.').slice(1);

    // if all classes of the cue can be found in the selector, this is a match.
    let allCueClassesMatched = cueClasses.reduce((res, cls) => {
      return res && selectorClasses.indexOf(cls) !== -1;
    }, true);

    //console.log('classes', selectorClasses, cueClasses, allCueClassesMatched);
    return allCueClassesMatched;
  }

  parseCss(cssText) {
    let rules = rework(cssText).obj.stylesheet.rules
        .filter(rule => rule.type === 'rule');

    return this.parseCues(rules);
  }

  parseCues(rules) {
    let cues = {};

    rules.forEach(rule => {
      rule.selectors.forEach(s => {
        // all selectors have one or two levels, if one-level, they simply
        // describe defaults for the whole show for a device-selection. Two
        // levels always have the scene selector first and device-selector
        // second.
        let [cueSelector, deviceSelector] = s.split(/\s/);

        if (!deviceSelector) {
          deviceSelector = cueSelector;
          cueSelector = '*';
        }

        if (!cues[cueSelector]) {
          cues[cueSelector] = [];
        }

        let deviceGroup = this.registry.select(deviceSelector);
        let declaredParams = {};
        rule.declarations.forEach(({property, value}) => {
          let tmp = parseFloat(value.replace(/(-?(\d+)?(?:\.\d+)?).*$/, '$1'));
          declaredParams[property] = isNaN(tmp) ? value : tmp;
        });

        // skip not matching selectors
        if (deviceGroup) {
          cues[cueSelector].push({
            deviceGroup, deviceSelector, declaredParams
          });
        }
      });
    });

    return cues;
  }

  /**
   * Compare specificity of two selectors. Returns a positive value if is
   * selectorA is more specific, a negative value if B is more specific and
   * zero if both have the same specificity.
   *
   * @param {String} selectorA
   * @param {String} selectorB
   * @returns {number}
   */
  static compareSpecificity(selectorA, selectorB) {
    // dummy-implementation supporting only class-selectors...
    return selectorA.split('.').length - selectorB.split('.').length;
  }
}
