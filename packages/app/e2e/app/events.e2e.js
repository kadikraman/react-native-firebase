const eventName = 'pong';
const eventName2 = 'ping';
const eventBody = {
  foo: 'bar',
};

describe('Core -> EventEmitter', () => {
  describe('ReactNativeFirebaseEventEmitter', () => {
    it('queues events before app is ready', async () => {
      const {
        eventsPing,
        eventsNotifyReady,
        eventsGetListeners,
      } = NativeModules.RNFBAppModule;
      await eventsNotifyReady(false);

      let readyToResolve = false;
      const { resolve, reject, promise } = Promise.defer();
      const emitter = NativeEventEmitter;

      emitter.addListener(eventName, event => {
        event.foo.should.equal(eventBody.foo);
        if (!readyToResolve) {
          return reject(new Error('Event was received before being ready!'));
        }

        return resolve();
      });

      await eventsPing(eventName, eventBody);
      await sleep(100);
      const nativeListenersBefore = await eventsGetListeners();
      nativeListenersBefore.events.pong.should.equal(1);

      readyToResolve = true;
      await eventsNotifyReady(true);

      await promise;
      emitter.removeAllListeners(eventName);

      const nativeListenersAfter = await eventsGetListeners();

      should.equal(nativeListenersAfter.events.pong, undefined);
    });

    it('queues events before a js listener is registered', async () => {
      const {
        eventsPing,
        eventsNotifyReady,
        eventsGetListeners,
        eventsRemoveListener,
      } = NativeModules.RNFBAppModule;
      await eventsNotifyReady(true);
      const { resolve, promise } = Promise.defer();
      const emitter = NativeEventEmitter;

      await eventsPing(eventName2, eventBody);
      await sleep(500);
      const nativeListenersBefore = await eventsGetListeners();
      should.equal(nativeListenersBefore.events.ping, undefined);

      emitter.addListener(eventName2, event => {
        event.foo.should.equal(eventBody.foo);
        return resolve();
      });

      await promise;
      emitter.removeAllListeners(eventName2);

      await eventsRemoveListener(eventName2, true);
      const nativeListenersAfter = await eventsGetListeners();

      should.equal(nativeListenersAfter.events.ping, undefined);
    });
  });
});
