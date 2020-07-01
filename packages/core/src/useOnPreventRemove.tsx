import * as React from 'react';
import type { NavigationState } from '@react-navigation/routers';
import NavigationBuilderContext, {
  ChildBeforeRemoveListener,
} from './NavigationBuilderContext';
import NavigationRouteContext from './NavigationRouteContext';
import type { NavigationEventEmitter } from './useEventEmitter';
import type { EventMapCore } from './types';

type Options = {
  getState: () => NavigationState;
  emitter: NavigationEventEmitter<EventMapCore<any>>;
  beforeRemoveListeners: Record<string, ChildBeforeRemoveListener | undefined>;
};

export default function useOnPreventRemove({
  getState,
  emitter,
  beforeRemoveListeners,
}: Options) {
  const { addKeyedListener } = React.useContext(NavigationBuilderContext);
  const route = React.useContext(NavigationRouteContext);
  const routeKey = route?.key;

  React.useEffect(() => {
    if (routeKey) {
      return addKeyedListener?.('beforeRemove', routeKey, (action) => {
        const state = getState();

        for (const route of state.routes) {
          const event = emitter.emit({
            type: 'beforeRemove',
            target: route.key,
            data: { action },
            canPreventDefault: true,
          });

          if (event.defaultPrevented) {
            return true;
          }

          // We also need to check if any child screens want to prevent it
          const isPrevented = beforeRemoveListeners[route.key]?.(action);

          if (isPrevented) {
            return true;
          }
        }

        return false;
      });
    }
  }, [addKeyedListener, beforeRemoveListeners, emitter, getState, routeKey]);
}
