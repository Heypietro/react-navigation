import * as React from 'react';
import { act, render } from 'react-native-testing-library';
import {
  Router,
  DefaultRouterOptions,
  NavigationState,
  StackRouter,
} from '@react-navigation/routers';
import useNavigationBuilder from '../useNavigationBuilder';
import BaseNavigationContainer from '../BaseNavigationContainer';
import Screen from '../Screen';
import MockRouter, {
  MockActions,
  MockRouterKey,
} from './__fixtures__/MockRouter';
import type { NavigationContainerRef } from '../types';

beforeEach(() => (MockRouterKey.current = 0));

jest.mock('nanoid/non-secure', () => {
  let key = 0;

  return { nanoid: () => String(++key) };
});

it("lets parent handle the action if child didn't", () => {
  function CurrentRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const ParentRouter: Router<
      NavigationState,
      MockActions | { type: 'REVERSE' }
    > = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'REVERSE') {
          return {
            ...state,
            routes: state.routes.slice().reverse(),
          };
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ParentRouter;
  }
  const ParentNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(CurrentRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const ChildNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'REVERSE' });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  render(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <ParentNavigator initialRouteName="baz">
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar">{() => null}</Screen>
        <Screen name="baz">
          {() => (
            <ChildNavigator>
              <Screen name="qux" component={TestScreen} />
            </ChildNavigator>
          )}
        </Screen>
      </ParentNavigator>
    </BaseNavigationContainer>
  );

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).lastCalledWith({
    stale: false,
    type: 'test',
    index: 2,
    key: '0',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
      { key: 'foo', name: 'foo' },
    ],
  });
});

it("lets children handle the action if parent didn't", () => {
  const CurrentParentRouter = MockRouter;

  function CurrentChildRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const ChildRouter: Router<
      NavigationState,
      MockActions | { type: 'REVERSE' }
    > = {
      ...CurrentMockRouter,

      shouldActionChangeFocus() {
        return true;
      },

      getStateForAction(state, action, options) {
        if (action.type === 'REVERSE') {
          return {
            ...state,
            routes: state.routes.slice().reverse(),
          };
        }
        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ChildRouter;
  }

  const ChildNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(
      CurrentChildRouter,
      props
    );

    return descriptors[state.routes[state.index].key].render();
  };

  const ParentNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(
      CurrentParentRouter,
      props
    );

    return (
      <React.Fragment>
        {state.routes.map((route) => descriptors[route.key].render())}
      </React.Fragment>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'REVERSE' });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const initialState = {
    index: 1,
    routes: [
      {
        key: 'baz',
        name: 'baz',
        state: {
          index: 0,
          key: '4',
          routeNames: ['qux', 'lex'],
          routes: [
            { key: 'qux', name: 'qux' },
            { key: 'lex', name: 'lex' },
          ],
        },
      },
      { key: 'bar', name: 'bar' },
    ],
  };

  const element = (
    <BaseNavigationContainer
      initialState={initialState}
      onStateChange={onStateChange}
    >
      <ParentNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
        <Screen name="baz">
          {() => (
            <ChildNavigator>
              <Screen name="qux">{() => null}</Screen>
              <Screen name="lex">{() => null}</Screen>
            </ChildNavigator>
          )}
        </Screen>
      </ParentNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).lastCalledWith({
    stale: false,
    type: 'test',
    index: 0,
    key: '0',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      {
        key: 'baz',
        name: 'baz',
        state: {
          stale: false,
          type: 'test',
          index: 0,
          key: '1',
          routeNames: ['qux', 'lex'],
          routes: [
            { key: 'lex', name: 'lex' },
            { key: 'qux', name: 'qux' },
          ],
        },
      },
      { key: 'bar', name: 'bar' },
    ],
  });
});

