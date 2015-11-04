import sinon from 'sinon';
import expect from 'expect.js';

import DeviceRegistry from '../lib/DeviceRegistry';
import {DmxDevice, DeviceGroup} from 'fivetwelve/es5';

describe('DeviceRegistry', () => {
  let devices;
  beforeEach(() => {
    devices = [
      sinon.createStubInstance(DmxDevice),
      sinon.createStubInstance(DmxDevice),
      sinon.createStubInstance(DmxDevice),
      sinon.createStubInstance(DmxDevice),
      sinon.createStubInstance(DmxDevice),
      sinon.createStubInstance(DmxDevice)
    ];
  });

  it('can add and query elements', () => {
    let registry = new DeviceRegistry();

    registry.add(devices[0], 'dev0', ['spot', 'front', 'left']);
    registry.add(devices[1], 'dev1', ['spot', 'back', 'left']);
    registry.add(devices[2], 'dev2', ['spot', 'front', 'right']);
    registry.add(devices[3], 'dev3', ['spot', 'back', 'right']);

    let res = registry.select('.spot');
    expect(res).to.be.a(DeviceGroup);
    expect(res.devices).length(4);

    res = registry.select('.spot.left');
    expect(res.devices).length(2);
    expect(res.devices[0]).to.be(devices[0]);
    expect(res.devices[1]).to.be(devices[1]);

    res = registry.select('.spot.front.right');
    expect(res.devices).length(1);
    expect(res.devices[0]).to.be(devices[2]);

    res = registry.select('*');
    expect(res.devices).length(4);

    res = registry.getAll();
    expect(res.devices).length(4);
  });
});
