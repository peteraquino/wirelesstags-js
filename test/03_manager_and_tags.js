"use strict";

var tagManager;
var credentialsMissing = true;
var tags = [];

/*
 * Test functions of the tag manager object
 */

describe('WirelessTagManager:', function() {

    var WirelessTagPlatform,
        WirelessTag,
        platform;

    before('load and connect to platform, find tag manager(s)', function(done) {
        WirelessTagPlatform = require('../');
        WirelessTag = require('../lib/tag');

        // create platform object, register listeners
        platform = WirelessTagPlatform.create();
        platform.on('discover', (manager) => {
            // right now we only need one tag manager for testing
            if (tagManager === undefined) tagManager = manager;
            done();
        });

        // load connection options, then connect
        let connOpts = WirelessTagPlatform.loadConfig();
        if ((connOpts.username && connOpts.password) || connOpts.bearer) {
            credentialsMissing = false;
            platform.connect(connOpts).then(
                (pf) => pf.discoverTagManagers()
            ).catch((e) => {
                console.error(e.stack ? e.stack : e);
                throw e;
            });
        } else {
            // signal we're done - without connecting there's no discovering
            done();
        }
    });

    describe('#mac', function() {
        it('a string, its (unique) MAC address', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            expect(tagManager.mac).to.be.a('string').
                and.to.have.length.within(10, 14);     // 12 in theory?
        });
        it('should be read-only', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(() => { tagManager.mac = "JX" }).to.throw(TypeError);
        });
    });
    describe('#name', function() {
        it('a string, its (user-assigned) name', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(tagManager.name).to.be.a('string').
                and.to.not.be.empty;
        });
    });
    describe('#online', function() {
        it('a boolean, whether it is online', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            expect(tagManager.online).to.be.a('boolean');
        });
        it('should be read-only', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(() => { tagManager.online = false }).to.throw(TypeError);
        });
    });
    describe('#selected', function() {
        it('a boolean, whether it is currently selected', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            expect(tagManager.selected).to.be.a('boolean');
        });
        it('should be read-only', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(() => { tagManager.selected = false }).to.throw(TypeError);
        });
    });
    describe('#wirelessConfig', function() {
        it('an object, wireless communication settings', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            expect(tagManager.wirelessConfig).to.be.a('object');
        });
        it('should have at least a certain list of properties', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            expect(tagManager.wirelessConfig).to.have.all.keys(
                'dataRate',
                'activeInterval',
                'Freq',
                'useCRC16',
                'useCRC32',
                'psid');
        });
    });
    describe('#radioId', function() {
        it('a string, its (unique?) radio identity (freq band?)', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(tagManager.radioId).to.be.a('string').
                and.to.not.be.empty;
        });
        it('should convert to a float between 100-200', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            // normally these are around 150
            expect(Number(tagManager.radioId)).to.be.within(100, 200);
        });
        it('should be read-only', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(() => { tagManager.radioId = 0 }).to.throw(TypeError);
        });
    });
    describe('#rev', function() {
        it('a number, should be its revision', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            expect(tagManager.rev).to.be.a('number').
                and.to.be.below(256);     // byte
        });
        it('should be read-only', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(() => { tagManager.rev = 0 }).to.throw(TypeError);
        });
    });
    describe('#dbid', function() {
        it('a number, should be its sequential id', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            expect(tagManager.rev).to.be.a('number').
                and.to.be.below(256);     // byte
        });
        it('should be read-only', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(() => { tagManager.dbid = 0 }).to.throw(TypeError);
        });
    });

    describe('#select()', function() {
        it('should promise to select it for API calls - happens automatically',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               return expect(tagManager.select()).
                   to.eventually.equal(tagManager);
           });
        it('property "selected" should be true afterwards', function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               return expect(tagManager.selected).to.be.true;
        });
    });

    describe('#discoverTags()', function() {
        let discoverSpy = sinon.spy();
        let discoverHandler = (tag) => tags.push(tag);

        it('should promise an array of tags associated with it', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tagManager.on('discover', discoverSpy);
            tagManager.on('discover', discoverHandler);
            return expect(tagManager.discoverTags()).
                to.eventually.satisfy((tagList) => {
                    return tagList.reduce((state, tag) => {
                        return state && (tag instanceof WirelessTag);
                    }, tagList.length > 0);
                });
        });
        it('should emit "discover" event for each associated tag', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tagManager.removeListener('discover', discoverSpy);
            tagManager.removeListener('discover', discoverHandler);

            expect(discoverSpy).to.have.always.been.calledWith(
                sinon.match.instanceOf(WirelessTag));
        });
    });

    describe('#findTagById()', function() {
        let discoverSpy = sinon.spy();

        it('should promise the tag with the given slaveId', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tagManager.on('discover', discoverSpy);
            let tagToTest =
                tags.length > 0 ? tags[tags.length-1] : { slaveId: 0, uuid: '0' };
            let findReq = tagManager.findTagById(tagToTest.slaveId);

            return expect(findReq.then((tag) => tag.uuid)).
                to.eventually.equal(tagToTest.uuid);
        });
        it('should reject if there is no tag with the given slaveId', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(tagManager.findTagById(255)).
                to.be.rejectedWith(WirelessTagPlatform.InvalidOperationError);
        });
        it('should not emit "discover" event for tags found', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tagManager.removeListener('discover', discoverSpy);
            return expect(discoverSpy).to.have.not.been.called;
        });
    });

});

/*
 * Test functions of the tag object
 */