it('action goes to correct navigator if target is specified', () => {
  function CurrentTestRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const TestRouter: Router<
      NavigationState,
      MockActions | { type: 'REVERSE' }
    > = {
      ...CurrentMockRouter,

      shouldActionChangeFocus() {
        return true;
      },

      getStateForAction(state, action, options) {
        if (action.type === 'REVERSE') {
          return {
            ...state,
            routes: state.routes.slice().reverse(),
          };
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return TestRouter;
  }

  const ChildNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(
      CurrentTestRouter,
      props
    );

    return (
      <React.Fragment>
        {state.routes.map((route) => descriptors[route.key].render())}
      </React.Fragment>
    );
  };

  const ParentNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(
      CurrentTestRouter,
      props
    );

    return (
      <React.Fragment>
        {state.routes.map((route) => descriptors[route.key].render())}
      </React.Fragment>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'REVERSE', target: '0' });
    }, [props.navigation]);

    return null;
  };

  const initialState = {
    stale: false,
    type: 'test',
    index: 1,
    key: '0',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      {
        key: 'baz',
        name: 'baz',
        state: {
          stale: false,
          type: 'test',
          index: 0,
          key: '1',
          routeNames: ['qux', 'lex'],
          routes: [
            { key: 'lex', name: 'lex' },
            { key: 'qux', name: 'qux' },
          ],
        },
      },
      { key: 'bar', name: 'bar' },
      { key: 'foo', name: 'foo' },
    ],
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer
      initialState={initialState}
      onStateChange={onStateChange}
    >
      <ParentNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar">{() => null}</Screen>
        <Screen name="baz">
          {() => (
            <ChildNavigator>
              <Screen name="qux">{() => null}</Screen>
              <Screen name="lex" component={TestScreen} />
            </ChildNavigator>
          )}
        </Screen>
      </ParentNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).toBeCalledWith({
    stale: false,
    type: 'test',
    index: 1,
    key: '0',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
      {
        key: 'baz',
        name: 'baz',
        state: {
          stale: false,
          type: 'test',
          index: 0,
          key: '1',
          routeNames: ['qux', 'lex'],
          routes: [
            { key: 'lex', name: 'lex' },
            { key: 'qux', name: 'qux' },
          ],
        },
      },
    ],
  });
});

it("action doesn't bubble if target is specified", () => {
  const CurrentParentRouter = MockRouter;

  function CurrentChildRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const ChildRouter: Router<
      NavigationState,
      MockActions | { type: 'REVERSE' }
    > = {
      ...CurrentMockRouter,

      shouldActionChangeFocus() {
        return true;
      },

      getStateForAction(state, action, options) {
        if (action.type === 'REVERSE') {
          return {
            ...state,
            routes: state.routes.slice().reverse(),
          };
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ChildRouter;
  }

  const ChildNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(
      CurrentChildRouter,
      props
    );

    return descriptors[state.routes[state.index].key].render();
  };

  const ParentNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(
      CurrentParentRouter,
      props
    );

    return (
      <React.Fragment>
        {state.routes.map((route) => descriptors[route.key].render())}
      </React.Fragment>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'REVERSE', target: '0' });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer onStateChange={onStateChange}>
      <ParentNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
        <Screen name="baz">
          {() => (
            <ChildNavigator>
              <Screen name="qux">{() => null}</Screen>
              <Screen name="lex">{() => null}</Screen>
            </ChildNavigator>
          )}
        </Screen>
      </ParentNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).not.toBeCalled();
});

