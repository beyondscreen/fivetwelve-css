import sinon from 'sinon';
import expect from 'expect.js';

import objectAssign from 'object-assign';

if (!Object.assign) {
  Object.assign = objectAssign;
}

import {DmxDevice, DeviceGroup} from 'fivetwelve/es5';

import DeviceRegistry from '../lib/DeviceRegistry';
import CssCueLoader from '../lib/CssCueLoader';

describe('CssCueLoader', () => {
  describe('contructor()', () => {
    it('initializes', () => {
      let registry = sinon.createStubInstance(DeviceRegistry);
      registry.select = sinon.stub();

      let loader = new CssCueLoader(registry, '');

      expect(loader).to.be.a(CssCueLoader);
    });
  });

  describe('loadCss()', () => {
    it('loads the given css-code', () => {
      let registry = sinon.createStubInstance(DeviceRegistry),
        group = sinon.createStubInstance(DeviceGroup);

      group.setParams = sinon.spy();
      registry.select = sinon.stub();
      registry.select.returns(group);

      let loader = new CssCueLoader(registry);
      loader.loadCss('* { pan: 123; }');
      loader.setCue('.foo');

      expect(group.setParams.callCount).to.be(1);
      expect(group.setParams.firstCall.args[0]).to.eql({pan: 123});
    });
  });

  describe('runCue()', () => {
    it('applies generic global (global *-selector)', () => {
      let registry = sinon.createStubInstance(DeviceRegistry);
      registry.select = sinon.stub();

      let cssText = `
        /* match all devices */
        * {
          pan: 0; tilt: 0;
          color: magenta;
        }
      `;

      // setup test-subject and spies
      let deviceGroup = sinon.createStubInstance(DeviceGroup);
      deviceGroup.setParams = sinon.spy();
      registry.select.withArgs('*').returns(deviceGroup);

      let loader = new CssCueLoader(registry, cssText);
      loader.setCue('.foo');

      expect(registry.select.callCount).to.be(1);
      expect(deviceGroup.setParams.callCount).to.be(1);

      expect(deviceGroup.setParams.firstCall.args[0]).to.eql({
        pan: 0, tilt: 0, color: 'magenta'
      });
    });

    function createDeviceStub(id) {
      let device = sinon.createStubInstance(DmxDevice);
      device.__id = id;
      device.setParams = function(params) {
        Object.assign(device, params);
      };

      return device;
    }

    it('applies global values (global specifity and inheritance)', () => {
      // note: in order to test the setting of computed values, we need to
      // deal with real / not mocked device-groups.

      let cssText = `
        * { pan: 0; tilt: 0; dimmer: .2; }
        .spot { tilt: 30deg; dimmer: 1; color: magenta; }
        .wash { dimmer: .5; color: yellow; }
      `;

      let d1, d2, d3;
      let registry = new DeviceRegistry();
      registry.add(d1 = createDeviceStub('d1'), 'd1', ['spot']);
      registry.add(d2 = createDeviceStub('d2'), 'd2', ['wash']);
      registry.add(d3 = createDeviceStub('d3'), 'd2', ['other']);

      let loader = new CssCueLoader(registry, cssText);
      loader.setCue('.blubb');

      expect(d1.dimmer).to.be(1);
      expect(d2.dimmer).to.be(0.5);
      expect(d3.dimmer).to.be(0.2);
      expect(d2.pan).to.be(0);
      expect(d1.tilt).to.be(30);
    });

    it('applies cue-styles (inheritance, source-order, cue-selection)', () => {
      let cssText = `
        * { color: white; }

        .spot { color: magenta; }
        .wash { color: yellow; }
        .other { color: soilentgreen; }

        .test1 .wash { color: orange; }
        .test1 .left { color: mauve; }
        .test1 .spot { color: red; }

        .test1.cue1 .left { color: purple; }
        .test1.cue1 .spot { color: pink; }

        .test2 .spot { color: green; }
      `;

      let d1, d2, d3;
      let registry = new DeviceRegistry();
      registry.add(d1 = createDeviceStub('d1'), 'd1', ['spot', 'left']);
      registry.add(d2 = createDeviceStub('d2'), 'd2', ['wash', 'left']);
      registry.add(d3 = createDeviceStub('d3'), 'd2', ['other']);

      let loader = new CssCueLoader(registry, cssText);

      loader.setCue('.test1');
      expect(d1.color).to.be('red');
      expect(d2.color).to.be('mauve');
      expect(d3.color).to.be('soilentgreen');

      loader.setCue('.test1.cue1');
      expect(d1.color).to.be('pink');
      expect(d2.color).to.be('purple');
    });
  });
});
