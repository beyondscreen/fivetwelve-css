# fivetwelve-css – control lighting using CSS

This is an initial draft-implementation of a possibility to use CSS to control ambient lighting and professional light-equipment.

It is written to work with the [fivetwelve dmx-control library](https://github.com/beyondscreen/fivetwelve).


## Usage

The CSS-parser currently only supports one or two levels of selectors (more on this later). So we can either select a device-group and applying static property values to it or selecting a group and values that only apply for a given scene.

```javascript
const registry = new DeviceRegistry();
// configure devices and add them to the registry
    
const loader = new CssCueLoader(registry, cssText);

// load the `.intro`-scene
loader.setCue('.intro');
    
// after two seconds switch to `.a-magician-appears` scene
setTimeout(() => loader.setCue('.a-magician-appears'), 2000);
```

So this is basically all functionality you need to build a simple lighting-control system for stage-lighting. Replace the timeout in the example with midi-events from a controller or a web-interface and you have your light-control software.



## Concept

### Background: DMX512

Stage-lighting is controlled using a robust and simple protocol named DMX512 which simply sends the very same 512 bytes of data (512 channels w/ one byte each) over and over again. Every device uses a fixed address within this array and usually interprets a single channel or a fixed number of channels starting at that address. Address collisions are prevented when assigning addresses to the devices. 
Every channel-value controls a feature of the device. These features could be things like the brightness, movement, a color-mixing unit, beam-shaping or any number of features that devices offer. What and how the single features work in terms of DMX-values is totally device-specific and is described in the device manual.


### Devices, DeviceGroups and DeviceRegistry

This solution maintains a queryable database for the light-fixtures called DeviceRegistry. This registry resembles the DOM when thinking about how light fixtures are selected (in fact, an upcoming version will likely use an actual dom-structure as central device-database, mostly replacing the registry).

Devices are added to the registry by providing the Device object along with an id and a list of classes. Queries are formed as CSS-selectors and the Registry returns a Device or DeviceGroup Object that is used to write properties to. Which of them doesn't matter because DeviceGroups use the exact same interface as the contained Devices, so properties written to a group are also written to every device in that group.

```javascript
const registry = new DeviceRegistry();
    
for(let {device, id, classlist} of deviceDefinitions) {
  registry.add(device, id, classList);
}
    
let groupOrDevice = registry.select('.spotlight.left');

// set to full brightness
groupOrDevice.brightness = 1;
```
    
So groups of devices are defined by adding the same classname to it. Classnames will usually establish a device-grouping by position (front, floor, backline), device-type (movinghead, fog, dimmer, motors), role and other properties.


### Property-Values: Defaults and Inheritance

For the first CSS-example we assume just a single property `brightness` that is shared by all devices (like for instance in a conventional theater-setup with only dimmable light-fixtures). We can immediately see the first great thing about using CSS to do this: There already are well-defined rules for how inheritance and overriding of property-values works, so if you know css you will probably know what is happening here without needing further documentation:

```css
/* default for all devices */
* { brightness: 0; }

/* bring the stage into a dim light */
.stage-base-lighting { brightness: .2; }
    
/* the stage-center should be in full light */
.stage-base-lighting.stage-center { brightness: .5; }
    
/* additional light from the left front */
.front-spots.left { brightness: 1; }
```
    

### Defining multiple Scenes

The previous example only describes a single static light setting. In order to describe multiple settings for a lightshow or to configure different light-presets for your home, we can simply add another level of selectors to the structure.

```css
/* base setting for all scenes */
.stage-base-lighting { brightness: .1; }

.a-magician-appears .stage-base-lighting.stage-center { brightness: .5; }
.a-magician-appears .front-spots.stage-left { brightness: 1; }
```

This new level of selectors can now be used to address any number of light settings. Think of this as styling a DOM-Structure like this:

```xml
<devices class="a-magician-appears">
    <device class="stage-base-lighting stage-left" />
    <device class="stage-base-lighting stage-center" />
    <device class="stage-base-lighting stage-right" />
    <device class="front-spots stage-left" />
    <device class="front-spots stage-center" />
    <device class="front-spots stage-right" />
</devices>
```

So the outer level can be used to select the light-preset that should be in effect while the inner-level is used to select the light-fixtures being styled.


### Combining cues/presets to compose scenes

With that in mind, it is also possible (and also mostly for free just by using the power of CSS) to define light-settings in partials, and using them by applying multiple classes at once on the outer level. This is especially useful when thinking of moving-head spotlights or other more complex light-setups. One could for instance define presets for colors, movement-positions, etc. independently and combine them together to create a final light-setting.


## TODO

As said in the beginning, this is just an early proof-of-concept implementation with a lot of open issues, inconsistencies and missing links. Some of them are described here.

### Reused DMX-channels and conflict-resolution

Devices might use a single channel to control multiple features 
that are represented by different CSS-properties. So, for instance, 
a lot of devices use a single channel for the mechanical shutter 
which exposes multiple parameters to the css (shutter, strobe, 
pulse). In this case there needs to be a way to define how these 
properties will interact with each other and which of the properties 
gets to control the final computed dmx channel-value.
   
The same goes for something that is often seen with gobos for 
moving-heads: Depending on the values of the gobo-selection channel 
the gobo-rotation-channel will either behave as fixed rotation for 
positioning or rotation speed for continous rotation. In this case a 
setting of the rotation-speed could overwrite a value for the 
rotation-position, depending on the operation-mode of the device.

A possible solution for this could be to use a parameter-model that is a bit closer to the dmx-channel layout, using keywords and combined properties (so for instance `gobo: stars rotating 1.5s` and `gobo: stars indexed 120deg`) that are mapped to the corresponding channel-values (this could be implemented similar to how colors are handled by exposing objects as property-values).


### other TODOs, unsorted

 * Think about how generalized parameters (maybe parameter-groups?) 
   could be defined such that: 
   - parameters could have a shorthand-property
   - a single parameter-instance can expose multiple css-parameters 
     (like a gobo-parameter exposing gobo-rotation, gobo-position, 
     gobo-motive, ..)
   - parameters can export some sort of function to be called by the 
     css during style-calculation (think of properties like transform,
     filter, ...)
   - conflicts are predictably resolved
   - have a look at browser-implementations for how the background-
     property is interpreted for inspiration.

 * There should be something like the element-styles in the DOM/CSS, 
   making it easier to combine programmed animations with more static 
   CSS couterparts. This could be done by interpreting all settings 
   from CSS in a different way than settings that were manually 
   applied.

 * In fivetwelve there should be a way to add a calibration-stage for 
   property-values so that setting the same value via css will 
   result in the same behaviour across devices (think color-temperature 
   differences between devices etc).

 * have a look at how css-implementations of browsers could be 
   exploited to do computed style calculations for us.
     
 * Transitions and Animations should be implemented. A first rough 
   version could simply use an animation-loop and basic keyframe-
   animations with linear interpolation. Edge-cases here could be 
   tricky.
   
 * Support the composes-property from the CSS-modules syntax proposed 
   by Glen Maddern et al at to make it easier to compose scenes from 
   existing more granular presets/cues.
