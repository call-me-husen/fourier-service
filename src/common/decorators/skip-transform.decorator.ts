import { SetMetadata } from '@nestjs/common';

export const SKIP_TRANSFORM_KEY = 'skipTransform';

/** Apply to a route handler to bypass the global ResponseInterceptor. */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
