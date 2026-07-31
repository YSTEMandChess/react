import { environment as devEnvironment } from './environment';
import { environment as prodEnvironment } from './environment.prod';

export const environment = process.env.NODE_ENV === 'production'
    ? prodEnvironment
    : devEnvironment;