describe('WirelessTag:', function() {

    var WirelessTagSensor;
    var WirelessTag;
    var focusTag;

    before('load modules', function() {
        WirelessTagSensor = require('../lib/sensor');
        WirelessTag = require('../lib/tag');

        // find the physical tag with the most recent time of last update
        let physTags = tags.filter((t) => t.isPhysicalTag());
        focusTag = physTags[0];
        physTags.forEach((t) => {
            if (t.lastUpdated() > focusTag.lastUpdated()) focusTag = t;
        });
    });

    describe('#uuid', function() {
        it('a string, its unique identifier as a UUID', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tags.map((tag) => { return tag.uuid }).forEach((value) => {
                expect(value).to.be.a('string').and.have.lengthOf(36);
            });
        });
        it('should be read-only', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(() => { tags[0].uuid = "xzy" }).to.throw(TypeError);
        });
    });

    describe('#name', function() {
        it('a string, its (user-assigned) name', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tags.map((tag) => { return tag.name }).forEach((value) => {
                return expect(value).to.be.a('string').and.to.not.be.empty;
            });
        });
    });

    describe('#slaveId', function() {
        it("a number, its unique 8-bit number among the tag manager's tags",
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               tags.map((tag) => { return tag.slaveId }).forEach((value) => {
                   return expect(value).to.be.a('number').and.to.be.below(256);
               });
           });
        it('should be read-only', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(() => { tags[0].slaveId = -1 }).to.throw(TypeError);
        });
    });

    describe('#alive', function() {
        it('a boolean, whether it is "alive"', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tags.map((tag) => { return tag.alive }).forEach((value) => {
                return expect(value).to.be.a('boolean');
            });
        });
        it('should be read-only', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(() => { tags[0].alive = false }).to.throw(TypeError);
        });
    });

    describe('#tagType', function() {
        it('a number, an 8-bit code for its hardware type', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tags.map((tag) => { return tag.tagType }).forEach((value) => {
                return expect(value).to.be.a('number').and.to.be.below(256);
            });
        });
        it('should be read-only', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(() => { tags[0].tagType = 0 }).to.throw(TypeError);
        });
    });

    describe('#rev', function() {
        it('a number, an 8-bit code for its hardware revision', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tags.map((tag) => { return tag.rev }).forEach((value) => {
                return expect(value).to.be.a('number').and.to.be.below(256);
            });
        });
        it('should be read-only', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(() => { tags[0].rev = 0 }).to.throw(TypeError);
        });
    });

    describe('#updateInterval', function() {
        it('a number, interval between updates in seconds', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tags.map((tag) => {
                return tag.updateInterval;
            }).forEach((value) => {
                return expect(value).to.be.a('number').and.to.be.within(10,
                                                                        7200);
            });
        });
    });

    describe('#lowPowerMode', function() {
        it('a boolean, whether low power mode is enabled', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tags.map((tag) => {
                return tag.lowPowerMode;
            }).forEach((value) => {
                return expect(value).to.be.a('boolean');
            });
        });
    });

    describe('#sensorCapabilities()', function() {
        it('array of strings, sensor types the tag has', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tags.forEach((tag) => {
                tag.sensorCapabilities().forEach((cap) => {
                    expect(cap).to.be.a('string');
                    let funcNameLower = 'has' + cap + 'sensor';
                    let capFuncName;
                    for (let k in tag) {
                        if (k.toLowerCase() === funcNameLower) {
                            capFuncName = k;
                            break;
                        }
                    }
                    expect(capFuncName).to.not.equal(undefined);
                    expect(tag[capFuncName]).to.be.a('function');
                    expect(tag[capFuncName]()).to.equal(true);
                });
            });
        });
    });

    describe('#hardwareFacts()', function() {
        it('array of facts that are true for the tag', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tags.forEach((tag) => {
                tag.hardwareFacts().forEach((feat) => {
                    expect(feat).to.be.a('string');
                    expect(tag[feat]).to.be.a('function');
                    expect(tag[feat]()).to.equal(true);
                });
            });
        });
    });

    describe('#lastUpdated()', function() {
        it('a Date, time when the tag data were last updated', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tags.map((tag) => {
                return tag.lastUpdated();
            }).forEach((theDate) => {
                return expect(theDate).to.be.instanceOf(Date);
            });
        });
        it('should not be much older than the updateInterval', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            // Ideally we could choose a relatively tight tolerance.
            // However, we're testing whether this library works, not
            // the reliability of the hardware.
            function tolerance(interval) {
                const minTol = 30000;                // at least 30sec
                let tol = interval * 1000 * 0.20;    // or 20% of interval
                return (tol > minTol) ? tol : minTol;
            }

            let tagsToTest = tags.filter((t) => t.isPhysicalTag());
            tagsToTest.forEach((tag) => {
                expect(tag.lastUpdated().getTime()).
                    to.be.at.least(Date.now()
                                   - tag.updateInterval * 1000
                                   - 55 * 1000 /* time cloud is about behind */
                                   - tolerance(tag.updateInterval));
            });
        });
    });

    describe('#update()', function() {
        let dataSpy = sinon.spy();
        let tag;

        it("should promise tag with data updated to latest in cloud",
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               // initialize a new object with only the slaveId set, then
               // test whether it gets its data updated
               tag = new WirelessTag(tagManager,
                                     { slaveId: focusTag.slaveId });
               tag.on('data', dataSpy);

               return expect(tag.update()).to.eventually.satisfy((t) => {
                   return (t.lastUpdated() - tag.lastUpdated()) === 0;
               });
           });
        it('should emit \'data\' event if data is updated', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tag.removeListener('data', dataSpy);
            return expect(dataSpy).to.have.been.calledOnce;
        });
        it("should promise tag with same data if already latest in cloud",
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let prevUpdated = tag.lastUpdated();
               dataSpy = sinon.spy();
               tag.on('data', dataSpy);

               return expect(tag.update()).to.eventually.satisfy((t) => {
                   return (t.lastUpdated() - prevUpdated) === 0;
               });
           });
        it('should not emit \'data\' event if data did not change', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            return expect(dataSpy).to.not.have.been.called;
        });
    });

    describe('#liveUpdate()', function() {
        let dataSpy = sinon.spy();
        let discoverSpy = sinon.spy();
        let tag;

        it("should promise tag updated to current data from actual tag",
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               // allow more time for this test - sometimes needed
               this.timeout(15 * 1000);

               tag = focusTag;
               let prevUpdated = tag.lastUpdated();
               tag.on('data', dataSpy);
               tag.on('discover', discoverSpy);

               return expect(tag.liveUpdate().then((t) => t.lastUpdated().getTime())).
                   to.eventually.be.above(prevUpdated.getTime());
           });
        it('should emit \'data\' event due to data update', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tag.removeListener('data', dataSpy);
            return expect(dataSpy).to.have.been.calledOnce;
        });
        it('should not trigger sensor discovery', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tag.removeListener('discover', discoverSpy);
            return expect(discoverSpy).to.not.have.been.called;
        });
    });

    describe('#createSensor()', function() {
        let discoverSpy = sinon.spy();
        let tag;
        let sensor;

        it("should create sensor object for the given type", function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            // choose the tag with the least sensors
            let physTags = tags.filter((t) => t.isPhysicalTag());
            tag = physTags[0];
            let l = tag.sensorCapabilities().length;
            for (let t of physTags) {
                if (t.sensorCapabilities().length < l) {
                    tag = t;
                }
            }

            tag.on('discover', discoverSpy);
            sensor = tag.createSensor('signal');
            expect(sensor instanceof WirelessTagSensor).to.equal(true);
            expect(sensor.sensorType).to.equal('signal');
            expect(sensor.wirelessTag).to.equal(tag);
        });
        it('should not emit "discover" event for sensor created this way', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tag.removeListener('discover', discoverSpy);
            return expect(discoverSpy).to.not.have.been.called;
        });
        it('should fail for sensor type not supported by the tag', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            let uncommon = ['water','moisture','light','humidity'];
            let unsupported = uncommon.filter(
                (stype) => tag.sensorCapabilities().indexOf(stype) < 0
            );
            let f = () => tag.createSensor(unsupported[0]);
            expect(f).to.throw(Error, /does not support .+ sensor/);
        });
    });

    describe('#initializeSensor()', function() {
        let discoverSpy = sinon.spy();
        let tag;
        let sensor;

        it("should obtain sensor object for the given type", function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            // choose a physical tag with a temperature sensor
            let physTags = tags.filter((t) => t.isPhysicalTag() && t.hasTempSensor());
            if (physTags.length === 0) return this.skip();

            tag = physTags[0];
            tag.on('discover', discoverSpy);

            return expect(tag.initializeSensor('temp')).
                to.eventually.be.an.instanceof(WirelessTagSensor);
        });
        it('should emit "discover" event for sensor created this way', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tag.removeListener('discover', discoverSpy);
            if (discoverSpy.firstCall && discoverSpy.firstCall.args[0]) {
                sensor = discoverSpy.firstCall.args[0];
            }
            return expect(discoverSpy).to.have.been.calledOnce;
        });
        it('obtained sensor object should now be cached as property', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            expect(tag.tempSensor).to.not.equal(undefined);
            if (sensor) expect(tag.tempSensor).to.equal(sensor);
            expect(tag.signalSensor).to.equal(undefined);
        });
        it("should yield cached object when invoked for same sensor type again", function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            if (! sensor) sensor = tag.tempSensor;
            discoverSpy.reset();
            tag.on('discover', discoverSpy);
            return expect(tag.initializeSensor('temp')).
                to.eventually.equal(sensor);
        });
        it('should not emit "discover" event when sensor was cached', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tag.removeListener('discover', discoverSpy);
            return expect(discoverSpy).to.not.have.been.called;
        });
        it('should fail for sensor type not supported by the tag', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            let uncommon = ['water','moisture','light','humidity'];
            let unsupported = uncommon.filter(
                (stype) => tag.sensorCapabilities().indexOf(stype) < 0
            );
            let f = () => tag.initializeSensor(unsupported[0]);
            expect(f).to.throw(Error, /does not support .+ sensor/);
        });
    });

    describe('#discoverSensors()', function() {
        let discoverSpy = sinon.spy();
        let sensors = [];
        let numSensors = 0;
        let tag;

        it("should promise an array of the tag's sensors", function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            tag = tags[0]; // choose the tag with the most sensors
            let l = tag.sensorCapabilities().length;
            for (let t of tags) {
                if (t.sensorCapabilities().length > l) {
                    tag = t;
                }
            }

            tag.on('discover', discoverSpy);
            tag.on('discover', (sensor) => {
                sensors.push(sensor);
            });
            return expect(tag.discoverSensors()).
                to.eventually.satisfy((s_arr) => {
                    numSensors = s_arr.length; // store for subsequent testing
                    return s_arr.reduce((state, sensor) => {
                        return state && (sensor instanceof WirelessTagSensor);
                    }, s_arr.length > 0);
                });
        });
        it('should emit "discover" event for each new sensor', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            expect(discoverSpy).to.have.always.been.calledWith(
                sinon.match.instanceOf(WirelessTagSensor));
        });
        it('initially all the tag\'s sensors are new and trigger "discover"',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               expect(discoverSpy).to.have.callCount(numSensors);
           });
        it("should promise all of tag's sensors when called again", function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            // reset the event callback spy for next test
            tag.removeAllListeners('discover');
            discoverSpy = sinon.spy();
            tag.on('discover', discoverSpy);

            return expect(tag.discoverSensors()).
                to.eventually.have.lengthOf(numSensors);
        });
        it('should not emit "discover" on sensors discovered previously',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               return expect(discoverSpy).to.not.have.been.called;
           });
    });

});