it('logs error if no navigator handled the action', () => {
  const TestRouter = MockRouter;

  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(TestRouter, props);

    return (
      <React.Fragment>
        {state.routes.map((route) => descriptors[route.key].render())}
      </React.Fragment>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UNKNOWN' });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const initialState = {
    index: 1,
    routes: [
      {
        key: 'baz',
        name: 'baz',
        state: {
          index: 0,
          key: '4',
          routeNames: ['qux', 'lex'],
          routes: [
            { key: 'qux', name: 'qux' },
            { key: 'lex', name: 'lex' },
          ],
        },
      },
      { key: 'bar', name: 'bar' },
    ],
  };

  const element = (
    <BaseNavigationContainer initialState={initialState}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux">{() => null}</Screen>
              <Screen name="lex">{() => null}</Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const spy = jest.spyOn(console, 'error').mockImplementation();

  render(element).update(element);

  expect(spy.mock.calls[0][0]).toMatch(
    "The action 'UNKNOWN' was not handled by any navigator."
  );

  spy.mockRestore();
});

it("prevents removing a screen with 'beforeRemove' event", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(StackRouter, props);

    return (
      <React.Fragment>
        {state.routes.map((route) => descriptors[route.key].render())}
      </React.Fragment>
    );
  };

  const onBeforeRemove = jest.fn();

  let shouldPrevent = true;

  const TestScreen = (props: any) => {
    React.useEffect(
      () =>
        props.navigation.addListener('beforeRemove', (e: any) => {
          onBeforeRemove();

          if (shouldPrevent) {
            e.preventDefault();
          }
        }),
      [props.navigation]
    );

    return null;
  };

  const onStateChange = jest.fn();

  const ref = React.createRef<NavigationContainerRef>();

  const element = (
    <BaseNavigationContainer ref={ref} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
        <Screen name="baz">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  act(() => ref.current?.navigate('bar'));

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).toBeCalledWith({
    index: 1,
    key: 'stack-12',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo-13', name: 'foo' },
      { key: 'bar-14', name: 'bar' },
    ],
    stale: false,
    type: 'stack',
  });

  act(() => ref.current?.navigate('baz'));

  expect(onStateChange).toBeCalledTimes(2);
  expect(onStateChange).toBeCalledWith({
    index: 2,
    key: 'stack-12',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo-13', name: 'foo' },
      { key: 'bar-14', name: 'bar' },
      {
        key: 'baz-15',
        name: 'baz',
      },
    ],
    stale: false,
    type: 'stack',
  });

  act(() => ref.current?.navigate('foo'));

  expect(onStateChange).toBeCalledTimes(2);
  expect(onBeforeRemove).toBeCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual({
    index: 2,
    key: 'stack-12',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo-13', name: 'foo' },
      { key: 'bar-14', name: 'bar' },
      { key: 'baz-15', name: 'baz' },
    ],
    stale: false,
    type: 'stack',
  });

  shouldPrevent = false;

  act(() => ref.current?.navigate('foo'));

  expect(onStateChange).toBeCalledTimes(3);
  expect(onStateChange).toBeCalledWith({
    index: 0,
    key: 'stack-12',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: 'foo-13', name: 'foo' }],
    stale: false,
    type: 'stack',
  });
});

it("prevents removing a child screen with 'beforeRemove' event", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(StackRouter, props);

    return (
      <React.Fragment>
        {state.routes.map((route) => descriptors[route.key].render())}
      </React.Fragment>
    );
  };

  const onBeforeRemove = jest.fn();

  let shouldPrevent = true;

  const TestScreen = (props: any) => {
    React.useEffect(
      () =>
        props.navigation.addListener('beforeRemove', (e: any) => {
          onBeforeRemove();

          if (shouldPrevent) {
            e.preventDefault();
          }
        }),
      [props.navigation]
    );

    return null;
  };

  const onStateChange = jest.fn();

  const ref = React.createRef<NavigationContainerRef>();

  const element = (
    <BaseNavigationContainer ref={ref} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar">{() => null}</Screen>
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux" component={TestScreen} />
              <Screen name="lex">{() => null}</Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  act(() => ref.current?.navigate('bar'));

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).toBeCalledWith({
    index: 1,
    key: 'stack-17',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo-18', name: 'foo' },
      { key: 'bar-19', name: 'bar' },
    ],
    stale: false,
    type: 'stack',
  });

  act(() => ref.current?.navigate('baz'));

  expect(onStateChange).toBeCalledTimes(2);
  expect(onStateChange).toBeCalledWith({
    index: 2,
    key: 'stack-17',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo-18', name: 'foo' },
      { key: 'bar-19', name: 'bar' },
      {
        key: 'baz-20',
        name: 'baz',
        state: {
          index: 0,
          key: 'stack-22',
          routeNames: ['qux', 'lex'],
          routes: [{ key: 'qux-23', name: 'qux' }],
          stale: false,
          type: 'stack',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });

  act(() => ref.current?.navigate('foo'));

  expect(onStateChange).toBeCalledTimes(2);
  expect(onBeforeRemove).toBeCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual({
    index: 2,
    key: 'stack-17',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo-18', name: 'foo' },
      { key: 'bar-19', name: 'bar' },
      {
        key: 'baz-20',
        name: 'baz',
        state: {
          index: 0,
          key: 'stack-22',
          routeNames: ['qux', 'lex'],
          routes: [{ key: 'qux-23', name: 'qux' }],
          stale: false,
          type: 'stack',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });

  shouldPrevent = false;

  act(() => ref.current?.navigate('foo'));

  expect(onStateChange).toBeCalledTimes(3);
  expect(onStateChange).toBeCalledWith({
    index: 0,
    key: 'stack-17',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: 'foo-18', name: 'foo' }],
    stale: false,
    type: 'stack',
  });
});