/*
 * Test functions of the sensor object
 */

function degCtoF(x, isDelta) {
    return (x * 9/5.0) + (isDelta ? 0 : 32);
}
function degFtoC(x, isDelta) {
    return (x - (isDelta ? 0 : 32)) * 5.0/9;
}

describe('WirelessTagSensor:', function() {

    var sensors;

    before('find and distill list of sensors for testing', function(done) {
        // gather up a list of sensors that are all different, regardless
        // of the tag they belong to
        let proms = [];
        tags.forEach((tag) => {
            let sensorList = tag.eachSensor();
            if (sensorList.length > 0) {
                proms.push(Promise.resolve(sensorList));
            } else {
                proms.push(tag.discoverSensors());
            }
        });
        Promise.all(proms).then(
            (sensorLists) => {
                let sensorTypeMap = {};
                let sensorList = [];
                sensorLists.forEach((list) => {
                    sensorList = sensorList.concat(list);
                });
                sensors = [];
                sensorList.forEach((sensor) => {
                    let key = sensor.sensorType;
                    let tag = sensor.wirelessTag;
                    if (tag.isPhysicalTag()) key += '-phys';
                    switch (sensor.sensorType) {
                    case 'motion':
                    case 'event':
                        if (tag.hasAccelerometer()) key += "-accel";
                        if (tag.canMotionTimeout()) key += "-hmc";
                        break;
                    case 'temp':
                        if (tag.canHighPrecTemp()) key += '-htu';
                        break;
                    }
                    if (!sensorTypeMap[key]) {
                        sensorTypeMap[key] = true;
                        sensors.push(sensor);
                    }
                });
                done();
            }).catch((e) => {
                console.error(e.stack ? e.stack : e);
                done();
            });

    });

    describe('#reading', function() {
        let readingTypeMap = {
            'number': ['temp','humidity','moisture','light','signal','battery'],
            'string': ['event'],
            'boolean': ['water','outofrange']
        };
        let toTest;

        Object.keys(readingTypeMap).forEach(function(readingType) {
            it('should be a ' + readingType + ' for '
               + readingTypeMap[readingType] + ' sensors',
               function() {
                   // skip this if we don't have connection information
                   if (credentialsMissing) return this.skip();

                   toTest = sensors.filter((s) => {
                       return readingTypeMap[readingType].
                           indexOf(s.sensorType) >= 0;
                   });
                   // skip if there is nothing to test
                   if (toTest.length === 0) this.skip();

                   toTest.map((sensor) => {
                       return sensor.reading;
                   }).forEach((value) => {
                       expect(value).to.be.a(readingType);
                   });
               });
            it('should be read-only for these', function() {
                // skip this if we don't have connection information
                if (credentialsMissing) return this.skip();
                // skip if there is nothing to test
                if (toTest.length === 0) this.skip();

                return expect(() => {
                    toTest[0].reading = "xzy";
                }).to.throw(TypeError);
            });
        });
    });

    describe('#eventState', function() {
        let toTest;

        it('should be a string except for motion and signal sensors',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               toTest = sensors.filter((s) => {
                   return ['motion','signal'].indexOf(s.sensorType) < 0;
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.eventState;
               }).forEach((value) => {
                   return expect(value).to.be.a('string');
               });
           });
        it('should be read-only for these', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();
            // skip if there is nothing to test
            if (toTest.length === 0) this.skip();

            return expect(() => {
                toTest[0].eventState = "xzy";
            }).to.throw(TypeError);
        });
        it('should be undefined for motion and signal sensors', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            toTest = sensors.filter((s) => {
                return ['motion','signal'].indexOf(s.sensorType) >= 0;
            });
            // skip if there is nothing to test
            if (toTest.length === 0) this.skip();

            toTest.map((sensor) => {
                return sensor.eventState;
            }).forEach((value) => {
                return expect(value).to.be.undefined;
            });
        });
    });

    describe('#eventStateValues', function() {
        let toTest;

        it('should be list of possible values for \'eventState\'',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               toTest = sensors.filter((s) => {
                   return ['motion','signal'].indexOf(s.sensorType) < 0;
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return [sensor.eventStateValues, sensor.eventState];
               }).forEach((value) => {
                   return expect(value[0]).to.be.an('array').
                       and.to.include(value[1]);
               });
           });
        it('should be read-only', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();
            // skip if there is nothing to test
            if (toTest.length === 0) this.skip();

            return expect(() => {
                toTest[0].eventStateValues = ["xzy"];
            }).to.throw(TypeError);
        });
    });

    describe('#probeType', function() {
        let toTest;

        it('should be a string for temperature, humidity, and moisture sensors',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               toTest = sensors.filter((s) => {
                   return ['temp','secondarytemp','humidity','moisture'].
                        indexOf(s.sensorType) >= 0;
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.probeType;
               }).forEach((value) => {
                   return expect(value).to.be.a('string');
               });
           });
        it('should be read-only for these', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();
            // skip if there is nothing to test
            if (toTest.length === 0) this.skip();

            return expect(() => {
                toTest[0].probeType = "xzy";
            }).to.throw(TypeError);
        });
        it('should be \'Internal\' if alternative probe unsupported', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            toTest = toTest.filter((s) => {
                let t = s.wirelessTag;
                return ! (t.isOutdoorTag() || t.canExternalTempProbe());
            });
            // skip if there is nothing to test
            if (toTest.length === 0) this.skip();

            toTest.map((sensor) => {
                return sensor.probeType;
            }).forEach((value) => {
                return expect(value).to.equal('Internal');
            });
        });
        it('should be undefined for other sensors', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            toTest = sensors.filter((s) => {
                return ['temp','secondarytemp','humidity','moisture'].
                    indexOf(s.sensorType) < 0;
            });
            // skip if there is nothing to test
            if (toTest.length === 0) this.skip();

            toTest.map((sensor) => {
                return sensor.probeType;
            }).forEach((value) => {
                return expect(value).to.be.undefined;
            });
        });
    });

    describe('#probeDisconnected', function() {
        let toTest;

        it('should be a boolean or undefined',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               // skip if there is nothing to test
               if (sensors.length === 0) this.skip();

               sensors.map((sensor) => {
                   return sensor.probeDisconnected;
               }).forEach((value) => {
                   return expect(value).to.be.oneOf([true, false, undefined]);
               });
           });
        it('should be defined if connection detection is possible', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            toTest = sensors.filter((s) => {
                return s.wirelessTag.isExternalTempProbe();
            });
            // skip if there is nothing to test
            if (toTest.length === 0) this.skip();

            toTest.map((sensor) => {
                return sensor.probeDisconnected;
            }).forEach((value) => {
                return expect(value).to.not.be.undefined;
            });
        });
        it('should be undefined otherwise', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            toTest = sensors.filter((s) => {
                return ! s.wirelessTag.isExternalTempProbe();
            });
            // skip if there is nothing to test
            if (toTest.length === 0) this.skip();

            toTest.map((sensor) => {
                return sensor.probeDisconnected;
            }).forEach((value) => {
                return expect(value).to.be.undefined;
            });
        });
    });

    describe('#isArmed()', function() {
        it('should be a boolean except for motion and signal sensors',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.eventState !== undefined;
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.forEach((sensor) => {
                   return expect(sensor.isArmed()).to.be.a('boolean');
               });
           });
    });

    describe('#reset()', function() {
        it('should be a function for motion and event sensors', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            let toTest = sensors.filter((s) => {
                return s.sensorType === 'event' || s.sensorType === 'motion';
            });
            // skip if there is nothing to test
            if (toTest.length === 0) this.skip();

            toTest.forEach((sensor) => {
                expect(sensor.reset).to.be.a('function');
            });
        });
        it('should be undefined for all other sensors', function() {
            // skip this if we don't have connection information
            if (credentialsMissing) return this.skip();

            let toTest = sensors.filter((s) => {
                return s.sensorType !== 'event' && s.sensorType !== 'motion';
            });
            // skip if there is nothing to test
            if (toTest.length === 0) this.skip();

            toTest.forEach((sensor) => {
                expect(sensor.reset).to.equal(undefined);
            });
        });
    });

    describe('#monitoringConfig()', function() {

        it('should be an object giving the tag\'s monitoring configuration',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               sensors.map((sensor) => {
                   return sensor.monitoringConfig();
               }).forEach((mconfig) => {
                   return expect(mconfig).to.be.a('object');
               });
           });

        it('should have \'notifySettings\' unless signal sensor',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.wirelessTag.isPhysicalTag()
                       && s.sensorType !== 'signal';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().notifySettings;
               }).forEach((value) => {
                   return expect(value).to.be.an('object').
                       and.to.contain.all.keys('email',
                                               'useEmail',
                                               'usePush',
                                               'useSpeech',
                                               'sound',
                                               'noSound');
               });
           });

        it('should have \'thresholds\' for temp, light, humidity, moisture',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return ['humidity','light','moisture','temp'].
                       indexOf(s.sensorType) >= 0;
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().thresholds;
               }).forEach((value) => {
                   return expect(value).to.be.an('object').
                       and.to.contain.all.keys('lowValue',
                                               'minLowReadings',
                                               'highValue',
                                               'minHighReadings',
                                               'hysteresis');
               });
           });

        it('should have only \'thresholds.lowValue\' for battery',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.sensorType === 'battery';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().thresholds;
               }).forEach((value) => {
                   return expect(value).to.be.an('object').
                       and.to.have.all.keys('lowValue');
               });
           });

        it('should have \'responsiveness\' for motion, event, humidity, moisture',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return ['humidity','event','moisture','motion'].
                       indexOf(s.sensorType) >= 0
                       && s.wirelessTag.isPhysicalTag();
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().responsiveness;
               }).forEach((value) => {
                   return expect(value).to.be.oneOf(["Highest",
                                                     "Medium high",
                                                     "Medium",
                                                     "Medium low",
                                                     "Lowest"]);
               });
           });

        it('should have \'monitoringInterval\' for temp and light',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return ['light','temp'].indexOf(s.sensorType) >= 0;
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().monitoringInterval;
               }).forEach((value) => {
                   return expect(value).to.be.a('number').
                       and.to.be.above(0);
               });
           });

        it('should have \'monitoringEnabled\' for battery',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.sensorType === 'battery';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().monitoringEnabled;
               }).forEach((value) => {
                   return expect(value).to.be.a('boolean');
               });
           });

        it('should have \'isDoorMode\' for event and motion',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return ['event','motion'].indexOf(s.sensorType) >= 0;
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().isDoorMode;
               }).forEach((value) => {
                   return expect(value).to.be.a('boolean');
               });
           });

        it('should have \'doorMode\' for event and motion',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return ['event','motion'].indexOf(s.sensorType) >= 0;
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().doorMode;
               }).forEach((value) => {
                   return expect(value).to.be.an('object').
                       and.to.contain.all.keys('angle',
                                               'notifyWhenOpenFor',
                                               'notifyOnClosed');
               });
           });

        it('should have \'motionMode\' for event and motion',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return ['event','motion'].indexOf(s.sensorType) >= 0;
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().motionMode;
               }).forEach((value) => {
                   return expect(value).to.be.an('object').
                       and.to.contain.all.keys('timeoutOrResetAfter',
                                               'timeoutMode');
               });
           });

        it('should have \'orientation1\' for event and motion',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return ['event','motion'].indexOf(s.sensorType) >= 0;
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().orientation1;
               }).forEach((value) => {
                   return expect(value).to.be.an('object').
                       and.to.contain.all.keys('x','y','z');
               });
           });

        it('should have \'sensitivity\' for event and motion',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return ['event','motion'].indexOf(s.sensorType) >= 0;
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().sensitivity;
               }).forEach((value) => {
                   return expect(value).to.be.a('number').
                       and.to.be.above(0);
               });
           });

        it('should have \'armSilently\' for event and motion',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return ['event','motion'].indexOf(s.sensorType) >= 0;
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().armSilently;
               }).forEach((value) => {
                   return expect(value).to.be.a('boolean');
               });
           });

        it('should have \'calibration\' for humidity and moisture',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return ['humidity','moisture'].indexOf(s.sensorType) >= 0;
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().calibration;
               }).forEach((value) => {
                   return expect(value).to.be.an('object').
                       and.to.contain.all.keys('lowValue',
                                               'lowCapacitance',
                                               'highValue',
                                               'highCapacitance');
               });
           });

        it('should have \'unit\' for temp, which should be degC',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.sensorType === 'temp';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().unit;
               }).forEach((value) => {
                   return expect(value).to.be.a('string').and.to.equal('degC');
               });
           });

        it('should allow changing \'unit\' for temp to degF',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.sensorType === 'temp';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               let origUnits = [];
               toTest.forEach((sensor) => {
                   origUnits.push(sensor.monitoringConfig().unit);
                   sensor.monitoringConfig().unit = "degF";
               });
               toTest.forEach((sensor) => {
                   let mconf = sensor.monitoringConfig();
                   expect(mconf.unit).to.be.a('string').and.to.equal("degF");
                   mconf.unit = origUnits.shift();
               });
           });

        it('should give temp reading and thresholds in ºF if \'unit\' is degF',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.sensorType === 'temp';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               let origUnits = [];
               let readings = [];
               let thresholds = [];
               toTest.forEach((sensor) => {
                   origUnits.push(sensor.monitoringConfig().unit);
                   readings.push(sensor.reading);
                   thresholds.push(Object.assign({}, sensor.monitoringConfig().thresholds));
                   sensor.monitoringConfig().unit = "degF";
               });
               toTest.forEach((sensor) => {
                   let mconf = sensor.monitoringConfig();
                   let ths = mconf.thresholds;
                   let oldThs = thresholds.shift();
                   expect(sensor.reading).
                       to.be.closeTo(degCtoF(readings.shift()), 0.201);
                   expect(ths.lowValue).
                       to.be.closeTo(degCtoF(oldThs.lowValue), 0.201);
                   expect(ths.highValue).
                       to.be.closeTo(degCtoF(oldThs.highValue), 0.201);
                   expect(ths.hysteresis).
                       to.be.closeTo(degCtoF(oldThs.hysteresis, true), 0.201);
                   mconf.unit = origUnits.shift();
               });
           });

        it('should set temp thresholds in ºF if \'unit\' is degF',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.sensorType === 'temp';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.forEach((sensor) => {
                   let mconf = sensor.monitoringConfig();
                   let ths = mconf.thresholds;
                   let origUnit = mconf.unit;
                   mconf.unit = "degF";
                   ths.lowValue = 32;
                   ths.hysteresis = 9/5.0;
                   expect(ths.lowValue).to.equal(32);
                   expect(ths.hysteresis).to.equal(9/5.0);
                   mconf.unit = "degC";
                   expect(ths.lowValue).to.equal(0);
                   expect(ths.hysteresis).to.equal(1.0);
                   mconf.unit = origUnit;
               });
           });

        it('should have \'gracePeriod\' for outofrange',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.sensorType === 'outofrange';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().gracePeriod;
               }).forEach((value) => {
                   return expect(value).to.be.a('number').
                       and.to.be.above(10);
               });
           });

        it('assigning unmapped value to \'gracePeriod\' should throw',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.sensorType === 'outofrange';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.forEach((sensor) => {
                   return expect(() => {
                       sensor.monitoringConfig().gracePeriod = 10000;
                       return sensor.monitoringConfig().gracePeriod;
                   }).to.throw(RangeError);
               });
           });
        it('assigning mapped value to \'gracePeriod\' should succeed',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.sensorType === 'outofrange';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.forEach((sensor) => {
                   sensor.monitoringConfig().gracePeriod = 1800;
                   sensor.monitoringConfig().resetModified();
               });
               toTest.forEach((sensor) => {
                   return expect(sensor.monitoringConfig().gracePeriod).
                       to.equal(1800);
               });
           });

           after('ensure monitoringConfig isn\'t dirty', function() {
               sensors.forEach((sensor) => sensor.monitoringConfig().resetModified());
           });
    });

    describe('#monitoringConfig().isModified()', function() {

        it('should be false if not changed',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               sensors.map((sensor) => {
                   return sensor.monitoringConfig();
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified()).to.equal(false);
               });
           });

        it('should be true when config is marked as changed',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               sensors.map((sensor) => {
                   return sensor.monitoringConfig().markModified();
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified()).to.equal(true);
               });
           });

        it('should be true for marked property if not all changed',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               sensors.map((sensor) => {
                   return sensor.monitoringConfig().resetModified().
                       markModified('notifySettings.sound');
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified('notifySettings.sound')).
                       to.equal(true);
               });
           });

        it('should be true only for marked property if not all changed',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               sensors.map((sensor) => {
                   return sensor.monitoringConfig().resetModified().
                       markModified('notifySettings.sound');
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified('notifySettings.email')).
                       to.equal(false);
               });
           });

        it('should be true for property whose value is set',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.wirelessTag.isPhysicalTag()
                       && s.sensorType !== 'signal';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   let mconfig = sensor.monitoringConfig().resetModified();
                   mconfig.notifySettings.sound = 'moof';
                   return mconfig;
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified('notifySettings.sound')).
                       to.equal(true);
               });
           });

        it('should be true for internal property whose value is set',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.wirelessTag.isPhysicalTag()
                       && s.sensorType !== 'signal';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig();
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified('apnsSound')).
                       to.equal(true);
               });
           });

        it('should be false for property whose value was not set',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.wirelessTag.isPhysicalTag()
                       && s.sensorType !== 'signal';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig();
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified('notifySettings.email')).
                       to.equal(false);
               });
           });

        it('should be false for internal property whose value was not set',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.wirelessTag.isPhysicalTag()
                       && s.sensorType !== 'outofrange'
                       && s.sensorType !== 'signal';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig();
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified('email')).
                       to.equal(false);
               });
           });

    });

    describe('#monitoringConfig().markModified()', function() {

        it('should mark config as changed',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               sensors.map((sensor) => {
                   return sensor.monitoringConfig().markModified();
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified()).to.equal(true);
               });
           });

        it('should mark any property as changed',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.wirelessTag.isPhysicalTag()
                       && s.sensorType !== 'signal';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().markModified();
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified('notifySettings')).
                       to.equal(true);
               });
           });

        it('should mark any internal property as changed',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.wirelessTag.isPhysicalTag()
                       && s.sensorType !== 'signal';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               toTest.map((sensor) => {
                   return sensor.monitoringConfig().markModified();
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified('apnsSound')).
                       to.equal(true);
               });
           });

        it('should return monitoringConfig for chaining',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               sensors.map((sensor) => {
                   return sensor.monitoringConfig();
               }).forEach((mconfig) => {
                   return expect(mconfig.markModified()).to.equal(mconfig);
               });
           });

        it('with argument \'property\' should mark \'property\'',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               sensors.map((sensor) => {
                   return sensor.monitoringConfig().resetModified().
                       markModified('notifySettings.sound');
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified('notifySettings.sound')).
                       to.equal(true);
               });
           });

        it('with argument \'property\' should mark only \'property\'',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               sensors.map((sensor) => {
                   return sensor.monitoringConfig().resetModified().
                       markModified('notifySettings.sound');
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified('notifySettings.email')).
                       to.equal(false);
               });
           });

        it('with argument \'property\' does not also mark internal property',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               sensors.map((sensor) => {
                   return sensor.monitoringConfig().resetModified().
                       markModified('notifySettings.sound');
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified('apnsSound')).
                       to.equal(false);
               });
           });

    });

    describe('#monitoringConfig().resetModified()', function() {

        it('should clear all modification flags',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               sensors.map((sensor) => {
                   return sensor.monitoringConfig().resetModified();
               }).forEach((mconfig) => {
                   return expect(mconfig.isModified()).to.equal(false);
               });
           });

        it('should return monitoringConfig for chaining',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               sensors.map((sensor) => {
                   return sensor.monitoringConfig();
               }).forEach((mconfig) => {
                   return expect(mconfig.resetModified()).to.equal(mconfig);
               });
           });

    });

    describe('#monitoringConfig().update()', function() {
        let eventSpy = sinon.spy();

        it('should have no effect if monitoring config marked modified',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.wirelessTag.isPhysicalTag()
                       && s.sensorType !== 'signal';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               let proms = toTest.map((sensor) => {
                   sensor.on('config', eventSpy);
                   let mconfig = sensor.monitoringConfig();
                   mconfig.notifySettings.sound = "moo";
                   return mconfig.markModified('notifySettings').update();
               });
               return expect(Promise.all(proms)).
                   to.eventually.satisfy((mconfigs) => {
                       return mconfigs.reduce((all, mconfig) => {
                           return all
                               && mconfig.isModified()
                               && mconfig.notifySettings.sound === "moo";
                       }, true);
                   });
           });

        it('sensor should then also not emit \'config\' event',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               return expect(eventSpy).to.have.not.been.called;
           });

        it('should restore from cloud if monitoring config not marked modified',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               let toTest = sensors.filter((s) => {
                   return s.wirelessTag.isPhysicalTag()
                       && s.sensorType !== 'signal';
               });
               // skip if there is nothing to test
               if (toTest.length === 0) this.skip();

               eventSpy.reset();
               let proms = toTest.map((sensor) => {
                   let mconfig = sensor.monitoringConfig();
                   mconfig.notifySettings.sound = "moo";
                   return mconfig.resetModified().update();
               });
               return expect(Promise.all(proms)).
                   to.eventually.satisfy((mconfigs) => {
                       return mconfigs.reduce((all, mconfig) => {
                           return all
                               && (! mconfig.isModified())
                               && mconfig.notifySettings.sound !== "moo";
                       }, true);
                   });
           });

        it('sensor should emit \'config\' event if config updated from cloud',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               return expect(eventSpy).to.have.callCount(
                   sensors.filter((s) => {
                       return s.wirelessTag.isPhysicalTag()
                           && s.sensorType !== 'signal';
                   }).length);
           });

        it('sensor should emit \'config\' with sensor, config, and \'update\'',
           function() {
               // skip this if we don't have connection information
               if (credentialsMissing) return this.skip();

               sensors.filter((s) => {
                   return s.wirelessTag.isPhysicalTag()
                       && s.sensorType !== 'signal';
               }).forEach((s) => {
                   return expect(eventSpy).to.have.been.calledWith(
                       s, s.monitoringConfig(), 'update'
                   );
               });
           });

    });

});