it("prevents removing a grand child screen with 'beforeRemove' event", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(StackRouter, props);

    return (
      <React.Fragment>
        {state.routes.map((route) => descriptors[route.key].render())}
      </React.Fragment>
    );
  };

  const onBeforeRemove = jest.fn();

  let shouldPrevent = true;

  const TestScreen = (props: any) => {
    React.useEffect(
      () =>
        props.navigation.addListener('beforeRemove', (e: any) => {
          onBeforeRemove();

          if (shouldPrevent) {
            e.preventDefault();
          }
        }),
      [props.navigation]
    );

    return null;
  };

  const onStateChange = jest.fn();

  const ref = React.createRef<NavigationContainerRef>();

  const element = (
    <BaseNavigationContainer ref={ref} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar">{() => null}</Screen>
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux">
                {() => (
                  <TestNavigator>
                    <Screen name="lex" component={TestScreen} />
                  </TestNavigator>
                )}
              </Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  act(() => ref.current?.navigate('bar'));

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).toBeCalledWith({
    index: 1,
    key: 'stack-25',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo-26', name: 'foo' },
      { key: 'bar-27', name: 'bar' },
    ],
    stale: false,
    type: 'stack',
  });

  act(() => ref.current?.navigate('baz'));

  expect(onStateChange).toBeCalledTimes(2);
  expect(onStateChange).toBeCalledWith({
    index: 2,
    key: 'stack-25',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo-26', name: 'foo' },
      { key: 'bar-27', name: 'bar' },
      {
        key: 'baz-28',
        name: 'baz',
        state: {
          index: 0,
          key: 'stack-30',
          routeNames: ['qux'],
          routes: [
            {
              key: 'qux-31',
              name: 'qux',
              state: {
                index: 0,
                key: 'stack-33',
                routeNames: ['lex'],
                routes: [{ key: 'lex-34', name: 'lex' }],
                stale: false,
                type: 'stack',
              },
            },
          ],
          stale: false,
          type: 'stack',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });

  act(() => ref.current?.navigate('foo'));

  expect(onStateChange).toBeCalledTimes(2);
  expect(onBeforeRemove).toBeCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual({
    index: 2,
    key: 'stack-25',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo-26', name: 'foo' },
      { key: 'bar-27', name: 'bar' },
      {
        key: 'baz-28',
        name: 'baz',
        state: {
          index: 0,
          key: 'stack-30',
          routeNames: ['qux'],
          routes: [
            {
              key: 'qux-31',
              name: 'qux',
              state: {
                index: 0,
                key: 'stack-33',
                routeNames: ['lex'],
                routes: [{ key: 'lex-34', name: 'lex' }],
                stale: false,
                type: 'stack',
              },
            },
          ],
          stale: false,
          type: 'stack',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });

  shouldPrevent = false;

  act(() => ref.current?.navigate('foo'));

  expect(onStateChange).toBeCalledTimes(3);
  expect(onStateChange).toBeCalledWith({
    index: 0,
    key: 'stack-25',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: 'foo-26', name: 'foo' }],
    stale: false,
    type: 'stack',
  });
});