describe('Kumostat Tag:', function() {
    var kumostatTags = [];

    before('identify Kumostat tags', function() {
        kumostatTags = tags.filter((t) => t.isKumostat());
    });

    describe('#thermostat', function() {

        it('Kumostat should have property \'thermostat\'', function() {
            if (kumostatTags.length === 0) return this.skip();

            let toTest = kumostatTags;
            toTest.forEach((tag) => {
                expect(tag.thermostat).to.be.an('object');
            });
        });
        it('should give \'isFanOn\' and \'isACHeatOn\' status values', function() {
            if (kumostatTags.length === 0) return this.skip();

            let toTest = kumostatTags.map((t) => t.thermostat);
            toTest.forEach((therm) => {
                expect(therm.isFanOn).to.be.a('boolean');
                expect(therm.isACHeatOn).to.be.a('boolean');
            });
        });
        it('these should be read-only', function() {
            if (kumostatTags.length === 0) return this.skip();

            let toTest = kumostatTags.map((t) => t.thermostat);
            toTest.forEach((therm) => {
                expect(() => { therm.isFanOn = !therm.isFanOn }).to.throw(TypeError);
                expect(() => { therm.isACHeatOn = !therm.isACHeatOn }).to.throw(TypeError);
            });
        });
        it('should give \'thresholdLow\' and \'thresholdHigh\' temp thresholds', function() {
            if (kumostatTags.length === 0) return this.skip();

            let toTest = kumostatTags.map((t) => t.thermostat);
            toTest.forEach((therm) => {
                expect(therm.thresholdLow).to.be.a('number');
                expect(therm.thresholdHigh).to.be.a('number');
            });
        });
        it('should get temp thresholds in °F/°C depending on configured unit', function() {
            if (kumostatTags.length === 0) return this.skip();

            let toTest = kumostatTags[0];
            let tempConfig = toTest.tempSensor.monitoringConfig();
            let origUnit = tempConfig.unit;
            tempConfig.unit = 'degC';
            let degCVals = Object.assign({}, toTest.thermostat);
            tempConfig.unit = 'degF';
            expect(toTest.thermostat.thresholdLow).
                to.be.closeTo(degCtoF(degCVals.thresholdLow), 0.101);
            expect(toTest.thermostat.thresholdHigh).
                to.be.closeTo(degCtoF(degCVals.thresholdHigh), 0.101);
            tempConfig.unit = origUnit;
        });
        it('should set temp thresholds in °F/°C depending on configured unit', function() {
            if (kumostatTags.length === 0) return this.skip();

            let toTest = kumostatTags[0];
            let tempConfig = toTest.tempSensor.monitoringConfig();
            let origUnit = tempConfig.unit;
            tempConfig.unit = 'degC';
            let degCVals = Object.assign({}, toTest.thermostat);
            tempConfig.unit = 'degF';
            toTest.thermostat.thresholdLow -= 5;
            toTest.thermostat.thresholdHigh += 5;
            expect(degCtoF(degCVals.thresholdLow) - toTest.thermostat.thresholdLow).
                to.be.closeTo(5, 0.101);
            expect(toTest.thermostat.thresholdHigh - degCtoF(degCVals.thresholdHigh)).
                to.be.closeTo(5, 0.101);
            tempConfig.unit = 'degC';
            expect(degCVals.thresholdLow - toTest.thermostat.thresholdLow).
                to.be.closeTo(degFtoC(5, true), 0.101);
            expect(toTest.thermostat.thresholdHigh - degCVals.thresholdHigh).
                to.be.closeTo(degFtoC(5, true), 0.101);
            toTest.thermostat.thresholdLow = degCVals.thresholdLow;
            toTest.thermostat.thresholdHigh = degCVals.thresholdHigh;
            tempConfig.unit = origUnit;
        });
        it('should give UUID of temperature tag as \'tempTagUUID\' ', function() {
            if (kumostatTags.length === 0) return this.skip();

            let toTest = kumostatTags.map((t) => t.thermostat);
            toTest.forEach((therm) => {
                expect(therm.tempTagUUID).to.be.a('string');
                expect(therm.tempTagUUID.length).to.equal(kumostatTags[0].uuid.length);
            });
        });
    });

    describe('#thermostat.tempSensor()', function() {
        var origTempTagUUID;

        before('obtain original tempTagUUID', function() {
            if (kumostatTags.length === 0) return;

            origTempTagUUID = kumostatTags[0].thermostat.tempTagUUID;
        });

        after('restore tempTagUUID if changed', function() {
            if (kumostatTags.length === 0) return;

            if (origTempTagUUID) {
                kumostatTags[0].thermostat.tempTagUUID = origTempTagUUID;
            }
        });

        it('should resolve to a sensor object', function() {
            if (kumostatTags.length === 0) return this.skip();

            let toTest = kumostatTags[0];
            return expect(toTest.thermostat.tempSensor()).
                to.eventually.be.an('object').and.have.property('wirelessTag');
        });
        it('should be a temperature sensor', function() {
            if (kumostatTags.length === 0) return this.skip();

            let therm = kumostatTags[0].thermostat;
            return expect(therm.tempSensor().then((s) => s.sensorType)).
                to.eventually.equal('temp');
        });
        it('should be a sensor for the tag identified by \'tempTagUUID\'', function() {
            if (kumostatTags.length === 0) return this.skip();

            let therm = kumostatTags[0].thermostat;
            return expect(therm.tempSensor().then((s) => s.wirelessTag.uuid)).
                to.eventually.equal(therm.tempTagUUID);
        });
        it('should have valid reading and event state', function(done) {
            if (kumostatTags.length === 0) return this.skip();

            let therm = kumostatTags[0].thermostat;
            therm.tempSensor().then((s) => {
                expect(s.reading).to.be.a('number');
                expect(s.reading).to.be.above(0);
                expect(s.eventState).to.be.a('string');
                expect(s.isArmed()).to.be.a('boolean');
                done();
            });
        });
        it('should have valid temperature monitoring config', function(done) {
            if (kumostatTags.length === 0) return this.skip();

            let therm = kumostatTags[0].thermostat;
            therm.tempSensor().then(
                (s) => s.monitoringConfig()
            ).then((mconfig) => {
                expect(mconfig.notifySettings).to.be.an('object');
                expect(mconfig.notifySettings.email).to.be.a('string');
                expect(mconfig.thresholds).to.be.an('object');
                expect(mconfig.thresholds.lowValue).to.be.a('number');
                expect(mconfig.thresholds.highValue).to.be.above(0);
                done();
            });
        });
        it('should be sensor for a different tag if \'tempTagUUID\' is changed', function() {
            if (kumostatTags.length === 0) return this.skip();

            let therm = kumostatTags[0].thermostat;
            let otherTag = tags.filter(
                (t) => t.isPhysicalTag() && t.uuid !== therm.tempTagUUID
            )[0];
            therm.tempTagUUID = otherTag.uuid;
            return expect(therm.tempSensor().then((s) => s.wirelessTag.uuid)).
                to.eventually.equal(otherTag.uuid);
        });
    });
});
